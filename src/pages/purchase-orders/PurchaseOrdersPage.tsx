import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, FileText, Eye, Calculator, Download } from 'lucide-react';
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
  purchaseOrderService,
  type PurchaseOrderWithDetails,
  type EligibleBooking,
  type CreatePurchaseOrderDto,
  type UpdatePurchaseOrderDto,
  type ProRataCalculation,
} from '@/services/purchase-order.service';
import { customerService } from '@/services/customer.service';
import type { Customer, PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateFormData {
  bookingId: string;
  actualStartDate: string;
  actualEndDate: string;
  actualValue: string;
  adjustmentNotes: string;
}

interface EditFormData {
  actualStartDate: string;
  actualEndDate: string;
  actualValue: string;
  adjustmentNotes: string;
}

const initialCreateFormData: CreateFormData = {
  bookingId: '',
  actualStartDate: '',
  actualEndDate: '',
  actualValue: '',
  adjustmentNotes: '',
};

const initialEditFormData: EditFormData = {
  actualStartDate: '',
  actualEndDate: '',
  actualValue: '',
  adjustmentNotes: '',
};

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState<string>('all');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithDetails | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<EligibleBooking | null>(null);
  const [createFormData, setCreateFormData] = useState<CreateFormData>(initialCreateFormData);
  const [editFormData, setEditFormData] = useState<EditFormData>(initialEditFormData);
  const [proRataCalc, setProRataCalc] = useState<ProRataCalculation | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getCustomers({ pageSize: 1000 });
        setCustomers(response.data);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch customers',
          variant: 'destructive',
        });
      }
    };
    fetchCustomers();
  }, [toast]);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrders({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        customerId: filterCustomerId !== 'all' ? filterCustomerId : undefined,
      });
      setPurchaseOrders(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, filterCustomerId, toast]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const fetchEligibleBookings = async () => {
    try {
      setLoadingBookings(true);
      const bookings = await purchaseOrderService.getEligibleBookings();
      setEligibleBookings(bookings);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch eligible bookings',
        variant: 'destructive',
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const calculateProRata = async () => {
    if (!createFormData.bookingId || !createFormData.actualStartDate || !createFormData.actualEndDate) {
      return;
    }

    try {
      setCalculating(true);
      const calc = await purchaseOrderService.calculateProRata(
        createFormData.bookingId,
        createFormData.actualStartDate,
        createFormData.actualEndDate
      );
      setProRataCalc(calc);
      setCreateFormData(prev => ({
        ...prev,
        actualValue: calc.actualValue.toFixed(2),
      }));
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to calculate pro-rata value',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      const data: CreatePurchaseOrderDto = {
        bookingId: createFormData.bookingId,
        actualStartDate: createFormData.actualStartDate,
        actualEndDate: createFormData.actualEndDate,
        actualValue: createFormData.actualValue || undefined,
        adjustmentNotes: createFormData.adjustmentNotes || undefined,
      };
      await purchaseOrderService.createPurchaseOrder(data);
      toast({
        title: 'Success',
        description: 'Purchase order created successfully',
      });
      setIsCreateOpen(false);
      resetCreateForm();
      fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create purchase order';
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
    if (!selectedPO) return;
    try {
      setSaving(true);
      const data: UpdatePurchaseOrderDto = {
        actualStartDate: editFormData.actualStartDate,
        actualEndDate: editFormData.actualEndDate,
        actualValue: editFormData.actualValue,
        adjustmentNotes: editFormData.adjustmentNotes || undefined,
      };
      await purchaseOrderService.updatePurchaseOrder(selectedPO.id, data);
      toast({
        title: 'Success',
        description: 'Purchase order updated successfully',
      });
      setIsEditOpen(false);
      setSelectedPO(null);
      fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update purchase order';
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
    if (!selectedPO) return;
    try {
      setSaving(true);
      await purchaseOrderService.deletePurchaseOrder(selectedPO.id);
      toast({
        title: 'Success',
        description: 'Purchase order deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedPO(null);
      fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete purchase order';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (po: PurchaseOrderWithDetails) => {
    try {
      toast({
        title: 'Downloading',
        description: 'Generating PDF...',
      });
      await purchaseOrderService.downloadPDF(po.id, po.poNumber);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to download PDF';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const resetCreateForm = () => {
    setCreateFormData(initialCreateFormData);
    setSelectedBooking(null);
    setProRataCalc(null);
  };

  const openCreateDialog = async () => {
    resetCreateForm();
    await fetchEligibleBookings();
    setIsCreateOpen(true);
  };

  const openEditDialog = (po: PurchaseOrderWithDetails) => {
    setSelectedPO(po);
    setEditFormData({
      actualStartDate: po.actualStartDate.split('T')[0],
      actualEndDate: po.actualEndDate.split('T')[0],
      actualValue: po.actualValue,
      adjustmentNotes: po.adjustmentNotes || '',
    });
    setIsEditOpen(true);
  };

  const openViewDialog = async (po: PurchaseOrderWithDetails) => {
    try {
      const fullPO = await purchaseOrderService.getPurchaseOrderById(po.id);
      setSelectedPO(fullPO);
      setIsViewOpen(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase order details',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (po: PurchaseOrderWithDetails) => {
    setSelectedPO(po);
    setIsDeleteOpen(true);
  };

  const handleBookingSelect = (bookingId: string) => {
    const booking = eligibleBookings.find(b => b.id === bookingId);
    setSelectedBooking(booking || null);
    setCreateFormData(prev => ({
      ...prev,
      bookingId,
      actualStartDate: booking?.startDate || '',
      actualEndDate: booking?.endDate || '',
      actualValue: booking?.notionalValue || '',
    }));
    setProRataCalc(null);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isCreateFormValid = () => {
    return (
      createFormData.bookingId.length > 0 &&
      createFormData.actualStartDate.length > 0 &&
      createFormData.actualEndDate.length > 0 &&
      new Date(createFormData.actualStartDate) <= new Date(createFormData.actualEndDate)
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Generate and manage purchase orders for completed bookings
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>View and manage purchase orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PO number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={filterCustomerId}
                onValueChange={setFilterCustomerId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Generate PO
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Billboard</TableHead>
                  <TableHead>Actual Period</TableHead>
                  <TableHead className="text-right">Actual Value</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {po.poNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {po.booking?.referenceCode}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{po.customer?.name || '-'}</TableCell>
                      <TableCell>
                        {po.billboard?.name || '-'}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {po.billboard?.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(po.actualStartDate)} - {formatDate(po.actualEndDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(po.actualValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(po)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(po)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(po)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(po)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) resetCreateForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Purchase Order</DialogTitle>
            <DialogDescription>
              Create a purchase order for a completed booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Booking Selection */}
            <div className="space-y-2">
              <Label>Select Booking *</Label>
              {loadingBookings ? (
                <Skeleton className="h-10 w-full" />
              ) : eligibleBookings.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  No bookings eligible for PO generation. Bookings must be in completed, confirmed, or active status.
                </div>
              ) : (
                <Select
                  value={createFormData.bookingId}
                  onValueChange={handleBookingSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.referenceCode} - {booking.customer.name} - {booking.billboard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Booking Details */}
            {selectedBooking && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reference:</span>
                    <p className="font-medium">{selectedBooking.referenceCode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p className="font-medium">{selectedBooking.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Billboard:</span>
                    <p className="font-medium">
                      {selectedBooking.billboard.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {selectedBooking.billboard.type}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rate/Day:</span>
                    <p className="font-medium">{formatCurrency(selectedBooking.billboard.ratePerDay)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Original Period:</span>
                    <p className="font-medium">
                      {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notional Value:</span>
                    <p className="font-medium">{formatCurrency(selectedBooking.notionalValue)}</p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Actual Display Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actualStartDate">Actual Start Date *</Label>
                <Input
                  id="actualStartDate"
                  type="date"
                  value={createFormData.actualStartDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, actualStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualEndDate">Actual End Date *</Label>
                <Input
                  id="actualEndDate"
                  type="date"
                  value={createFormData.actualEndDate}
                  onChange={(e) => setCreateFormData({ ...createFormData, actualEndDate: e.target.value })}
                />
              </div>
            </div>

            {/* Calculate Pro-Rata Button */}
            {selectedBooking && createFormData.actualStartDate && createFormData.actualEndDate && (
              <Button
                variant="outline"
                onClick={calculateProRata}
                disabled={calculating}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {calculating ? 'Calculating...' : 'Calculate Pro-Rata Value'}
              </Button>
            )}

            {/* Pro-Rata Calculation Result */}
            {proRataCalc && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300">Pro-Rata Calculation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Original Days:</span>
                    <p className="font-medium">{proRataCalc.originalDays}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual Days:</span>
                    <p className="font-medium">{proRataCalc.actualDays}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notional Value:</span>
                    <p className="font-medium">{formatCurrency(proRataCalc.notionalValue)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual Value:</span>
                    <p className="font-bold text-lg">{formatCurrency(proRataCalc.actualValue)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Adjustment:</span>
                    <p className={`font-medium ${proRataCalc.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {proRataCalc.adjustment >= 0 ? '+' : ''}{formatCurrency(proRataCalc.adjustment)} ({proRataCalc.adjustmentPercentage}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actual Value Override */}
            <div className="space-y-2">
              <Label htmlFor="actualValue">Actual Value (INR)</Label>
              <Input
                id="actualValue"
                type="number"
                step="0.01"
                value={createFormData.actualValue}
                onChange={(e) => setCreateFormData({ ...createFormData, actualValue: e.target.value })}
                placeholder="Auto-calculated if left empty"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use calculated value, or enter custom amount
              </p>
            </div>

            {/* Adjustment Notes */}
            <div className="space-y-2">
              <Label htmlFor="adjustmentNotes">Adjustment Notes</Label>
              <Textarea
                id="adjustmentNotes"
                value={createFormData.adjustmentNotes}
                onChange={(e) => setCreateFormData({ ...createFormData, adjustmentNotes: e.target.value })}
                placeholder="Notes for any adjustments (e.g., billboard downtime, partial display)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !isCreateFormValid()}>
              {saving ? 'Creating...' : 'Generate PO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>
              Update purchase order details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-actualStartDate">Actual Start Date</Label>
                <Input
                  id="edit-actualStartDate"
                  type="date"
                  value={editFormData.actualStartDate}
                  onChange={(e) => setEditFormData({ ...editFormData, actualStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-actualEndDate">Actual End Date</Label>
                <Input
                  id="edit-actualEndDate"
                  type="date"
                  value={editFormData.actualEndDate}
                  onChange={(e) => setEditFormData({ ...editFormData, actualEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-actualValue">Actual Value (INR)</Label>
              <Input
                id="edit-actualValue"
                type="number"
                step="0.01"
                value={editFormData.actualValue}
                onChange={(e) => setEditFormData({ ...editFormData, actualValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-adjustmentNotes">Adjustment Notes</Label>
              <Textarea
                id="edit-adjustmentNotes"
                value={editFormData.adjustmentNotes}
                onChange={(e) => setEditFormData({ ...editFormData, adjustmentNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <code className="text-lg bg-muted px-2 py-1 rounded font-bold">
                    {selectedPO.poNumber}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created on {formatDate(selectedPO.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Actual Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPO.actualValue)}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reference:</span>
                      <p className="font-medium">{selectedPO.booking?.referenceCode}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Original Period:</span>
                      <p className="font-medium">
                        {formatDate(selectedPO.booking?.startDate)} - {formatDate(selectedPO.booking?.endDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Notional Value:</span>
                      <p className="font-medium">{formatCurrency(selectedPO.booking?.notionalValue || '0')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Actual Display</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Actual Period:</span>
                      <p className="font-medium">
                        {formatDate(selectedPO.actualStartDate)} - {formatDate(selectedPO.actualEndDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Actual Value:</span>
                      <p className="font-medium">{formatCurrency(selectedPO.actualValue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Customer</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{selectedPO.customer?.name}</p>
                    {selectedPO.customer?.contactPerson && (
                      <p className="text-muted-foreground">{selectedPO.customer.contactPerson}</p>
                    )}
                    {selectedPO.customer?.email && (
                      <p className="text-muted-foreground">{selectedPO.customer.email}</p>
                    )}
                    {selectedPO.customer?.gstNumber && (
                      <p className="text-muted-foreground">GST: {selectedPO.customer.gstNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Billboard</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">
                      {selectedPO.billboard?.name}
                      <Badge variant="outline" className="ml-2">
                        {selectedPO.billboard?.type}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground">{selectedPO.billboard?.code}</p>
                    {selectedPO.billboard?.address && (
                      <p className="text-muted-foreground">{selectedPO.billboard.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedPO.adjustmentNotes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Adjustment Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedPO.adjustmentNotes}</p>
                  </div>
                </>
              )}

              {selectedPO.campaign && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Campaign</h4>
                    <p className="text-sm">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{selectedPO.campaign.referenceCode}</code>
                      <span className="ml-2">{selectedPO.campaign.name}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPO) handleDownload(selectedPO);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => {
                setIsViewOpen(false);
                if (selectedPO) openEditDialog(selectedPO);
              }}>
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete PO "{selectedPO?.poNumber}"?
              This will revert the booking status to "completed".
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
