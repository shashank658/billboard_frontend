import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Megaphone, Eye, Unlink, Check, MapPin } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  campaignService,
  type CampaignWithDetails,
  type CreateCampaignDto,
  type UpdateCampaignDto,
  type AvailableBillboard,
  type BillboardSelection,
} from '@/services/campaign.service';
import { customerService } from '@/services/customer.service';
import type { Customer, PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  customerId: string;
  description: string;
  startDate: string;
  endDate: string;
}

const initialFormData: FormData = {
  name: '',
  customerId: '',
  description: '',
  startDate: '',
  endDate: '',
};

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithDetails | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Multi-step form for creation
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 3;

  // Billboard selection for campaign creation
  const [availableBillboards, setAvailableBillboards] = useState<AvailableBillboard[]>([]);
  const [selectedBillboards, setSelectedBillboards] = useState<BillboardSelection[]>([]);
  const [loadingBillboards, setLoadingBillboards] = useState(false);

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

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaigns({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        customerId: filterCustomerId !== 'all' ? filterCustomerId : undefined,
      });
      setCampaigns(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, filterCustomerId, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const fetchAvailableBillboards = async () => {
    if (!formData.startDate || !formData.endDate) return;

    try {
      setLoadingBillboards(true);
      const billboards = await campaignService.getAvailableBillboards(
        formData.startDate,
        formData.endDate
      );
      setAvailableBillboards(billboards);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch available billboards',
        variant: 'destructive',
      });
    } finally {
      setLoadingBillboards(false);
    }
  };

  const handleCreate = async () => {
    if (selectedBillboards.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one billboard',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const createData: CreateCampaignDto = {
        name: formData.name,
        customerId: formData.customerId,
        description: formData.description || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        billboards: selectedBillboards,
      };
      await campaignService.createCampaign(createData);
      toast({
        title: 'Success',
        description: 'Campaign created successfully with bookings for all selected billboards',
      });
      setIsCreateOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
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
    if (!selectedCampaign) return;
    try {
      setSaving(true);
      const updateData: UpdateCampaignDto = {
        name: formData.name,
        description: formData.description || undefined,
      };
      await campaignService.updateCampaign(selectedCampaign.id, updateData);
      toast({
        title: 'Success',
        description: 'Campaign updated successfully',
      });
      setIsEditOpen(false);
      setSelectedCampaign(null);
      setFormData(initialFormData);
      fetchCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update campaign';
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
    if (!selectedCampaign) return;
    try {
      setSaving(true);
      await campaignService.deleteCampaign(selectedCampaign.id);
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBooking = async (bookingId: string) => {
    if (!selectedCampaign) return;
    try {
      await campaignService.removeBookingFromCampaign(selectedCampaign.id, bookingId);
      toast({
        title: 'Success',
        description: 'Booking removed from campaign',
      });
      // Refresh campaign details
      const updated = await campaignService.getCampaignById(selectedCampaign.id);
      setSelectedCampaign(updated);
      fetchCampaigns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormStep(1);
    setSelectedBillboards([]);
    setAvailableBillboards([]);
  };

  const openEditDialog = (campaign: CampaignWithDetails) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      customerId: campaign.customerId,
      description: campaign.description || '',
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
    });
    setIsEditOpen(true);
  };

  const openViewDialog = async (campaign: CampaignWithDetails) => {
    try {
      const fullCampaign = await campaignService.getCampaignById(campaign.id);
      setSelectedCampaign(fullCampaign);
      setIsViewOpen(true);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch campaign details',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (campaign: CampaignWithDetails) => {
    setSelectedCampaign(campaign);
    setIsDeleteOpen(true);
  };

  const toggleBillboardSelection = (billboard: AvailableBillboard, slotNumber?: number) => {
    setSelectedBillboards((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.billboardId === billboard.id && s.slotNumber === slotNumber
      );

      if (existingIndex >= 0) {
        // Remove
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Add
        return [...prev, { billboardId: billboard.id, slotNumber }];
      }
    });
  };

  const isBillboardSelected = (billboardId: string, slotNumber?: number) => {
    return selectedBillboards.some(
      (s) => s.billboardId === billboardId && s.slotNumber === slotNumber
    );
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

  const calculateTotalValue = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return selectedBillboards.reduce((total, selection) => {
      const billboard = availableBillboards.find((b) => b.id === selection.billboardId);
      if (billboard) {
        const rate = parseFloat(billboard.ratePerDay);
        return total + rate * days;
      }
      return total;
    }, 0);
  };

  const isStep1Valid = () => {
    return (
      formData.name.trim().length > 0 &&
      formData.customerId.length > 0 &&
      formData.startDate.length > 0 &&
      formData.endDate.length > 0 &&
      new Date(formData.startDate) <= new Date(formData.endDate)
    );
  };

  const isStep2Valid = () => {
    return selectedBillboards.length > 0;
  };

  const handleNextStep = async () => {
    if (formStep === 1) {
      await fetchAvailableBillboards();
    }
    setFormStep((prev) => prev + 1);
  };

  const stepLabels = ['Campaign Details', 'Select Billboards', 'Review & Confirm'];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {stepLabels.map((label, index) => {
        const stepNum = index + 1;
        const isActive = formStep === stepNum;
        const isCompleted = formStep > stepNum;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span className={`mt-1 text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {index < stepLabels.length - 1 && (
              <div className={`mx-2 h-0.5 w-12 ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Summer Sale 2024"
        />
      </div>

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
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Campaign description or notes"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select billboards for the campaign period: {formatDate(formData.startDate)} - {formatDate(formData.endDate)}
        </p>
        <Badge variant="secondary">{selectedBillboards.length} selected</Badge>
      </div>

      {loadingBillboards ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : availableBillboards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No billboards found. Please add billboards first.
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {availableBillboards.map((billboard) => (
            <div
              key={billboard.id}
              className={`border rounded-md p-4 ${
                !billboard.isAvailable ? 'opacity-50 bg-muted/30' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{billboard.name}</span>
                    <Badge variant={billboard.type === 'digital' ? 'default' : 'secondary'}>
                      {billboard.type}
                    </Badge>
                    {!billboard.isAvailable && (
                      <Badge variant="destructive">Unavailable</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    {billboard.address}
                  </p>
                  <p className="text-sm mt-1">
                    {billboard.width}x{billboard.height} ft | {formatCurrency(billboard.ratePerDay)}/day
                  </p>
                </div>
              </div>

              {billboard.isAvailable && (
                <div className="mt-3">
                  {billboard.type === 'digital' && billboard.slotCount ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Select slots:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: billboard.slotCount }, (_, i) => i + 1).map((slot) => {
                          const isSlotAvailable = billboard.availableSlots.includes(slot);
                          const isSelected = isBillboardSelected(billboard.id, slot);
                          return (
                            <Button
                              key={slot}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              disabled={!isSlotAvailable}
                              onClick={() => toggleBillboardSelection(billboard, slot)}
                            >
                              Slot {slot}
                              {isSelected && <Check className="ml-1 h-3 w-3" />}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleBillboardSelection(billboard)}
                    >
                      <Checkbox
                        checked={isBillboardSelected(billboard.id)}
                        onCheckedChange={() => toggleBillboardSelection(billboard)}
                      />
                      <span className="text-sm">Select this billboard</span>
                    </div>
                  )}
                </div>
              )}

              {billboard.conflicts.length > 0 && (
                <p className="text-xs text-destructive mt-2">
                  Conflicts: {billboard.conflicts.map((c) => c.referenceCode).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    const totalValue = calculateTotalValue();
    const days = formData.startDate && formData.endDate
      ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold">Campaign Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{formData.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">
                {customers.find((c) => c.id === formData.customerId)?.name}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Period:</span>
              <p className="font-medium">
                {formatDate(formData.startDate)} - {formatDate(formData.endDate)} ({days} days)
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Billboards:</span>
              <p className="font-medium">{selectedBillboards.length}</p>
            </div>
          </div>
          {formData.description && (
            <div className="text-sm">
              <span className="text-muted-foreground">Description:</span>
              <p>{formData.description}</p>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Selected Billboards ({selectedBillboards.length})</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Billboard</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead className="text-right">Rate/Day</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBillboards.map((selection, index) => {
                  const billboard = availableBillboards.find((b) => b.id === selection.billboardId);
                  if (!billboard) return null;
                  const rate = parseFloat(billboard.ratePerDay);
                  const total = rate * days;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{billboard.name}</TableCell>
                      <TableCell>
                        <Badge variant={billboard.type === 'digital' ? 'default' : 'secondary'}>
                          {billboard.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {selection.slotNumber ? `Slot ${selection.slotNumber}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(rate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="font-semibold text-right">
                    Total Campaign Value:
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalValue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          This will create {selectedBillboards.length} booking(s) for the campaign period.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create campaigns spanning multiple billboards
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>View and manage advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
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
            <Button onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Billboards</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No campaigns found
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {campaign.referenceCode}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.customer?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {campaign.bookingCount || 0} billboards
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.startDate && campaign.endDate ? (
                          <span className="text-sm">
                            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(campaign.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(campaign)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(campaign)}
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
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new advertising campaign with multiple billboards
            </DialogDescription>
          </DialogHeader>

          {renderStepIndicator()}

          {formStep === 1 && renderStep1()}
          {formStep === 2 && renderStep2()}
          {formStep === 3 && renderStep3()}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (formStep === 1) {
                  setIsCreateOpen(false);
                  resetForm();
                } else {
                  setFormStep(formStep - 1);
                }
              }}
            >
              {formStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {formStep < totalSteps ? (
              <Button
                onClick={handleNextStep}
                disabled={
                  (formStep === 1 && !isStep1Valid()) ||
                  (formStep === 2 && !isStep2Valid()) ||
                  loadingBillboards
                }
              >
                {loadingBillboards ? 'Loading...' : 'Next'}
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign name and description. Dates and billboards cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Campaign Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedCampaign.referenceCode}
                  </code>
                  <h3 className="text-xl font-semibold mt-2">{selectedCampaign.name}</h3>
                  <p className="text-muted-foreground">{selectedCampaign.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCampaign.totalValue)}</p>
                </div>
              </div>

              {selectedCampaign.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p>{selectedCampaign.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start Date:</span>
                  <p className="font-medium">{formatDate(selectedCampaign.startDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date:</span>
                  <p className="font-medium">{formatDate(selectedCampaign.endDate)}</p>
                </div>
              </div>

              <Separator />

              {/* Bookings Section */}
              <div>
                <h4 className="font-semibold mb-4">Campaign Billboards ({selectedCampaign.bookings?.length || 0})</h4>

                {selectedCampaign.bookings && selectedCampaign.bookings.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking Ref</TableHead>
                          <TableHead>Billboard</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCampaign.bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {booking.referenceCode}
                              </code>
                            </TableCell>
                            <TableCell>
                              {booking.billboard?.name || '-'}
                              {booking.slotNumber && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Slot {booking.slotNumber}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(booking.notionalValue)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveBooking(booking.id)}
                                title="Remove from campaign"
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No billboards in this campaign.
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (selectedCampaign) openEditDialog(selectedCampaign);
            }}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCampaign?.name}"?
              {selectedCampaign?.bookingCount && selectedCampaign.bookingCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This campaign has {selectedCampaign.bookingCount} bookings.
                  All associated bookings will also be deleted.
                </span>
              )}
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
