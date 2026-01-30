import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Receipt, Eye } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  taxService,
  type CreateTaxDto,
  type UpdateTaxDto,
} from '@/services/tax.service';
import type { Tax, PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

const initialFormData: CreateTaxDto = {
  name: '',
  percentage: 0,
  hsnSacCode: '',
  description: '',
};

export default function TaxesPage() {
  const { toast } = useToast();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState<CreateTaxDto>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTaxes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taxService.getTaxes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      });
      setTaxes(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch taxes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, toast]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await taxService.createTax(formData);
      toast({
        title: 'Success',
        description: 'Tax created successfully',
      });
      setIsCreateOpen(false);
      setFormData(initialFormData);
      fetchTaxes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create tax';
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
    if (!selectedTax) return;
    try {
      setSaving(true);
      const updateData: UpdateTaxDto = { ...formData };
      await taxService.updateTax(selectedTax.id, updateData);
      toast({
        title: 'Success',
        description: 'Tax updated successfully',
      });
      setIsEditOpen(false);
      setSelectedTax(null);
      setFormData(initialFormData);
      fetchTaxes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update tax';
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
    if (!selectedTax) return;
    try {
      setSaving(true);
      await taxService.deleteTax(selectedTax.id);
      toast({
        title: 'Success',
        description: 'Tax deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedTax(null);
      fetchTaxes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete tax';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (tax: Tax) => {
    setSelectedTax(tax);
    setFormData({
      name: tax.name,
      percentage: parseFloat(tax.percentage as unknown as string) || 0,
      hsnSacCode: tax.hsnSacCode || '',
      description: tax.description || '',
    });
    setIsEditOpen(true);
  };

  const openViewDialog = (tax: Tax) => {
    setSelectedTax(tax);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (tax: Tax) => {
    setSelectedTax(tax);
    setIsDeleteOpen(true);
  };

  const renderTaxForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tax Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., GST 18%"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentage (%) *</Label>
          <Input
            id="percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.percentage || ''}
            onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
            placeholder="18"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hsnSacCode">HSN/SAC Code</Label>
        <Input
          id="hsnSacCode"
          value={formData.hsnSacCode}
          onChange={(e) => setFormData({ ...formData, hsnSacCode: e.target.value })}
          placeholder="e.g., 998365"
        />
        <p className="text-xs text-muted-foreground">
          HSN (Harmonized System of Nomenclature) or SAC (Service Accounting Code)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes about this tax"
          rows={3}
        />
      </div>
    </div>
  );

  const isFormValid = () => {
    return formData.name.trim().length > 0 && formData.percentage > 0 && formData.percentage <= 100;
  };

  const formatPercentage = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num}%`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tax Management</h1>
          <p className="text-muted-foreground">
            Configure tax rates for invoicing (GST, IGST, etc.)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Taxes</CardTitle>
          <CardDescription>View and manage tax configurations for invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search taxes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>HSN/SAC Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : taxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No taxes found. Add your first tax configuration.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxes.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {formatPercentage(tax.percentage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tax.hsnSacCode ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {tax.hsnSacCode}
                          </code>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tax.description || '-'}
                      </TableCell>
                      <TableCell>
                        {tax.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(tax)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tax)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(tax)}
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
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tax</DialogTitle>
            <DialogDescription>
              Add a new tax configuration for invoicing.
            </DialogDescription>
          </DialogHeader>
          {renderTaxForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !isFormValid()}>
              {saving ? 'Creating...' : 'Create Tax'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tax</DialogTitle>
            <DialogDescription>
              Update tax configuration.
            </DialogDescription>
          </DialogHeader>
          {renderTaxForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !isFormValid()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tax Details</DialogTitle>
          </DialogHeader>
          {selectedTax && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedTax.name}</h3>
                {selectedTax.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Percentage:</span>
                  <p className="font-medium text-lg">{formatPercentage(selectedTax.percentage)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">HSN/SAC Code:</span>
                  <p className="font-medium">{selectedTax.hsnSacCode || '-'}</p>
                </div>
              </div>
              {selectedTax.description && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium mt-1">{selectedTax.description}</p>
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
              if (selectedTax) openEditDialog(selectedTax);
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
            <AlertDialogTitle>Delete Tax</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTax?.name}"? This action cannot be undone.
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
