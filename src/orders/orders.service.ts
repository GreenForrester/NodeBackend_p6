import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash } from 'crypto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderitem.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItemDto } from './dto/order-item.dto';
import { PaginationDto } from '../common/pagination.dto';
@Injectable()
export class OrdersService {
  constructor(private readonly db: DataSource) {}

  async create(dto: CreateOrderDto, key?: string): Promise<Order> {
    if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key))
      throw new BadRequestException(
        'An 8-128 character Idempotency-Key is required',
      );
    const requestHash = createHash('sha256')
      .update(
        JSON.stringify({
          customerId: dto.customerId,
          shippingDate: dto.shippingDate ?? null,
          comments: dto.comments ?? '',
          items: dto.orderItems
            .map(({ productId, quantity }) => ({ productId, quantity }))
            .sort((a, b) => a.productId.localeCompare(b.productId)),
        }),
      )
      .digest('hex');
    return this.db.transaction(async (manager) => {
      // Serialize retries even when no order row exists yet. Hash collisions only serialize unrelated requests.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [key],
      );
      const orders = manager.getRepository(Order);
      const previous = await orders.findOne({
        where: { idempotencyKey: key },
        withDeleted: true,
        relations: ['orderItems'],
      });
      if (previous) {
        if (previous.requestHash !== requestHash)
          throw new ConflictException(
            'Idempotency key already used for another request',
          );
        return previous;
      }
      if (
        !(await manager
          .getRepository(Customer)
          .existsBy({ customerId: dto.customerId }))
      )
        throw new NotFoundException('Customer not found');
      const order = orders.create({
        customerId: dto.customerId,
        shippingDate: dto.shippingDate ?? null,
        comments: dto.comments ?? '',
        total: 0,
        status: 'pending',
        paid: false,
        idempotencyKey: key,
        requestHash,
      });
      await orders.save(order);
      await this.replaceItems(manager, order, dto.orderItems, []);
      return this.load(manager, order.orderId);
    });
  }

  async findAll(p: PaginationDto) {
    const [items, total] = await this.db.getRepository(Order).findAndCount({
      skip: p.offset,
      take: p.limit,
      order: { orderDate: 'DESC', orderId: 'ASC' },
    });
    return { items, total, offset: p.offset, limit: p.limit };
  }
  async findOne(id: string) {
    return this.load(this.db.manager, id);
  }
  private async load(manager: EntityManager, id: string): Promise<Order> {
    const order = await manager
      .getRepository(Order)
      .findOne({ where: { orderId: id }, relations: ['orderItems'] });
    if (!order) throw new NotFoundException('Order not found');
    // Internal retry metadata must not appear in API responses.
    return order;
  }
  private async locked(manager: EntityManager, id: string) {
    const order = await manager
      .getRepository(Order)
      .findOne({ where: { orderId: id }, lock: { mode: 'pessimistic_write' } });
    if (!order) throw new NotFoundException('Order not found');
    order.orderItems = await manager
      .getRepository(OrderItem)
      .findBy({ orderId: id });
    return order;
  }
  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    return this.db.transaction(async (manager) => {
      const order = await this.locked(manager, id);
      if (order.status !== 'pending')
        throw new ConflictException('Only pending orders can be changed');
      if (
        dto.shippingDate === null ||
        dto.comments === null ||
        dto.status === null ||
        dto.paid === null ||
        dto.orderItems === null
      )
        throw new BadRequestException('Fields cannot be null');
      if (dto.status === 'cancelled' && dto.orderItems)
        throw new BadRequestException('Do not replace items while cancelling');
      if (dto.orderItems && order.paid && dto.paid !== false)
        throw new ConflictException(
          'Clear payment confirmation before changing paid items',
        );
      if (dto.orderItems)
        await this.replaceItems(
          manager,
          order,
          dto.orderItems,
          order.orderItems,
        );
      if (dto.status === 'shipped' && !(dto.paid ?? order.paid))
        throw new ConflictException('Payment must be recorded before shipping');
      if (dto.status === 'cancelled') {
        if (dto.paid ?? order.paid)
          throw new ConflictException(
            'Record a refund before cancelling a paid order',
          );
        await this.adjustStock(manager, order.orderItems, []);
      }
      if (dto.shippingDate !== undefined) order.shippingDate = dto.shippingDate;
      if (dto.comments !== undefined) order.comments = dto.comments;
      if (dto.paid !== undefined) order.paid = dto.paid;
      if (dto.status !== undefined) order.status = dto.status;
      if (order.status === 'shipped' && !order.shippingDate)
        order.shippingDate = new Date();
      await manager.getRepository(Order).save(order);
      return this.load(manager, id);
    });
  }
  async remove(id: string): Promise<void> {
    await this.db.transaction(async (manager) => {
      const order = await this.locked(manager, id);
      if (order.status !== 'cancelled')
        throw new ConflictException('Cancel an order before deleting it');
      // Keep the retry key and historical items; regular reads exclude this tombstone.
      await manager.getRepository(Order).softDelete(id);
    });
  }
  private async adjustStock(
    manager: EntityManager,
    oldItems: OrderItemDto[],
    newItems: OrderItemDto[],
  ) {
    const ids = [
      ...new Set([...oldItems, ...newItems].map((i) => i.productId)),
    ].sort();
    const products = new Map<string, Product>();
    for (const id of ids) {
      const product = await manager.getRepository(Product).findOne({
        where: { productId: id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Product not found');
      const oldQty = oldItems.find((i) => i.productId === id)?.quantity ?? 0;
      const newQty = newItems.find((i) => i.productId === id)?.quantity ?? 0;
      product.quantityInStock += oldQty - newQty;
      if (product.quantityInStock < 0)
        throw new ConflictException(`Insufficient stock for ${id}`);
      await manager.getRepository(Product).save(product);
      products.set(id, product);
    }
    return products;
  }
  private async replaceItems(
    manager: EntityManager,
    order: Order,
    items: OrderItemDto[],
    oldItems: OrderItem[],
  ) {
    if (
      !items.length ||
      items.length > 100 ||
      new Set(items.map((i) => i.productId)).size !== items.length
    )
      throw new BadRequestException('Supply 1-100 distinct products');
    const products = await this.adjustStock(manager, oldItems, items);
    const rows = items.map((item) => {
      const product = products.get(item.productId)!;
      const previous = oldItems.find((i) => i.productId === item.productId);
      return manager.getRepository(OrderItem).create({
        orderId: order.orderId,
        productId: item.productId,
        productName: previous?.productName ?? product.productName,
        quantity: item.quantity,
        unitPrice: previous?.unitPrice ?? product.msrp,
      });
    });
    order.total = rows.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    if (!Number.isSafeInteger(order.total) || order.total > 2147483647)
      throw new BadRequestException('Order total exceeds supported range');
    await manager.getRepository(OrderItem).delete({ orderId: order.orderId });
    await manager.getRepository(OrderItem).save(rows);
    order.orderItems = rows;
    await manager.getRepository(Order).save(order);
  }
}
