import { apiService } from './api';
import type { PaginationParams, PaginationInfo } from '../types';

export interface Campaign {
  id: string;
  referenceCode: string;
  name: string;
  customerId: string;
  description?: string;
  totalValue: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CampaignWithDetails extends Campaign {
  customer?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  bookings?: CampaignBooking[];
  bookingCount?: number;
}

export interface CampaignBooking {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: string;
  slotNumber?: number;
  billboard?: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
}

export interface AvailableBooking {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: string;
  billboard?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AvailableBillboard {
  id: string;
  name: string;
  code: string;
  type: 'static' | 'digital';
  status: string;
  ratePerDay: string;
  slotCount?: number;
  width: number;
  height: number;
  address: string;
  isAvailable: boolean;
  availableSlots: number[];
  conflicts: Array<{
    id: string;
    referenceCode: string;
    startDate: string;
    endDate: string;
    slotNumber: number | null;
  }>;
}

export interface CampaignResponse {
  data: CampaignWithDetails[];
  pagination: PaginationInfo;
}

export interface BillboardSelection {
  billboardId: string;
  slotNumber?: number;
}

export interface CreateCampaignDto {
  name: string;
  customerId: string;
  description?: string;
  startDate: string;
  endDate: string;
  billboards: BillboardSelection[];
}

export interface UpdateCampaignDto {
  name?: string;
  customerId?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CampaignFilterParams extends PaginationParams {
  customerId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export const campaignService = {
  getCampaigns: async (params?: CampaignFilterParams) => {
    const response = await apiService.getPaginated<CampaignWithDetails>('/campaigns', params);
    return response as unknown as CampaignResponse;
  },

  getCampaignById: async (id: string) => {
    const response = await apiService.get<CampaignWithDetails>(`/campaigns/${id}`);
    return response.data as CampaignWithDetails;
  },

  createCampaign: async (data: CreateCampaignDto) => {
    const response = await apiService.post<CampaignWithDetails>('/campaigns', data);
    return response.data as CampaignWithDetails;
  },

  updateCampaign: async (id: string, data: UpdateCampaignDto) => {
    const response = await apiService.put<CampaignWithDetails>(`/campaigns/${id}`, data);
    return response.data as CampaignWithDetails;
  },

  deleteCampaign: async (id: string) => {
    return apiService.delete(`/campaigns/${id}`);
  },

  addBookingToCampaign: async (campaignId: string, bookingId: string) => {
    const response = await apiService.post<CampaignWithDetails>(`/campaigns/${campaignId}/bookings`, { bookingId });
    return response.data as CampaignWithDetails;
  },

  removeBookingFromCampaign: async (campaignId: string, bookingId: string) => {
    const response = await apiService.delete<CampaignWithDetails>(`/campaigns/${campaignId}/bookings/${bookingId}`);
    return response.data as CampaignWithDetails;
  },

  getAvailableBookings: async (customerId: string, excludeCampaignId?: string) => {
    const params = new URLSearchParams({ customerId });
    if (excludeCampaignId) {
      params.append('excludeCampaignId', excludeCampaignId);
    }
    const response = await apiService.get<AvailableBooking[]>(`/campaigns/available-bookings?${params}`);
    return response.data as AvailableBooking[];
  },

  getAvailableBillboards: async (startDate: string, endDate: string) => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await apiService.get<AvailableBillboard[]>(`/campaigns/available-billboards?${params}`);
    return response.data as AvailableBillboard[];
  },
};
