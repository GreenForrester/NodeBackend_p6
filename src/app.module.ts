import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { DatabaseExceptionFilter } from './common/filters/database-exception/database-exception.filter';
import { AuthGuard } from './common/auth.guard';
import { databaseOptions } from './database/data-source';
import { HealthController } from './health.controller';
@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    TypeOrmModule.forRootAsync({ useFactory: databaseOptions }),
    ProductsModule,
    CustomersModule,
    OrdersModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: DatabaseExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('{*path}');
  }
}
