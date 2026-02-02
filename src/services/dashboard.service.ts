import { apiService } from './api';

export interface DashboardStats {
  totalBillboards: number;
  activeBillboards: number;
  totalBookings: number;
  activeBookings: number;
  totalCustomers: number;
  activeCustomers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
}

export interface RecentBooking {
  id: string;
  referenceCode: string;
  customerName: string;
  billboardName: string;
  billboardCode: string;
  startDate: string;
  endDate: string;
  notionalValue: string;
  status: string;
}

export interface OccupancyData {
  billboardId: string;
  billboardName: string;
  billboardCode: string;
  billboardType: string;
  totalDays: number;
  bookedDays: number;
  occupancyRate: number;
}

export interface RevenueByMonth {
  month: string;
  year: number;
  revenue: number;
  bookingCount: number;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await apiService.get<DashboardStats>('/dashboard/stats');
    return response.data as DashboardStats;
  }

  async getRecentBookings(limit: number = 5): Promise<RecentBooking[]> {
    const response = await apiService.get<RecentBooking[]>(
      `/dashboard/recent-bookings?limit=${limit}`
    );
    return response.data as RecentBooking[];
  }

  async getOccupancyRates(startDate: string, endDate: string): Promise<OccupancyData[]> {
    const response = await apiService.get<OccupancyData[]>(
      `/dashboard/occupancy?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data as OccupancyData[];
  }

  async getRevenueByMonth(months: number = 6): Promise<RevenueByMonth[]> {
    const response = await apiService.get<RevenueByMonth[]>(
      `/dashboard/revenue-by-month?months=${months}`
    );
    return response.data as RevenueByMonth[];
  }

  async getUpcomingBookings(days: number = 7): Promise<RecentBooking[]> {
    const response = await apiService.get<RecentBooking[]>(
      `/dashboard/upcoming-bookings?days=${days}`
    );
    return response.data as RecentBooking[];
  }
}

export const dashboardService = new DashboardService();
