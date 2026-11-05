import { MigrationInterface, QueryRunner } from 'typeorm';
export class InitialSchema1793894400000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE customer (
      "customerId" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "customerName" varchar NOT NULL, cemail varchar NOT NULL UNIQUE,
      phone varchar NOT NULL, address varchar NOT NULL, city varchar NOT NULL, "postalCode" varchar NOT NULL, country varchar NOT NULL,
      "creationDate" timestamptz NOT NULL DEFAULT now(), "modificationDate" timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE INDEX ON customer ("customerName")`);
    await q.query(`CREATE TABLE product (
      "productId" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "productName" varchar NOT NULL, productvendor varchar NOT NULL,
      "productDescription" varchar NOT NULL, "quantityInStock" integer NOT NULL CHECK ("quantityInStock" >= 0),
      "buyPrice" integer NOT NULL CHECK ("buyPrice" >= 0), msrp integer NOT NULL CHECK (msrp >= 0),
      "creationDate" timestamptz NOT NULL DEFAULT now(), "modificationDate" timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE TABLE "order" (
      "orderId" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "deletedAt" timestamptz, "orderDate" timestamptz NOT NULL DEFAULT now(), "modificationDate" timestamptz NOT NULL DEFAULT now(),
      "customerId" uuid NOT NULL REFERENCES customer("customerId") ON DELETE RESTRICT,
      "shippingDate" timestamptz, status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'cancelled')),
      comments varchar NOT NULL DEFAULT '', total integer NOT NULL CHECK (total >= 0), paid boolean NOT NULL DEFAULT false,
      "idempotencyKey" varchar(128) NOT NULL UNIQUE, "requestHash" varchar(64) NOT NULL)`);
    await q.query(`CREATE INDEX ON "order" ("customerId", "orderDate")`);
    await q.query(`CREATE TABLE order_item (
      "orderItemId" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "productId" uuid NOT NULL REFERENCES product("productId") ON DELETE RESTRICT,
      "productName" varchar NOT NULL, quantity integer NOT NULL CHECK (quantity > 0), "unitPrice" integer NOT NULL CHECK ("unitPrice" >= 0),
      "orderId" uuid NOT NULL REFERENCES "order"("orderId") ON DELETE CASCADE, UNIQUE ("orderId", "productId"))`);
    await q.query(`CREATE INDEX ON order_item ("productId")`);
  }
  async down(): Promise<void> {
    throw new Error(
      'Destructive rollback is disabled; restore a verified database backup',
    );
  }
}
