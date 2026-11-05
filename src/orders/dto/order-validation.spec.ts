import { ValidationPipe } from '@nestjs/common';
import { CreateOrderDto } from './create-order.dto';
import { UpdateOrderDto } from './update-order.dto';
const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const productId = '15ab24ab-1d5a-4c59-bb3d-d505aa538169';
const customerId = '25ab24ab-1d5a-4c59-bb3d-d505aa538169';
describe('order contracts', () => {
  it('accepts new items without client-generated IDs and transforms shipping dates', async () => {
    const dto = await pipe.transform(
      {
        customerId,
        shippingDate: '2026-11-06T00:00:00Z',
        orderItems: [{ productId, quantity: 1 }],
      },
      { type: 'body', metatype: CreateOrderDto },
    );
    expect(dto.shippingDate).toBeInstanceOf(Date);
  });
  it.each([
    { total: 1 },
    { paid: true },
    { orderItems: [{ productId, quantity: 0.5 }] },
    { orderItems: [{ productId, quantity: 1, orderItemId: productId }] },
  ])('rejects forged or invalid fields: %j', async (payload) => {
    await expect(
      pipe.transform(
        { customerId, orderItems: [{ productId, quantity: 1 }], ...payload },
        { type: 'body', metatype: CreateOrderDto },
      ),
    ).rejects.toThrow();
  });
  it('allows a header-only partial update', async () => {
    await expect(
      pipe.transform(
        { comments: 'changed' },
        { type: 'body', metatype: UpdateOrderDto },
      ),
    ).resolves.toMatchObject({ comments: 'changed' });
  });
});
