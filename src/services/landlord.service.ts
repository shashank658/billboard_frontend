import { apiService } from './api';
import type { Landlord, PaginationParams, PaginationInfo } from '../types';

export interface LandlordResponse {
  data: Landlord[];
  pagination: PaginationInfo;
}

export interface LandlordDropdownOption {
  id: string;
  name: string;
}

export interface CreateLandlordDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  agreementDetails?: string;
  rentAmount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
}

export interface UpdateLandlordDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  agreementDetails?: string;
  rentAmount?: number;
  paymentFrequency?: 'monthly' | 'quarterly' | 'yearly';
  isActive?: boolean;
}

export const landlordService = {
  getLandlords: async (params?: PaginationParams) => {
    const response = await apiService.getPaginated<Landlord>('/landlords', params);
    return response as unknown as LandlordResponse;
  },

  getLandlordById: async (id: string) => {
    return apiService.get<Landlord>(`/landlords/${id}`);
  },

  createLandlord: async (data: CreateLandlordDto) => {
    return apiService.post<Landlord>('/landlords', data);
  },

  updateLandlord: async (id: string, data: UpdateLandlordDto) => {
    return apiService.put<Landlord>(`/landlords/${id}`, data);
  },

  deleteLandlord: async (id: string) => {
    return apiService.delete(`/landlords/${id}`);
  },

  getLandlordsDropdown: async () => {
    return apiService.get<LandlordDropdownOption[]>('/landlords/dropdown');
  },
};
