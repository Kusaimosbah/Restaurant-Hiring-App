/**
 * Domain Types - Business logic models independent of database schema
 * These represent the core business concepts
 */

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: BusinessError;
}

export interface BusinessError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Search and Filter Types
 */
export interface JobSearchCriteria {
  query?: string;
  location?: string;
  jobType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  experienceLevel?: number;
  skills?: string[];
  isUrgent?: boolean;
  radius?: number; // in miles/km
}

export interface UserSearchCriteria {
  role?: 'RESTAURANT_OWNER' | 'WORKER';
  skills?: string[];
  experienceLevel?: number;
  location?: string;
  availability?: string[];
}

/**
 * Event Types for Domain Events
 */
export interface DomainEvent {
  type: string;
  aggregateId: string;
  version: number;
  timestamp: Date;
  data: any;
}

export interface UserRegisteredEvent extends DomainEvent {
  type: 'USER_REGISTERED';
  data: {
    userId: string;
    email: string;
    role: 'RESTAURANT_OWNER' | 'WORKER';
  };
}

export interface JobPostedEvent extends DomainEvent {
  type: 'JOB_POSTED';
  data: {
    jobId: string;
    restaurantId: string;
    title: string;
    isUrgent: boolean;
  };
}