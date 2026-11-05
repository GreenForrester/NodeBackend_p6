import { DataSource } from 'typeorm';
import { databaseOptions } from './data-source';
export default new DataSource(databaseOptions());
