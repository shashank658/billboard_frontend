// Common types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission extends BaseEntity {
  name: string;
  module: string;
  action: string;
  description?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Location types
export interface Region extends BaseEntity {
  name: string;
  code: string;
}

export interface City extends BaseEntity {
  name: string;
  code: string;
  regionId: string;
  region?: Region;
}

export interface Zone extends BaseEntity {
  name: string;
  code: string;
  cityId: string;
  city?: City;
}

// Billboard types
export type BillboardType = "static" | "digital";
export type BillboardStatus = "active" | "inactive" | "maintenance";

export interface Billboard extends BaseEntity {
  name: string;
  code: string;
  type: BillboardType;
  status: BillboardStatus;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  latitude?: number;
  longitude?: number;
  address: string;
  illumination?: string;
  installationDate?: string;
  ratePerDay: number;
  // Digital specific
  loopDuration?: number;
  slotCount?: number;
  slotDuration?: number;
  // Relations
  zoneId: string;
  zone?: Zone;
  landlordId: string;
  landlord?: Landlord;
}

// Landlord types
export interface Landlord extends BaseEntity {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  rentAmount: number;
  paymentFrequency: "monthly" | "quarterly" | "yearly";
  isActive: boolean;
}

// Customer types
export interface Customer extends BaseEntity {
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
  isActive: boolean;
}

// Booking types
export type BookingStatus =
  | "created"
  | "confirmed"
  | "active"
  | "completed"
  | "po_generated"
  | "invoiced";

export interface Booking extends BaseEntity {
  referenceCode: string;
  customerId: string;
  customer?: Customer;
  campaignId?: string;
  campaign?: Campaign;
  billboardId: string;
  billboard?: Billboard;
  slotNumber?: number;
  startDate: string;
  endDate: string;
  notionalValue: number;
  status: BookingStatus;
  creativeRef?: string;
}

// Campaign types
export interface Campaign extends BaseEntity {
  referenceCode: string;
  name: string;
  customerId: string;
  customer?: Customer;
  description?: string;
  totalValue: number;
  bookings?: Booking[];
}

// Tax types
export interface Tax extends BaseEntity {
  name: string;
  percentage: number;
  hsnSacCode?: string;
  description?: string;
  isActive: boolean;
}

// Invoice types
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  taxId?: string;
  tax?: Tax;
}

// Purchase Order types
export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  bookingId: string;
  booking?: Booking;
  actualStartDate: string;
  actualEndDate: string;
  actualValue: number;
  adjustmentNotes?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
