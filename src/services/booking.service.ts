import { apiService } from './api';
import type { PaginationParams, PaginationInfo, BookingStatus } from '../types';

export interface BookingWithDetails {
  id: string;
  referenceCode: string;
  customerId: string;
  campaignId?: string;
  billboardId: string;
  slotNumber?: number;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: BookingStatus;
  creativeRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  billboard?: {
    id: string;
    name: string;
    code: string;
    type: string;
    ratePerDay?: string;
    slotCount?: number;
  };
  campaign?: {
    id: string;
    name: string;
    referenceCode: string;
  };
}

export interface BookingResponse {
  data: BookingWithDetails[];
  pagination: PaginationInfo;
}

export interface CalendarBooking {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate: string;
  slotNumber: number | null;
  status: string;
  customerName: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: Array<{
    id: string;
    referenceCode: string;
    startDate: string;
    endDate: string;
    slotNumber: number | null;
  }>;
}

export interface DateRangeBooking {
  id: string;
  referenceCode: string;
  billboardId: string;
  startDate: string;
  endDate: string;
  slotNumber: number | null;
  status: string;
  customerName: string;
  billboardName: string;
  billboardCode: string;
  billboardType: string;
}

export interface CreateBookingDto {
  customerId: string;
  billboardId: string;
  campaignId?: string;
  slotNumber?: number;
  startDate: string;
  endDate: string;
  notionalValue?: string;
  creativeRef?: string;
  notes?: string;
}

export interface UpdateBookingDto {
  customerId?: string;
  billboardId?: string;
  campaignId?: string | null;
  slotNumber?: number | null;
  startDate?: string;
  endDate?: string;
  notionalValue?: string;
  status?: string;
  creativeRef?: string;
  notes?: string;
}

export interface BookingFilterParams extends PaginationParams {
  customerId?: string;
  billboardId?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export const bookingService = {
  getBookings: async (params?: BookingFilterParams) => {
    const response = await apiService.getPaginated<BookingWithDetails>('/bookings', params);
    return response as unknown as BookingResponse;
  },

  getBookingById: async (id: string) => {
    const response = await apiService.get<BookingWithDetails>(`/bookings/${id}`);
    return response.data as BookingWithDetails;
  },

  createBooking: async (data: CreateBookingDto) => {
    const response = await apiService.post<BookingWithDetails>('/bookings', data);
    return response.data as BookingWithDetails;
  },

  updateBooking: async (id: string, data: UpdateBookingDto) => {
    const response = await apiService.put<BookingWithDetails>(`/bookings/${id}`, data);
    return response.data as BookingWithDetails;
  },

  deleteBooking: async (id: string) => {
    return apiService.delete(`/bookings/${id}`);
  },

  updateBookingStatus: async (id: string, status: string) => {
    const response = await apiService.patch<BookingWithDetails>(`/bookings/${id}/status`, { status });
    return response.data as BookingWithDetails;
  },

  checkAvailability: async (
    billboardId: string,
    startDate: string,
    endDate: string,
    slotNumber?: number,
    excludeBookingId?: string
  ) => {
    const params = new URLSearchParams({
      billboardId,
      startDate,
      endDate,
    });
    if (slotNumber !== undefined) {
      params.append('slotNumber', String(slotNumber));
    }
    if (excludeBookingId) {
      params.append('excludeBookingId', excludeBookingId);
    }
    const response = await apiService.get<AvailabilityResult>(`/bookings/availability?${params}`);
    return response.data as AvailabilityResult;
  },

  getCalendarBookings: async (billboardId: string, year: number, month: number) => {
    const response = await apiService.get<CalendarBooking[]>(
      `/bookings/calendar/${billboardId}?year=${year}&month=${month}`
    );
    return response.data as CalendarBooking[];
  },

  getBookingsForDateRange: async (
    startDate: string,
    endDate: string,
    billboardIds?: string[]
  ) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (billboardIds && billboardIds.length > 0) {
      params.append('billboardIds', billboardIds.join(','));
    }
    const response = await apiService.get<DateRangeBooking[]>(`/bookings/date-range?${params}`);
    return response.data as DateRangeBooking[];
  },

  shortCloseBooking: async (id: string, actualEndDate: string, reason: string) => {
    const response = await apiService.post<BookingWithDetails>(`/bookings/${id}/short-close`, {
      actualEndDate,
      reason,
    });
    return response.data as BookingWithDetails;
  },
};
