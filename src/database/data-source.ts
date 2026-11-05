import 'reflect-metadata';
import { DataSourceOptions } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/orderitem.entity';
import { required, integer } from '../config';
import { InitialSchema1793894400000 } from './migrations/1793894400000-InitialSchema';
export function databaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    host: required('DB_HOST'),
    port: integer('DB_PORT', 5432),
    username: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    entities: [Customer, Product, Order, OrderItem],
    migrations: [InitialSchema1793894400000],
    extra: {
      max: 10,
      connectionTimeoutMillis: 5000,
      options: '-c statement_timeout=15000 -c lock_timeout=10000',
    },
    synchronize: false,
    migrationsRun: false,
  };
}
