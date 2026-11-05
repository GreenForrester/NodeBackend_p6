import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/pagination.dto';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repository: Repository<Product>,
  ) {}
  async create(dto: CreateProductDto): Promise<Product> {
    return this.repository.save(this.repository.create(dto));
  }
  async findAll(p: PaginationDto) {
    const [items, total] = await this.repository.findAndCount({
      skip: p.offset,
      take: p.limit,
      order: { productId: 'ASC' },
    });
    return { items, total, offset: p.offset, limit: p.limit };
  }
  async findOne(id: string): Promise<Product> {
    const item = await this.repository.findOneBy({ productId: id });
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (Object.keys(dto).length) {
      const result = await this.repository.update(id, dto);
      if (!result.affected) throw new NotFoundException('Product not found');
    }
    return this.findOne(id);
  }
  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundException('Product not found');
  }
}
