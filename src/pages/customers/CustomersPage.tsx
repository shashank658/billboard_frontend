import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Users, Eye } from 'lucide-react';
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
  customerService,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from '@/services/customer.service';
import type { Customer, PaginationInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

const initialFormData: CreateCustomerDto = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  billingAddress: '',
  gstNumber: '',
  panNumber: '',
  bankName: '',
  bankAccount: '',
  ifscCode: '',
};

export default function CustomersPage() {
  const { toast } = useToast();
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

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerDto>(initialFormData);
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

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
      });
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      await customerService.createCustomer(formData);
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
      setIsCreateOpen(false);
      setFormData(initialFormData);
      fetchCustomers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
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
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      const updateData: UpdateCustomerDto = { ...formData };
      await customerService.updateCustomer(selectedCustomer.id, updateData);
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
      setIsEditOpen(false);
      setSelectedCustomer(null);
      setFormData(initialFormData);
      fetchCustomers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update customer';
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
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      await customerService.deleteCustomer(selectedCustomer.id);
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      billingAddress: customer.billingAddress || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      bankName: customer.bankName || '',
      bankAccount: customer.bankAccount || '',
      ifscCode: customer.ifscCode || '',
    });
    setFormStep(1);
    setIsEditOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const isStep1Valid = () => formData.name.trim().length > 0;

  const stepLabels = ['Basic Info', 'Tax & Address', 'Bank Details'];

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
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Company or customer name"
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
          placeholder="contact@company.com"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gstNumber">GST Number</Label>
          <Input
            id="gstNumber"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="panNumber">PAN Number</Label>
          <Input
            id="panNumber"
            value={formData.panNumber}
            onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
            placeholder="AAAAA0000A"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingAddress">Billing Address (if different)</Label>
        <Textarea
          id="billingAddress"
          value={formData.billingAddress}
          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
          placeholder="Billing address"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
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

  const renderCustomerForm = () => (
    <div className="w-full">
      {renderStepIndicator()}
      {formStep === 1 && renderStep1()}
      {formStep === 2 && renderStep2()}
      {formStep === 3 && renderStep3()}
    </div>
  );

  const isFormValid = () => {
    return formData.name.trim().length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage advertisers and clients who book billboards
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>View and manage all customers (advertisers)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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
              Add Customer
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
                  <TableHead>Email</TableHead>
                  <TableHead>GST Number</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.contactPerson || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>
                        {customer.gstNumber ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {customer.gstNumber}
                          </code>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {customer.isActive ? (
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
                            onClick={() => openViewDialog(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(customer)}
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
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Add a new customer (advertiser) to the system.
            </DialogDescription>
          </DialogHeader>
          {renderCustomerForm()}
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
              <Button onClick={() => setFormStep(formStep + 1)} disabled={formStep === 1 && !isStep1Valid()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving || !isFormValid()}>
                {saving ? 'Creating...' : 'Create Customer'}
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
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer details.
            </DialogDescription>
          </DialogHeader>
          {renderCustomerForm()}
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
              <Button onClick={() => setFormStep(formStep + 1)} disabled={formStep === 1 && !isStep1Valid()}>
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
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                {selectedCustomer.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium">{selectedCustomer.contactPerson || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedCustomer.email || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">GST Number:</span>
                  <p className="font-medium">{selectedCustomer.gstNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">PAN Number:</span>
                  <p className="font-medium">{selectedCustomer.panNumber || '-'}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{selectedCustomer.address || '-'}</p>
                </div>
                {selectedCustomer.billingAddress && (
                  <div>
                    <span className="text-muted-foreground">Billing Address:</span>
                    <p className="font-medium">{selectedCustomer.billingAddress}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Bank Name:</span>
                  <p className="font-medium">{selectedCustomer.bankName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">IFSC Code:</span>
                  <p className="font-medium">{selectedCustomer.ifscCode || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Account Number:</span>
                  <p className="font-medium">{selectedCustomer.bankAccount || '-'}</p>
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
              if (selectedCustomer) openEditDialog(selectedCustomer);
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
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be undone.
              Note: Customers with bookings cannot be deleted.
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
