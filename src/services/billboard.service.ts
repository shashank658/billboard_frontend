import { apiService } from './api';
import type { Billboard, PaginationParams, PaginationInfo } from '../types';

export type BillboardType = 'static' | 'digital';
export type BillboardStatus = 'active' | 'inactive' | 'maintenance';
export type Orientation = 'portrait' | 'landscape';

export interface BillboardWithRelations extends Omit<Billboard, 'zone' | 'landlord'> {
  description?: string | null;
  zone: { id: string; name: string; code: string } | null;
  city: { id: string; name: string; code: string } | null;
  region: { id: string; name: string; code: string } | null;
  landlord: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  } | null;
}

export interface BillboardResponse {
  data: BillboardWithRelations[];
  pagination: PaginationInfo;
}

export interface BillboardDropdownOption {
  id: string;
  name: string;
  code: string;
  type: BillboardType;
}

export interface BillboardStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  static: number;
  digital: number;
}

export interface CreateBillboardDto {
  name: string;
  code: string;
  description?: string;
  type: BillboardType;
  status?: BillboardStatus;
  width: number;
  height: number;
  orientation?: Orientation;
  zoneId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  illumination?: string;
  installationDate?: string;
  landlordId: string;
  ratePerDay: number;
  loopDuration?: number;
  slotCount?: number;
  slotDuration?: number;
}

export interface UpdateBillboardDto {
  name?: string;
  code?: string;
  description?: string;
  type?: BillboardType;
  status?: BillboardStatus;
  width?: number;
  height?: number;
  orientation?: Orientation;
  zoneId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  illumination?: string;
  installationDate?: string;
  landlordId?: string;
  ratePerDay?: number;
  loopDuration?: number;
  slotCount?: number;
  slotDuration?: number;
}

export interface BillboardFilters extends PaginationParams {
  type?: BillboardType;
  status?: BillboardStatus;
  zoneId?: string;
  cityId?: string;
  regionId?: string;
  landlordId?: string;
}

export const billboardService = {
  getBillboards: async (filters?: BillboardFilters) => {
    const response = await apiService.getPaginated<BillboardWithRelations>('/billboards', filters);
    return response as unknown as BillboardResponse;
  },

  getBillboardById: async (id: string) => {
    return apiService.get<BillboardWithRelations>(`/billboards/${id}`);
  },

  createBillboard: async (data: CreateBillboardDto) => {
    return apiService.post<BillboardWithRelations>('/billboards', data);
  },

  updateBillboard: async (id: string, data: UpdateBillboardDto) => {
    return apiService.put<BillboardWithRelations>(`/billboards/${id}`, data);
  },

  deleteBillboard: async (id: string) => {
    return apiService.delete(`/billboards/${id}`);
  },

  getBillboardsDropdown: async (zoneId?: string) => {
    return apiService.get<BillboardDropdownOption[]>('/billboards/dropdown', { zoneId });
  },

  getBillboardStats: async () => {
    return apiService.get<BillboardStats>('/billboards/stats');
  },
};
