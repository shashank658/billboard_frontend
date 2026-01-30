import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  locationService,
  type CreateZoneDto,
  type UpdateZoneDto,
  type DropdownOption,
  type ZoneResponse,
} from '@/services/location.service';
import type { PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

type ZoneWithCity = ZoneResponse['data'][number];

export function ZonesTab() {
  const { toast } = useToast();
  const [zones, setZones] = useState<ZoneWithCity[]>([]);
  const [regions, setRegions] = useState<DropdownOption[]>([]);
  const [cities, setCities] = useState<DropdownOption[]>([]);
  const [formCities, setFormCities] = useState<DropdownOption[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRegionId, setFilterRegionId] = useState<string>('');
  const [filterCityId, setFilterCityId] = useState<string>('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneWithCity | null>(null);
  const [formData, setFormData] = useState<CreateZoneDto & { regionId?: string }>({
    cityId: '',
    name: '',
    code: '',
    regionId: '',
  });
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch regions for dropdown
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await locationService.getRegionsDropdown();
        if (response.data) {
          setRegions(response.data);
        }
      } catch {
        console.error('Failed to fetch regions');
      }
    };
    fetchRegions();
  }, []);

  // Fetch cities when filter region changes
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await locationService.getCitiesDropdown(filterRegionId || undefined);
        if (response.data) {
          setCities(response.data);
        }
      } catch {
        console.error('Failed to fetch cities');
      }
    };
    fetchCities();
    setFilterCityId('');
  }, [filterRegionId]);

  // Fetch cities for form when form region changes
  useEffect(() => {
    const fetchFormCities = async () => {
      if (!formData.regionId) {
        setFormCities([]);
        return;
      }
      try {
        const response = await locationService.getCitiesDropdown(formData.regionId);
        if (response.data) {
          setFormCities(response.data);
        }
      } catch {
        console.error('Failed to fetch cities');
      }
    };
    fetchFormCities();
  }, [formData.regionId]);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await locationService.getZones({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        cityId: filterCityId || undefined,
        regionId: filterRegionId || undefined,
      });
      setZones(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch zones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, filterCityId, filterRegionId, toast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await locationService.createZone({
        cityId: formData.cityId,
        name: formData.name,
        code: formData.code,
      });
      toast({
        title: 'Success',
        description: 'Zone created successfully',
      });
      setIsCreateOpen(false);
      setFormData({ cityId: '', name: '', code: '', regionId: '' });
      fetchZones();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create zone';
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
    if (!selectedZone) return;
    try {
      setSaving(true);
      const updateData: UpdateZoneDto = {};
      if (formData.cityId !== selectedZone.cityId) updateData.cityId = formData.cityId;
      if (formData.name !== selectedZone.name) updateData.name = formData.name;
      if (formData.code !== selectedZone.code) updateData.code = formData.code;

      await locationService.updateZone(selectedZone.id, updateData);
      toast({
        title: 'Success',
        description: 'Zone updated successfully',
      });
      setIsEditOpen(false);
      setSelectedZone(null);
      setFormData({ cityId: '', name: '', code: '', regionId: '' });
      fetchZones();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update zone';
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
    if (!selectedZone) return;
    try {
      setSaving(true);
      await locationService.deleteZone(selectedZone.id);
      toast({
        title: 'Success',
        description: 'Zone deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedZone(null);
      fetchZones();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete zone';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (zone: ZoneWithCity) => {
    setSelectedZone(zone);
    setFormData({
      cityId: zone.cityId || '',
      name: zone.name,
      code: zone.code,
      regionId: zone.city?.region?.id || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (zone: ZoneWithCity) => {
    setSelectedZone(zone);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterRegionId} onValueChange={setFilterRegionId}>
            <SelectTrigger className="w-40">
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
          <Select value={filterCityId} onValueChange={setFilterCityId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Zone
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No zones found
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.code}</TableCell>
                  <TableCell>
                    {zone.city ? (
                      <Badge variant="outline">{zone.city.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {zone.city?.region ? (
                      <Badge variant="secondary">{zone.city.region.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(zone.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(zone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(zone)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Zone</DialogTitle>
            <DialogDescription>
              Create a new zone within a city.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.regionId}
                onValueChange={(value) => setFormData({ ...formData, regionId: value, cityId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
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
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Select
                value={formData.cityId}
                onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                disabled={!formData.regionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.regionId ? "Select a city" : "Select region first"} />
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
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Andheri West"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., ANW"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formData.cityId || !formData.name || !formData.code}
            >
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
            <DialogDescription>
              Update the zone details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-region">Region</Label>
              <Select
                value={formData.regionId}
                onValueChange={(value) => setFormData({ ...formData, regionId: value, cityId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-city">City</Label>
              <Select
                value={formData.cityId}
                onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                disabled={!formData.regionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.regionId ? "Select a city" : "Select region first"} />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Andheri West"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., ANW"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || !formData.cityId || !formData.name || !formData.code}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedZone?.name}"? This action cannot be undone.
              Note: Zones with billboards cannot be deleted.
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
