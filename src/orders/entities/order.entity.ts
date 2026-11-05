import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Check,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './orderitem.entity';
@Entity()
@Index(['customerId', 'orderDate'])
@Check(`"total" >= 0`)
@Check(`"status" IN ('pending', 'shipped', 'cancelled')`)
export class Order {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
  @PrimaryGeneratedColumn('uuid') orderId!: string;
  @CreateDateColumn({ type: 'timestamptz' }) orderDate!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) modificationDate!: Date;
  @Column('uuid') customerId!: string;
  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;
  @Column({ type: 'timestamptz', nullable: true }) shippingDate!: Date | null;
  @Column({ default: 'pending' }) status!: 'pending' | 'shipped' | 'cancelled';
  @Column({ default: '' }) comments!: string;
  @Column('int') total!: number;
  @OneToMany(() => OrderItem, (item) => item.order) orderItems!: OrderItem[];
  @Column({ default: false }) paid!: boolean;
  @Exclude()
  @Column({ type: 'varchar', length: 128, unique: true })
  idempotencyKey!: string;
  @Exclude() @Column({ type: 'varchar', length: 64 }) requestHash!: string;
}
