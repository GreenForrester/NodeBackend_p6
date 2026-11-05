import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../common/pagination.dto';
@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}
  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.repository.save(this.repository.create(dto));
  }
  async findAll(p: PaginationDto) {
    const [items, total] = await this.repository.findAndCount({
      skip: p.offset,
      take: p.limit,
      order: { customerId: 'ASC' },
    });
    return { items, total, offset: p.offset, limit: p.limit };
  }
  async findOne(id: string): Promise<Customer> {
    const item = await this.repository.findOneBy({ customerId: id });
    if (!item) throw new NotFoundException('Customer not found');
    return item;
  }
  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (Object.keys(dto).length) {
      const result = await this.repository.update(id, dto);
      if (!result.affected) throw new NotFoundException('Customer not found');
    }
    return this.findOne(id);
  }
  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (!result.affected) throw new NotFoundException('Customer not found');
  }
}
