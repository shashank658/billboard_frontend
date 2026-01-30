import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, Eye } from 'lucide-react';
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
import {
  landlordService,
  type CreateLandlordDto,
  type UpdateLandlordDto,
} from '@/services/landlord.service';
import type { Landlord, PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

const initialFormData: CreateLandlordDto = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  ifscCode: '',
  agreementDetails: '',
  rentAmount: 0,
  paymentFrequency: 'monthly',
};

export default function LandlordsPage() {
  const { toast } = useToast();
  const [landlords, setLandlords] = useState<Landlord[]>([]);
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
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [formData, setFormData] = useState<CreateLandlordDto>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 2;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLandlords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await landlordService.getLandlords({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      });
      setLandlords(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch landlords',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, toast]);

  useEffect(() => {
    fetchLandlords();
  }, [fetchLandlords]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await landlordService.createLandlord(formData);
      toast({
        title: 'Success',
        description: 'Landlord created successfully',
      });
      setIsCreateOpen(false);
      setFormData(initialFormData);
      fetchLandlords();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create landlord';
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
    if (!selectedLandlord) return;
    try {
      setSaving(true);
      const updateData: UpdateLandlordDto = { ...formData };
      await landlordService.updateLandlord(selectedLandlord.id, updateData);
      toast({
        title: 'Success',
        description: 'Landlord updated successfully',
      });
      setIsEditOpen(false);
      setSelectedLandlord(null);
      setFormData(initialFormData);
      fetchLandlords();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update landlord';
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
    if (!selectedLandlord) return;
    try {
      setSaving(true);
      await landlordService.deleteLandlord(selectedLandlord.id);
      toast({
        title: 'Success',
        description: 'Landlord deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedLandlord(null);
      fetchLandlords();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete landlord';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setFormData({
      name: landlord.name,
      contactPerson: landlord.contactPerson || '',
      phone: landlord.phone || '',
      email: landlord.email || '',
      address: landlord.address || '',
      bankName: landlord.bankName || '',
      bankAccount: landlord.bankAccount || '',
      ifscCode: landlord.ifscCode || '',
      agreementDetails: '',
      rentAmount: parseFloat(landlord.rentAmount as unknown as string) || 0,
      paymentFrequency: (landlord.paymentFrequency as 'monthly' | 'quarterly' | 'yearly') || 'monthly',
    });
    setFormStep(1);
    setIsEditOpen(true);
  };

  const openViewDialog = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setIsDeleteOpen(true);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'yearly':
        return 'Yearly';
      default:
        return frequency;
    }
  };

  const isStep1Valid = () => formData.name.trim().length > 0;
  const isStep2Valid = () => formData.rentAmount > 0 && formData.paymentFrequency;

  const stepLabels = ['Basic Info', 'Bank & Payment'];

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
              <div className={`mx-3 h-0.5 w-12 ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name / Company *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Landlord or company name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Primary contact name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contact@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rentAmount">Rent Amount (INR) *</Label>
          <Input
            id="rentAmount"
            type="number"
            min="0"
            value={formData.rentAmount || ''}
            onChange={(e) => setFormData({ ...formData, rentAmount: parseFloat(e.target.value) || 0 })}
            placeholder="Monthly rent amount"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
          <Select
            value={formData.paymentFrequency}
            onValueChange={(value) => setFormData({ ...formData, paymentFrequency: value as 'monthly' | 'quarterly' | 'yearly' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          value={formData.bankName}
          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          placeholder="e.g., HDFC Bank"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bankAccount">Account Number</Label>
          <Input
            id="bankAccount"
            value={formData.bankAccount}
            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
            placeholder="Bank account number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ifscCode">IFSC Code</Label>
          <Input
            id="ifscCode"
            value={formData.ifscCode}
            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
            placeholder="e.g., HDFC0001234"
          />
        </div>
      </div>
    </div>
  );

  const renderLandlordForm = () => (
    <div className="w-full">
      {renderStepIndicator()}
      {formStep === 1 && renderStep1()}
      {formStep === 2 && renderStep2()}
    </div>
  );

  const isFormValid = () => {
    return formData.name.trim() && formData.rentAmount > 0 && formData.paymentFrequency;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Landlord Management</h1>
          <p className="text-muted-foreground">
            Manage landlords who own billboard locations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Landlords</CardTitle>
          <CardDescription>View and manage all landlords</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search landlords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => {
              setFormData(initialFormData);
              setFormStep(1);
              setIsCreateOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Landlord
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Rent Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : landlords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No landlords found
                    </TableCell>
                  </TableRow>
                ) : (
                  landlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell className="font-medium">{landlord.name}</TableCell>
                      <TableCell>{landlord.contactPerson || '-'}</TableCell>
                      <TableCell>{landlord.phone || '-'}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(landlord.rentAmount as unknown as string))}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFrequencyLabel(landlord.paymentFrequency)}</Badge>
                      </TableCell>
                      <TableCell>
                        {landlord.isActive ? (
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
                            onClick={() => openViewDialog(landlord)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(landlord)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(landlord)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Landlord</DialogTitle>
            <DialogDescription>
              Add a new landlord to the system.
            </DialogDescription>
          </DialogHeader>
          {renderLandlordForm()}
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
              <Button onClick={() => setFormStep(formStep + 1)} disabled={!isStep1Valid()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !isFormValid()}>
                {saving ? 'Creating...' : 'Create Landlord'}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Landlord</DialogTitle>
            <DialogDescription>
              Update landlord details.
            </DialogDescription>
          </DialogHeader>
          {renderLandlordForm()}
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
            <DialogTitle>Landlord Details</DialogTitle>
          </DialogHeader>
          {selectedLandlord && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedLandlord.name}</h3>
                {'isActive' in selectedLandlord && selectedLandlord.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium">{selectedLandlord.contactPerson || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{selectedLandlord.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedLandlord.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{selectedLandlord.address || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rent Amount:</span>
                  <p className="font-medium text-lg">{formatCurrency(parseFloat(selectedLandlord.rentAmount as unknown as string))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Frequency:</span>
                  <p className="font-medium">{getFrequencyLabel(selectedLandlord.paymentFrequency)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Bank Name:</span>
                  <p className="font-medium">{selectedLandlord.bankName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">IFSC Code:</span>
                  <p className="font-medium">{selectedLandlord.ifscCode || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Account Number:</span>
                  <p className="font-medium">{selectedLandlord.bankAccount || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (selectedLandlord) openEditDialog(selectedLandlord);
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
            <AlertDialogTitle>Delete Landlord</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedLandlord?.name}"? This action cannot be undone.
              Note: Landlords with billboards cannot be deleted.
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
