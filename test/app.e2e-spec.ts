import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setup } from '../src/setup';
import { Product } from '../src/products/entities/product.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Order } from '../src/orders/entities/order.entity';
// This suite requires a dedicated empty PostgreSQL database. Never point it at application data.
describe('PostgreSQL API integration', () => {
  let app: INestApplication;
  let db: DataSource;
  let customerId: string;
  let productId: string;
  const write = 'w'.repeat(40);
  const read = 'r'.repeat(40);
  beforeAll(async () => {
    if (!process.env.DB_NAME?.endsWith('_test'))
      throw new Error('DB_NAME must end in _test');
    process.env.API_WRITE_KEY = write;
    process.env.API_READ_KEY = read;
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    setup(app);
    db = app.get(DataSource);
    await db.runMigrations();
    await db.query('TRUNCATE order_item, "order", product, customer CASCADE');
    await app.init();
    customerId = (
      await db.getRepository(Customer).save({
        customerName: 'Test',
        cemail: 'test@example.com',
        phone: '+923001234567',
        address: '1 Main',
        city: 'Karachi',
        postalCode: '74000',
        country: 'PK',
      })
    ).customerId;
    productId = (
      await db.getRepository(Product).save({
        productName: 'Test',
        productvendor: 'Vendor',
        productDescription: '',
        quantityInStock: 10,
        buyPrice: 100,
        msrp: 150,
      })
    ).productId;
  }, 60000);
  afterAll(async () => {
    if (app) await app.close();
  });
  const payload = () => ({
    customerId,
    orderItems: [{ productId, quantity: 2 }],
  });
  const post = (key: string, body = payload()) =>
    request(app.getHttpServer())
      .post('/v1/api/orders')
      .set('x-api-key', write)
      .set('idempotency-key', key)
      .send(body);
  it('enforces authentication and read-only permissions', async () => {
    await request(app.getHttpServer()).get('/v1/api/customers').expect(401);
    await request(app.getHttpServer())
      .post('/v1/api/customers')
      .set('x-api-key', read)
      .send({})
      .expect(403);
    await request(app.getHttpServer()).get('/v1/api/health/ready').expect(200);
  });
  it('retries atomically without reserving stock twice', async () => {
    const [a, b] = await Promise.all([
      post('retry-key-001'),
      post('retry-key-001'),
    ]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.orderId).toBe(b.body.orderId);
    expect(a.body.total).toBe(300);
    const permuted = await post('retry-key-001', {
      orderItems: [{ quantity: 2, productId }],
      customerId,
    }).expect(201);
    expect(permuted.body.orderId).toBe(a.body.orderId);
    expect(a.body.requestHash).toBeUndefined();
    expect(
      (await db.getRepository(Product).findOneByOrFail({ productId }))
        .quantityInStock,
    ).toBe(8);
    await post('retry-key-001', {
      customerId,
      orderItems: [{ productId, quantity: 3 }],
    }).expect(409);
  });
  it('rolls back an entire creation when stock is insufficient', async () => {
    const count = await db.getRepository(Order).count();
    await post('no-stock-key', {
      customerId,
      orderItems: [{ productId, quantity: 99 }],
    }).expect(409);
    expect(await db.getRepository(Order).count()).toBe(count);
  });
  it('supports comments-only, items-only and missing-order patches', async () => {
    const created = await post('patch-key-001').expect(201);
    const url = `/v1/api/orders/${created.body.orderId}`;
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ comments: 'updated' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ orderItems: [{ productId, quantity: 1 }] })
      .expect(200);
    await request(app.getHttpServer())
      .patch('/v1/api/orders/00000000-0000-4000-8000-000000000001')
      .set('x-api-key', write)
      .send({ comments: 'x' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({
        orderItems: [
          {
            productId,
            quantity: 1,
            orderItemId: created.body.orderItems[0].orderItemId,
          },
        ],
      })
      .expect(400);
  });
  it('cancels once, restores stock and soft-deletes while retaining retry protection', async () => {
    const created = await post('cancel-key-001').expect(201);
    const url = `/v1/api/orders/${created.body.orderId}`;
    const before = (
      await db.getRepository(Product).findOneByOrFail({ productId })
    ).quantityInStock;
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ status: 'cancelled' })
      .expect(200);
    expect(
      (await db.getRepository(Product).findOneByOrFail({ productId }))
        .quantityInStock,
    ).toBe(before + 2);
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ status: 'cancelled' })
      .expect(409);
    await request(app.getHttpServer())
      .delete(url)
      .set('x-api-key', write)
      .expect(200);
    await request(app.getHttpServer())
      .get(url)
      .set('x-api-key', read)
      .expect(404);
    const retry = await post('cancel-key-001').expect(201);
    expect(retry.body.orderId).toBe(created.body.orderId);
    expect(
      (await db.getRepository(Product).findOneByOrFail({ productId }))
        .quantityInStock,
    ).toBe(before + 2);
  });
  it('validates pagination and IDs and preserves referenced history', async () => {
    await request(app.getHttpServer())
      .get('/v1/api/products?limit=101')
      .set('x-api-key', read)
      .expect(400);
    await request(app.getHttpServer())
      .get('/v1/api/products/not-a-uuid')
      .set('x-api-key', read)
      .expect(400);
    await request(app.getHttpServer())
      .get('/v1/api/products/00000000-0000-4000-8000-000000000001')
      .set('x-api-key', read)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/v1/api/products/${productId}`)
      .set('x-api-key', write)
      .expect(409);
    await request(app.getHttpServer())
      .delete(`/v1/api/customers/${customerId}`)
      .set('x-api-key', write)
      .expect(409);
  });
  it('keeps paid order contents frozen until payment confirmation is cleared', async () => {
    const created = await post('payment-key-001').expect(201);
    const url = `/v1/api/orders/${created.body.orderId}`;
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ paid: true })
      .expect(200);
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ orderItems: [{ productId, quantity: 1 }] })
      .expect(409);
    await request(app.getHttpServer())
      .patch(url)
      .set('x-api-key', write)
      .send({ paid: false, orderItems: [{ productId, quantity: 1 }] })
      .expect(200);
  });
  it('prevents overselling under concurrent requests', async () => {
    const p = await db.getRepository(Product).save({
      productName: 'Limited',
      productvendor: 'Vendor',
      productDescription: '',
      quantityInStock: 1,
      buyPrice: 1,
      msrp: 2,
    });
    const body = {
      customerId,
      orderItems: [{ productId: p.productId, quantity: 1 }],
    };
    const responses = await Promise.all([
      post('race-key-001', body),
      post('race-key-002', body),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      (
        await db
          .getRepository(Product)
          .findOneByOrFail({ productId: p.productId })
      ).quantityInStock,
    ).toBe(0);
  });
});
