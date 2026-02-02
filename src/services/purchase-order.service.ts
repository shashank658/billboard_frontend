import { apiService } from './api';
import type { PaginationParams, PaginationInfo } from '../types';

export interface PurchaseOrderBooking {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: string;
  slotNumber?: number;
  creativeRef?: string;
  notes?: string;
}

export interface PurchaseOrderCustomer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface PurchaseOrderBillboard {
  id: string;
  name: string;
  code: string;
  type: string;
  address?: string;
  ratePerDay?: string;
}

export interface PurchaseOrderCampaign {
  id: string;
  name: string;
  referenceCode: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  bookingId: string;
  actualStartDate: string;
  actualEndDate: string;
  actualValue: string;
  adjustmentNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  booking: PurchaseOrderBooking;
  customer: PurchaseOrderCustomer;
  billboard: PurchaseOrderBillboard;
  campaign?: PurchaseOrderCampaign;
}

export interface EligibleBooking {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: string;
  slotNumber?: number;
  customer: {
    id: string;
    name: string;
  };
  billboard: {
    id: string;
    name: string;
    code: string;
    type: string;
    ratePerDay: string;
  };
  campaign?: {
    id: string;
    name: string;
    referenceCode: string;
  };
}

export interface CreatePurchaseOrderDto {
  bookingId: string;
  actualStartDate: string;
  actualEndDate: string;
  actualValue?: string;
  adjustmentNotes?: string;
}

export interface UpdatePurchaseOrderDto {
  actualStartDate?: string;
  actualEndDate?: string;
  actualValue?: string;
  adjustmentNotes?: string;
}

export interface ProRataCalculation {
  originalDays: number;
  actualDays: number;
  ratePerDay: number;
  notionalValue: number;
  actualValue: number;
  adjustment: number;
  adjustmentPercentage: string;
}

export interface PurchaseOrdersResponse {
  data: PurchaseOrderWithDetails[];
  pagination: PaginationInfo;
}

export interface PurchaseOrderFilters extends PaginationParams {
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

class PurchaseOrderService {
  async getPurchaseOrders(params: PurchaseOrderFilters = {}): Promise<PurchaseOrdersResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.search) queryParams.append('search', params.search);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await apiService.get<PurchaseOrdersResponse>(
      `/purchase-orders?${queryParams.toString()}`
    );
    return response;
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithDetails> {
    const response = await apiService.get<{ data: PurchaseOrderWithDetails }>(
      `/purchase-orders/${id}`
    );
    return response.data;
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrderWithDetails> {
    const response = await apiService.post<{ data: PurchaseOrderWithDetails }>(
      '/purchase-orders',
      data
    );
    return response.data;
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrderWithDetails> {
    const response = await apiService.put<{ data: PurchaseOrderWithDetails }>(
      `/purchase-orders/${id}`,
      data
    );
    return response.data;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await apiService.delete(`/purchase-orders/${id}`);
  }

  async downloadPDF(id: string, poNumber: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/purchase-orders/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${poNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async getEligibleBookings(customerId?: string): Promise<EligibleBooking[]> {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customerId', customerId);

    const response = await apiService.get<{ data: EligibleBooking[] }>(
      `/purchase-orders/eligible-bookings?${queryParams.toString()}`
    );
    return response.data;
  }

  async calculateProRata(
    bookingId: string,
    actualStartDate: string,
    actualEndDate: string
  ): Promise<ProRataCalculation> {
    const queryParams = new URLSearchParams({
      bookingId,
      actualStartDate,
      actualEndDate,
    });

    const response = await apiService.get<{ data: ProRataCalculation }>(
      `/purchase-orders/calculate-pro-rata?${queryParams.toString()}`
    );
    return response.data;
  }
}

export const purchaseOrderService = new PurchaseOrderService();
