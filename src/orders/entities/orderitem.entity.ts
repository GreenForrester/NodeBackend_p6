import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Check,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
@Entity()
@Check(`"quantity" > 0 AND "unitPrice" >= 0`)
@Index(['orderId', 'productId'], { unique: true })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid') orderItemId!: string;
  @Index() @Column('uuid') productId!: string;
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'productId' })
  product!: Product;
  @Column() productName!: string;
  @Column('int') quantity!: number;
  @Column('int') unitPrice!: number;
  @Column('uuid') orderId!: string;
  @ManyToOne(() => Order, (order) => order.orderItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}
