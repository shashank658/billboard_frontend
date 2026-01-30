import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RectangleHorizontal,
  Eye,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { LocationPicker } from '@/components/maps/LocationPicker';
import {
  billboardService,
  type BillboardWithRelations,
  type CreateBillboardDto,
  type BillboardType,
  type BillboardStatus,
  type BillboardStats,
} from '@/services/billboard.service';
import { locationService, type DropdownOption } from '@/services/location.service';
import { landlordService } from '@/services/landlord.service';
import type { PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const initialFormData: CreateBillboardDto = {
  name: '',
  code: '',
  description: '',
  type: 'static',
  status: 'active',
  width: 0,
  height: 0,
  orientation: 'landscape',
  zoneId: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  illumination: '',
  installationDate: '',
  landlordId: '',
  ratePerDay: 0,
  loopDuration: undefined,
  slotCount: undefined,
  slotDuration: undefined,
};

export default function BillboardsPage() {
  const { toast } = useToast();
  const [billboards, setBillboards] = useState<BillboardWithRelations[]>([]);
  const [stats, setStats] = useState<BillboardStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRegionId, setFilterRegionId] = useState<string>('');

  // Dropdown options
  const [regions, setRegions] = useState<DropdownOption[]>([]);
  const [formCities, setFormCities] = useState<DropdownOption[]>([]);
  const [formZones, setFormZones] = useState<DropdownOption[]>([]);
  const [landlords, setLandlords] = useState<{ id: string; name: string }[]>([]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBillboard, setSelectedBillboard] = useState<BillboardWithRelations | null>(null);
  const [formData, setFormData] = useState<CreateBillboardDto>(initialFormData);
  const [formRegionId, setFormRegionId] = useState('');
  const [formCityId, setFormCityId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 3;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch initial dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [regionsRes, landlordsRes] = await Promise.all([
          locationService.getRegionsDropdown(),
          landlordService.getLandlordsDropdown(),
        ]);
        if (regionsRes.data) setRegions(regionsRes.data);
        if (landlordsRes.data) setLandlords(landlordsRes.data);
      } catch {
        console.error('Failed to fetch dropdown data');
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch form cities when form region changes
  useEffect(() => {
    const fetchFormCities = async () => {
      if (!formRegionId) {
        setFormCities([]);
        return;
      }
      try {
        const response = await locationService.getCitiesDropdown(formRegionId);
        if (response.data) setFormCities(response.data);
      } catch {
        console.error('Failed to fetch cities');
      }
    };
    fetchFormCities();
    setFormCityId('');
  }, [formRegionId]);

  // Fetch form zones when form city changes
  useEffect(() => {
    const fetchFormZones = async () => {
      if (!formCityId) {
        setFormZones([]);
        return;
      }
      try {
        const response = await locationService.getZonesDropdown(formCityId);
        if (response.data) setFormZones(response.data);
      } catch {
        console.error('Failed to fetch zones');
      }
    };
    fetchFormZones();
    setFormData(prev => ({ ...prev, zoneId: '' }));
  }, [formCityId]);

  const fetchBillboards = useCallback(async () => {
    try {
      setLoading(true);
      const [billboardsRes, statsRes] = await Promise.all([
        billboardService.getBillboards({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search: debouncedSearch || undefined,
          type: (filterType || undefined) as BillboardType | undefined,
          status: (filterStatus || undefined) as BillboardStatus | undefined,
          regionId: filterRegionId || undefined,
        }),
        billboardService.getBillboardStats(),
      ]);
      setBillboards(billboardsRes.data);
      setPagination(billboardsRes.pagination);
      if (statsRes.data) setStats(statsRes.data);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch billboards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, filterType, filterStatus, filterRegionId, toast]);

  useEffect(() => {
    fetchBillboards();
  }, [fetchBillboards]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await billboardService.createBillboard(formData);
      toast({
        title: 'Success',
        description: 'Billboard created successfully',
      });
      setIsCreateOpen(false);
      setFormData(initialFormData);
      setFormRegionId('');
      setFormCityId('');
      fetchBillboards();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create billboard';
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
    if (!selectedBillboard) return;
    try {
      setSaving(true);
      await billboardService.updateBillboard(selectedBillboard.id, formData);
      toast({
        title: 'Success',
        description: 'Billboard updated successfully',
      });
      setIsEditOpen(false);
      setSelectedBillboard(null);
      setFormData(initialFormData);
      setFormRegionId('');
      setFormCityId('');
      fetchBillboards();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update billboard';
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
    if (!selectedBillboard) return;
    try {
      setSaving(true);
      await billboardService.deleteBillboard(selectedBillboard.id);
      toast({
        title: 'Success',
        description: 'Billboard deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedBillboard(null);
      fetchBillboards();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete billboard';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (billboard: BillboardWithRelations) => {
    setSelectedBillboard(billboard);
    setFormRegionId(billboard.region?.id || '');
    setFormCityId(billboard.city?.id || '');
    setFormData({
      name: billboard.name,
      code: billboard.code,
      description: billboard.description || '',
      type: billboard.type as BillboardType,
      status: billboard.status as BillboardStatus,
      width: parseFloat(billboard.width as unknown as string),
      height: parseFloat(billboard.height as unknown as string),
      orientation: (billboard.orientation as 'portrait' | 'landscape') || 'landscape',
      zoneId: billboard.zoneId || '',
      address: billboard.address,
      latitude: billboard.latitude || undefined,
      longitude: billboard.longitude || undefined,
      illumination: billboard.illumination || '',
      installationDate: billboard.installationDate ? new Date(billboard.installationDate).toISOString().split('T')[0] : '',
      landlordId: billboard.landlordId || '',
      ratePerDay: parseFloat(billboard.ratePerDay as unknown as string),
      loopDuration: billboard.loopDuration || undefined,
      slotCount: billboard.slotCount || undefined,
      slotDuration: billboard.slotDuration || undefined,
    });
    setFormStep(1);
    setIsEditOpen(true);
  };

  const openViewDialog = (billboard: BillboardWithRelations) => {
    setSelectedBillboard(billboard);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (billboard: BillboardWithRelations) => {
    setSelectedBillboard(billboard);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'maintenance':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'static':
        return <Badge variant="outline">Static</Badge>;
      case 'digital':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Digital</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const isStep1Valid = () => formData.name && formData.code && formData.type && formData.width > 0 && formData.height > 0;
  const isStep2Valid = () => formData.zoneId && formData.address && formData.landlordId;

  const stepLabels = ['Basic Info', 'Location', 'Pricing & Digital'];

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
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`mt-1 text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {index < stepLabels.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Billboard name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., BB001"
              maxLength={50}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as BillboardType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as BillboardStatus })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width (ft) *</Label>
            <Input
              id="width"
              type="number"
              step="0.1"
              min="0"
              value={formData.width || ''}
              onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
              placeholder="20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (ft) *</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="0"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
              placeholder="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orientation">Orientation</Label>
            <Select
              value={formData.orientation}
              onValueChange={(value) => setFormData({ ...formData, orientation: value as 'portrait' | 'landscape' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="illumination">Illumination</Label>
            <Input
              id="illumination"
              value={formData.illumination}
              onChange={(e) => setFormData({ ...formData, illumination: e.target.value })}
              placeholder="e.g., LED Backlit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installationDate">Installation Date</Label>
            <Input
              id="installationDate"
              type="date"
              value={formData.installationDate}
              onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
            />
          </div>
        </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <Select value={formRegionId} onValueChange={setFormRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Select value={formCityId} onValueChange={setFormCityId} disabled={!formRegionId}>
              <SelectTrigger>
                <SelectValue placeholder={formRegionId ? "Select city" : "Select region first"} />
              </SelectTrigger>
              <SelectContent>
                {formCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone">Zone *</Label>
            <Select
              value={formData.zoneId}
              onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
              disabled={!formCityId}
            >
              <SelectTrigger>
                <SelectValue placeholder={formCityId ? "Select zone" : "Select city first"} />
              </SelectTrigger>
              <SelectContent>
                {formZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Location on Map</Label>
          <LocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            address={formData.address}
            onLocationChange={(lat, lng) => {
              setFormData({ ...formData, latitude: lat, longitude: lng });
            }}
            onAddressChange={(address) => {
              setFormData({ ...formData, address });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Full Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Complete street address (auto-filled from map or enter manually)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="landlord">Landlord *</Label>
          <Select
            value={formData.landlordId}
            onValueChange={(value) => setFormData({ ...formData, landlordId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select landlord" />
            </SelectTrigger>
            <SelectContent>
              {landlords.map((landlord) => (
                <SelectItem key={landlord.id} value={landlord.id}>
                  {landlord.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ratePerDay">Rate per Day (INR) *</Label>
        <Input
            id="ratePerDay"
            type="number"
            min="0"
            value={formData.ratePerDay || ''}
            onChange={(e) => setFormData({ ...formData, ratePerDay: parseFloat(e.target.value) || 0 })}
            placeholder="e.g., 5000"
          />
        </div>

        {formData.type === 'digital' && (
          <>
            <Separator />
            <h4 className="text-sm font-medium">Digital Billboard Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loopDuration">Loop Duration (sec) *</Label>
                <Input
                  id="loopDuration"
                  type="number"
                  min="1"
                  value={formData.loopDuration || ''}
                  onChange={(e) => setFormData({ ...formData, loopDuration: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slotCount">Number of Slots *</Label>
                <Input
                  id="slotCount"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.slotCount || ''}
                  onChange={(e) => setFormData({ ...formData, slotCount: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Slot Duration (sec) *</Label>
                <Input
                  id="slotDuration"
                  type="number"
                  min="1"
                  value={formData.slotDuration || ''}
                  onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 10"
                />
              </div>
          </div>
        </>
      )}
    </div>
  );

  const renderBillboardForm = () => (
    <div className="w-full">
      {renderStepIndicator()}
      {formStep === 1 && renderStep1()}
      {formStep === 2 && renderStep2()}
      {formStep === 3 && renderStep3()}
    </div>
  );

  const isFormValid = () => {
    const basicValid = formData.name && formData.code && formData.type && formData.width > 0 && formData.height > 0;
    const locationValid = formData.zoneId && formData.address && formData.landlordId;
    const digitalValid = formData.type !== 'digital' || (formData.loopDuration && formData.slotCount && formData.slotDuration);
    return basicValid && locationValid && digitalValid;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <RectangleHorizontal className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billboard Management</h1>
          <p className="text-muted-foreground">
            Manage your static and digital billboard inventory
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Billboards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Static / Digital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.static} / {stats.digital}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Billboards</CardTitle>
          <CardDescription>View and manage all billboards in your inventory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search billboards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRegionId} onValueChange={setFilterRegionId}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button onClick={() => {
                setFormData(initialFormData);
                setFormRegionId('');
                setFormCityId('');
                setFormStep(1);
                setIsCreateOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Billboard
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rate/Day</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : billboards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No billboards found
                    </TableCell>
                  </TableRow>
                ) : (
                  billboards.map((billboard) => (
                    <TableRow key={billboard.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{billboard.name}</div>
                          <div className="text-sm text-muted-foreground">{billboard.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(billboard.type)}</TableCell>
                      <TableCell>{getStatusBadge(billboard.status)}</TableCell>
                      <TableCell>
                        {billboard.width} x {billboard.height} ft
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{billboard.zone?.name || '-'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {billboard.city?.name}, {billboard.region?.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(billboard.ratePerDay as unknown as string))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(billboard)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(billboard)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(billboard)}
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
        if (!open) setFormStep(1);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Billboard</DialogTitle>
            <DialogDescription>
              Create a new billboard entry in your inventory.
            </DialogDescription>
          </DialogHeader>
          {renderBillboardForm()}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (formStep === 1) {
                  setIsCreateOpen(false);
                  setFormStep(1);
                } else {
                  setFormStep(formStep - 1);
                }
              }}
            >
              {formStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {formStep < totalSteps ? (
              <Button
                onClick={() => setFormStep(formStep + 1)}
                disabled={(formStep === 1 && !isStep1Valid()) || (formStep === 2 && !isStep2Valid())}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !isFormValid()}>
                {saving ? 'Creating...' : 'Create Billboard'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setFormStep(1);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Billboard</DialogTitle>
            <DialogDescription>
              Update billboard details.
            </DialogDescription>
          </DialogHeader>
          {renderBillboardForm()}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (formStep === 1) {
                  setIsEditOpen(false);
                  setFormStep(1);
                } else {
                  setFormStep(formStep - 1);
                }
              }}
            >
              {formStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {formStep < totalSteps ? (
              <Button
                onClick={() => setFormStep(formStep + 1)}
                disabled={(formStep === 1 && !isStep1Valid()) || (formStep === 2 && !isStep2Valid())}
              >
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Billboard Details</DialogTitle>
          </DialogHeader>
          {selectedBillboard && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedBillboard.name}</h3>
                  <p className="text-muted-foreground">{selectedBillboard.code}</p>
                </div>
                <div className="flex gap-2">
                  {getTypeBadge(selectedBillboard.type)}
                  {getStatusBadge(selectedBillboard.status)}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>
                  <p className="font-medium">{selectedBillboard.width} x {selectedBillboard.height} ft ({selectedBillboard.orientation})</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate per Day:</span>
                  <p className="font-medium">{formatCurrency(parseFloat(selectedBillboard.ratePerDay as unknown as string))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Illumination:</span>
                  <p className="font-medium">{selectedBillboard.illumination || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Installation Date:</span>
                  <p className="font-medium">
                    {selectedBillboard.installationDate
                      ? new Date(selectedBillboard.installationDate).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground text-sm">Location:</span>
                <p className="font-medium">{selectedBillboard.address}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBillboard.zone?.name}, {selectedBillboard.city?.name}, {selectedBillboard.region?.name}
                </p>
                {selectedBillboard.latitude && selectedBillboard.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {selectedBillboard.latitude}, {selectedBillboard.longitude}
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground text-sm">Landlord:</span>
                <p className="font-medium">{selectedBillboard.landlord?.name}</p>
                {selectedBillboard.landlord?.contactPerson && (
                  <p className="text-sm text-muted-foreground">
                    Contact: {selectedBillboard.landlord.contactPerson}
                    {selectedBillboard.landlord.phone && ` | ${selectedBillboard.landlord.phone}`}
                  </p>
                )}
              </div>
              {selectedBillboard.type === 'digital' && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground text-sm">Digital Settings:</span>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Loop Duration</p>
                        <p className="font-medium">{selectedBillboard.loopDuration}s</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Slots</p>
                        <p className="font-medium">{selectedBillboard.slotCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Slot Duration</p>
                        <p className="font-medium">{selectedBillboard.slotDuration}s</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (selectedBillboard) openEditDialog(selectedBillboard);
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
            <AlertDialogTitle>Delete Billboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBillboard?.name}"? This action cannot be undone.
              Note: Billboards with bookings cannot be deleted.
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
