import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  customerId!: string;

  @Index()
  @Column()
  customerName!: string;

  @Column({ unique: true })
  cemail!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  postalCode!: string;

  @Column()
  country!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationDate!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  modificationDate!: Date;

  //customer has many orders
  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];
}
