import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';

@Entity()
@Check(`"quantityInStock" >= 0 AND "buyPrice" >= 0 AND "msrp" >= 0`)
export class Product {
  @PrimaryGeneratedColumn('uuid')
  productId!: string;

  @Column()
  productName!: string;

  @Column()
  productvendor!: string;

  @Column()
  productDescription!: string;

  @Column()
  quantityInStock!: number;

  @Column('int')
  buyPrice!: number;

  @Column('int')
  msrp!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creationDate!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  modificationDate!: Date;
}
