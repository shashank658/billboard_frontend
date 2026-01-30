import { apiService } from './api';
import type { Customer, PaginationParams, PaginationInfo } from '../types';

export interface CustomerResponse {
  data: Customer[];
  pagination: PaginationInfo;
}

export interface CustomerDropdownOption {
  id: string;
  name: string;
}

export interface CreateCustomerDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  billingAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  billingAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  isActive?: boolean;
}

export const customerService = {
  getCustomers: async (params?: PaginationParams) => {
    const response = await apiService.getPaginated<Customer>('/customers', params);
    return response as unknown as CustomerResponse;
  },

  getCustomerById: async (id: string) => {
    return apiService.get<Customer>(`/customers/${id}`);
  },

  createCustomer: async (data: CreateCustomerDto) => {
    return apiService.post<Customer>('/customers', data);
  },

  updateCustomer: async (id: string, data: UpdateCustomerDto) => {
    return apiService.put<Customer>(`/customers/${id}`, data);
  },

  deleteCustomer: async (id: string) => {
    return apiService.delete(`/customers/${id}`);
  },

  getCustomersDropdown: async () => {
    return apiService.get<CustomerDropdownOption[]>('/customers/dropdown');
  },
};
