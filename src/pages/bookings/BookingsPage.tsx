import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Clock,
  User,
  Monitor,
  StopCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  bookingService,
  type CreateBookingDto,
  type BookingWithDetails,
  type DateRangeBooking,
} from '@/services/booking.service';
import { billboardService, type BillboardWithRelations } from '@/services/billboard.service';
import { customerService, type CustomerDropdownOption } from '@/services/customer.service';
import type { PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

const initialFormData: CreateBookingDto = {
  customerId: '',
  billboardId: '',
  startDate: '',
  endDate: '',
  slotNumber: undefined,
  creativeRef: '',
  notes: '',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  active: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  po_generated: 'bg-purple-100 text-purple-800',
  invoiced: 'bg-teal-100 text-teal-800',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BookingsPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<DateRangeBooking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBillboard, setSelectedBillboard] = useState<string>('');

  // Dropdown data
  const [billboards, setBillboards] = useState<BillboardWithRelations[]>([]);
  const [customers, setCustomers] = useState<CustomerDropdownOption[]>([]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isShortCloseOpen, setIsShortCloseOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [formData, setFormData] = useState<CreateBookingDto>(initialFormData);
  const [shortCloseData, setShortCloseData] = useState({ actualEndDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 2;

  // Selected billboard for form
  const [selectedFormBillboard, setSelectedFormBillboard] = useState<BillboardWithRelations | null>(null);

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [billboardRes, customerRes] = await Promise.all([
          billboardService.getBillboards({ pageSize: 1000 }),
          customerService.getCustomersDropdown(),
        ]);
        setBillboards(billboardRes?.data || []);
        // customerRes is ApiResponse, extract .data
        const customersData = (customerRes as any)?.data || customerRes;
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } catch (err) {
        console.error('Failed to load dropdown data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load dropdown data',
          variant: 'destructive',
        });
        setBillboards([]);
        setCustomers([]);
      }
    };
    loadDropdownData();
  }, [toast]);

  const fetchBookings = useCallback(async () => {
    if (viewMode === 'list') {
      try {
        setLoading(true);
        const response = await bookingService.getBookings({
          page: pagination.page,
          pageSize: pagination.pageSize,
          status: statusFilter || undefined,
        });
        setBookings(response?.data || []);
        if (response?.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch bookings',
          variant: 'destructive',
        });
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.pageSize, statusFilter, viewMode, toast]);

  const fetchCalendarBookings = useCallback(async () => {
    if (viewMode === 'calendar') {
      try {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const response = await bookingService.getBookingsForDateRange(
          startDate,
          endDate,
          selectedBillboard ? [selectedBillboard] : undefined
        );
        setCalendarBookings(response || []);
      } catch (err) {
        console.error('Failed to fetch calendar bookings:', err);
        toast({
          title: 'Error',
          description: 'Failed to fetch calendar bookings',
          variant: 'destructive',
        });
        setCalendarBookings([]);
      } finally {
        setLoading(false);
      }
    }
  }, [currentDate, selectedBillboard, viewMode, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchCalendarBookings();
  }, [fetchCalendarBookings]);

  // Calendar data
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDateString(date);
    return calendarBookings.filter(b => {
      return dateStr >= b.startDate && dateStr <= b.endDate;
    });
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      await bookingService.createBooking(formData);
      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });
      setIsCreateOpen(false);
      setFormData(initialFormData);
      setFormStep(1);
      setSelectedFormBillboard(null);
      fetchBookings();
      fetchCalendarBookings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;
    try {
      setSaving(true);
      await bookingService.updateBooking(selectedBooking.id, formData);
      toast({
        title: 'Success',
        description: 'Booking updated successfully',
      });
      setIsEditOpen(false);
      setSelectedBooking(null);
      setFormData(initialFormData);
      setFormStep(1);
      setSelectedFormBillboard(null);
      fetchBookings();
      fetchCalendarBookings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    try {
      setSaving(true);
      await bookingService.deleteBooking(selectedBooking.id);
      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedBooking(null);
      fetchBookings();
      fetchCalendarBookings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShortClose = async () => {
    if (!selectedBooking) return;
    try {
      setSaving(true);
      await bookingService.shortCloseBooking(
        selectedBooking.id,
        shortCloseData.actualEndDate,
        shortCloseData.reason
      );
      toast({
        title: 'Success',
        description: 'Booking short closed successfully',
      });
      setIsShortCloseOpen(false);
      setSelectedBooking(null);
      setShortCloseData({ actualEndDate: '', reason: '' });
      fetchBookings();
      fetchCalendarBookings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to short close booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openShortCloseDialog = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    // Set default actual end date to today or start date (whichever is later)
    const today = new Date();
    const startDate = new Date(booking.startDate);
    const defaultDate = today > startDate ? today : startDate;
    setShortCloseData({
      actualEndDate: defaultDate.toISOString().split('T')[0],
      reason: '',
    });
    setIsShortCloseOpen(true);
  };

  const canShortClose = (booking: BookingWithDetails) => {
    return ['created', 'confirmed', 'active'].includes(booking.status);
  };

  const canEditBooking = (booking: BookingWithDetails) => {
    // Cannot edit completed, po_generated, or invoiced bookings
    return !['completed', 'po_generated', 'invoiced'].includes(booking.status);
  };

  const openEditDialog = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    const bb = billboards.find(b => b.id === booking.billboardId);
    setSelectedFormBillboard(bb || null);
    setFormData({
      customerId: booking.customerId,
      billboardId: booking.billboardId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      slotNumber: booking.slotNumber ?? undefined,
      creativeRef: booking.creativeRef || '',
      notes: (booking as any).notes || '',
    });
    setFormStep(1);
    setIsEditOpen(true);
  };

  const openViewDialog = async (booking: BookingWithDetails) => {
    try {
      const fullBooking = await bookingService.getBookingById(booking.id);
      setSelectedBooking(fullBooking);
      setIsViewOpen(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load booking details',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsDeleteOpen(true);
  };

  const handleBillboardChange = (billboardId: string) => {
    setFormData({ ...formData, billboardId, slotNumber: undefined });
    const bb = billboards.find(b => b.id === billboardId);
    setSelectedFormBillboard(bb || null);
  };

  const isStep1Valid = () => {
    return formData.customerId && formData.billboardId;
  };

  const isStep2Valid = () => {
    return formData.startDate && formData.endDate && formData.startDate <= formData.endDate;
  };

  const isFormValid = () => {
    return isStep1Valid() && isStep2Valid();
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerId">Customer *</Label>
        <Select
          value={formData.customerId}
          onValueChange={(value) => setFormData({ ...formData, customerId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billboardId">Billboard *</Label>
        <Select
          value={formData.billboardId}
          onValueChange={handleBillboardChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select billboard" />
          </SelectTrigger>
          <SelectContent>
            {billboards.map((billboard) => (
              <SelectItem key={billboard.id} value={billboard.id}>
                {billboard.name} ({billboard.code}) - {billboard.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFormBillboard && (
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Billboard Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="ml-2 capitalize">
                {selectedFormBillboard.type}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Rate/Day:</span>
              <span className="ml-2 font-medium">{formatCurrency(selectedFormBillboard.ratePerDay)}</span>
            </div>
            {selectedFormBillboard.type === 'digital' && (
              <>
                <div>
                  <span className="text-muted-foreground">Slots:</span>
                  <span className="ml-2">{selectedFormBillboard.slotCount || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Slot Duration:</span>
                  <span className="ml-2">{selectedFormBillboard.slotDuration}s</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedFormBillboard?.type === 'digital' && selectedFormBillboard.slotCount && (
        <div className="space-y-2">
          <Label htmlFor="slotNumber">Slot Number *</Label>
          <Select
            value={formData.slotNumber?.toString() || ''}
            onValueChange={(value) => setFormData({ ...formData, slotNumber: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select slot" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: selectedFormBillboard.slotCount }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Slot {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            min={formData.startDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      {formData.startDate && formData.endDate && selectedFormBillboard && (
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Booking Summary</h4>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>
                {Math.ceil(
                  (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{' '}
                days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Value:</span>
              <span className="font-medium">
                {formatCurrency(
                  parseFloat(selectedFormBillboard.ratePerDay.toString()) *
                    (Math.ceil(
                      (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1)
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="creativeRef">Creative Reference</Label>
        <Input
          id="creativeRef"
          value={formData.creativeRef}
          onChange={(e) => setFormData({ ...formData, creativeRef: e.target.value })}
          placeholder="Reference to artwork/creative"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
          rows={3}
        />
      </div>
    </div>
  );

  const renderBookingForm = () => (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                formStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
            {step < totalSteps && (
              <div
                className={`w-12 h-0.5 ${
                  formStep > step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mb-4">
        <h3 className="font-medium">
          {formStep === 1 ? 'Select Customer & Billboard' : 'Booking Details'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Step {formStep} of {totalSteps}
        </p>
      </div>

      {formStep === 1 && renderStep1()}
      {formStep === 2 && renderStep2()}
    </div>
  );

  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>View and manage billboard bookings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="po_generated">PO Generated</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Billboard</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bookings found. Create your first booking.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono font-medium">{booking.referenceCode}</TableCell>
                    <TableCell>{booking.customer?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{booking.billboard?.name || '-'}</span>
                        {booking.billboard?.type === 'digital' && booking.slotNumber && (
                          <Badge variant="outline" className="text-xs">
                            Slot {booking.slotNumber}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(booking.notionalValue)}</TableCell>
                    <TableCell>
                      <Badge className={BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100'}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditBooking(booking) && (
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(booking)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canShortClose(booking) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openShortCloseDialog(booking)}
                            title="Short Close"
                          >
                            <StopCircle className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        {booking.status === 'created' && (
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(booking)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCalendarView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Booking Calendar</CardTitle>
            <CardDescription>View billboard availability and bookings</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedBillboard || 'all'} onValueChange={(v) => setSelectedBillboard(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All billboards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All billboards</SelectItem>
                {billboards.map((bb) => (
                  <SelectItem key={bb.id} value={bb.id}>
                    {bb.name} ({bb.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const dayBookings = getBookingsForDate(date);
                const isToday = formatDateString(date) === formatDateString(new Date());

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-t border-l p-1 ${
                      !isCurrentMonth ? 'bg-muted/50' : ''
                    } ${isToday ? 'bg-blue-50' : ''}`}
                  >
                    <div
                      className={`text-sm mb-1 ${
                        !isCurrentMonth ? 'text-muted-foreground' : ''
                      } ${isToday ? 'font-bold text-blue-600' : ''}`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                          title={`${booking.billboardName} - ${booking.customerName}`}
                          onClick={() => {
                            const fullBooking = bookings.find(b => b.id === booking.id);
                            if (fullBooking) openViewDialog(fullBooking);
                          }}
                        >
                          {booking.billboardCode}
                          {booking.slotNumber && ` S${booking.slotNumber}`}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
              <span>Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">Manage billboard bookings and availability</p>
          </div>
        </div>
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'list' ? renderListView() : renderCalendarView()}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setFormData(initialFormData);
          setFormStep(1);
          setSelectedFormBillboard(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>Create a new billboard booking.</DialogDescription>
          </DialogHeader>
          {renderBookingForm()}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (formStep === 1) {
                  setIsCreateOpen(false);
                  setFormData(initialFormData);
                  setFormStep(1);
                  setSelectedFormBillboard(null);
                } else {
                  setFormStep(formStep - 1);
                }
              }}
            >
              {formStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {formStep < totalSteps ? (
              <Button onClick={() => setFormStep(formStep + 1)} disabled={!isStep1Valid()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !isFormValid()}>
                {saving ? 'Creating...' : 'Create Booking'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setFormData(initialFormData);
          setFormStep(1);
          setSelectedFormBillboard(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Update booking details.</DialogDescription>
          </DialogHeader>
          {renderBookingForm()}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (formStep === 1) {
                  setIsEditOpen(false);
                  setFormData(initialFormData);
                  setFormStep(1);
                  setSelectedFormBillboard(null);
                } else {
                  setFormStep(formStep - 1);
                }
              }}
            >
              {formStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {formStep < totalSteps ? (
              <Button onClick={() => setFormStep(formStep + 1)} disabled={!isStep1Valid()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleUpdate} disabled={saving || !isFormValid()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-semibold">{selectedBooking.referenceCode}</code>
                <Badge className={BOOKING_STATUS_COLORS[selectedBooking.status]}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>
              <Separator />

              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedBooking.customer?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Billboard</p>
                    <p className="font-medium">
                      {selectedBooking.billboard?.name} ({selectedBooking.billboard?.code})
                    </p>
                    {selectedBooking.slotNumber && (
                      <Badge variant="outline" className="mt-1">Slot {selectedBooking.slotNumber}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.actualEndDate ? 'Original Period' : 'Period'}
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                    </p>
                  </div>
                </div>

                {selectedBooking.actualEndDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actual End Date (Short Closed)</p>
                      <p className="font-medium text-orange-600">
                        {formatDate(selectedBooking.actualEndDate)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notional Value</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedBooking.notionalValue)}</p>
                  </div>
                </div>

                {selectedBooking.creativeRef && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Creative Reference</p>
                    <p>{selectedBooking.creativeRef}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            {selectedBooking && canShortClose(selectedBooking) && (
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-50"
                onClick={() => {
                  setIsViewOpen(false);
                  openShortCloseDialog(selectedBooking);
                }}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Short Close
              </Button>
            )}
            {selectedBooking && canEditBooking(selectedBooking) && (
              <Button
                onClick={() => {
                  setIsViewOpen(false);
                  openEditDialog(selectedBooking);
                }}
              >
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Short Close Dialog */}
      <Dialog open={isShortCloseOpen} onOpenChange={(open) => {
        setIsShortCloseOpen(open);
        if (!open) {
          setShortCloseData({ actualEndDate: '', reason: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Short Close Booking
            </DialogTitle>
            <DialogDescription>
              End this booking early. The booking will be marked as completed with the new end date.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Booking:</span>
                  <span className="font-mono font-medium">{selectedBooking.referenceCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Period:</span>
                  <span>{formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billboard:</span>
                  <span>{selectedBooking.billboard?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualEndDate">Actual End Date *</Label>
                <Input
                  id="actualEndDate"
                  type="date"
                  value={shortCloseData.actualEndDate}
                  min={selectedBooking.startDate}
                  max={new Date(new Date(selectedBooking.endDate).getTime() - 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setShortCloseData({ ...shortCloseData, actualEndDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Must be before the original end date ({formatDate(selectedBooking.endDate)})
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={shortCloseData.reason}
                  onChange={(e) => setShortCloseData({ ...shortCloseData, reason: e.target.value })}
                  placeholder="Enter reason for short closing..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShortCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShortClose}
              disabled={saving || !shortCloseData.actualEndDate || !shortCloseData.reason.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving ? 'Processing...' : 'Short Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete booking "{selectedBooking?.referenceCode}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BookingsPage;
