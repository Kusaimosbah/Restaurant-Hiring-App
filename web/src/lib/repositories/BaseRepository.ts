import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Base Repository class providing common database operations
 * All repositories should extend this class for consistency
 */
export abstract class BaseRepository<T> {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Find a record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find multiple records with optional filters
   */
  abstract findMany(filters?: FindOptions): Promise<T[]>;

  /**
   * Create a new record
   */
  abstract create(data: any): Promise<T>;

  /**
   * Update an existing record
   */
  abstract update(id: string, data: any): Promise<T>;

  /**
   * Delete a record by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Count records with optional filters
   */
  abstract count(filters?: any): Promise<number>;
}

/**
 * Repository result types for consistent API responses
 */
export type RepositoryResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

/**
 * Common repository options
 */
export type FindOptions = {
  page?: number;
  limit?: number;
  orderBy?: any;
  include?: any;
  where?: any;
};