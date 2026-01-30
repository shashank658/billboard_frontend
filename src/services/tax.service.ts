import { apiService } from './api';
import type { Tax, PaginationParams, PaginationInfo } from '../types';

export interface TaxResponse {
  data: Tax[];
  pagination: PaginationInfo;
}

export interface TaxDropdownOption {
  id: string;
  name: string;
  percentage: string;
}

export interface CreateTaxDto {
  name: string;
  percentage: number;
  hsnSacCode?: string;
  description?: string;
}

export interface UpdateTaxDto {
  name?: string;
  percentage?: number;
  hsnSacCode?: string;
  description?: string;
  isActive?: boolean;
}

export const taxService = {
  getTaxes: async (params?: PaginationParams) => {
    const response = await apiService.getPaginated<Tax>('/taxes', params);
    return response as unknown as TaxResponse;
  },

  getTaxById: async (id: string) => {
    return apiService.get<Tax>(`/taxes/${id}`);
  },

  createTax: async (data: CreateTaxDto) => {
    return apiService.post<Tax>('/taxes', data);
  },

  updateTax: async (id: string, data: UpdateTaxDto) => {
    return apiService.put<Tax>(`/taxes/${id}`, data);
  },

  deleteTax: async (id: string) => {
    return apiService.delete(`/taxes/${id}`);
  },

  getTaxesDropdown: async () => {
    return apiService.get<TaxDropdownOption[]>('/taxes/dropdown');
  },
};
