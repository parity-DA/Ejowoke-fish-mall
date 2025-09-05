import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Search, Plus, Minus, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSales, Sale, SaleWithItems } from '@/hooks/useSales';
import { useCustomers } from '@/hooks/useCustomers';
import { useInventory } from '@/hooks/useInventory';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSale, setViewingSale] = useState<SaleWithItems | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [payingSale, setPayingSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editForm, setEditForm] = useState({
    customer_id: '',
    payment_method: 'cash' as 'cash' | 'card' | 'transfer' | 'credit',
    status: 'completed' as 'pending' | 'completed' | 'cancelled',
    created_at: new Date(),
    items: [] as Array<{
      id?: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      pieces_sold?: number;
      product_name?: string;
    }>
  });

  const { sales, loading, deleteSale, updateSale, recordPayment } = useSales();
  const { customers } = useCustomers();
  const { inventory } = useInventory();
  const { isSuperAdmin } = useUserRoles();
  const { toast } = useToast();

  const [filterByDate, setFilterByDate] = useState(false);

  const { dailyRevenue, monthlyRevenue, totalSales, totalRevenue, filteredSales } = useMemo(() => {
    const daily = sales
      .filter(sale => new Date(sale.created_at).toDateString() === selectedDate.toDateString())
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    const monthly = sales
      .filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.getMonth() === currentMonth.getMonth() && saleDate.getFullYear() === currentMonth.getFullYear();
      })
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    const total = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

    const filtered = sales.filter(sale => {
      const searchMatch = sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.status.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterByDate) {
        return searchMatch && new Date(sale.created_at).toDateString() === selectedDate.toDateString();
      }
      return searchMatch;
    });

    return { dailyRevenue: daily, monthlyRevenue: monthly, totalSales: sales.length, totalRevenue: total, filteredSales: filtered };
  }, [sales, selectedDate, currentMonth, searchTerm, filterByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === 'prev' ? -1 : 1));
      return newMonth;
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSale(id);
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const handleViewDetails = async (sale: Sale) => {
    try {
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select('*, inventory(name)')
        .eq('sale_id', sale.id);

      if (error) throw error;

      setViewingSale({
        ...sale,
        sale_items: saleItems || [],
      });
    } catch (error) {
      toast({
        title: 'Error loading sale details',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (sale: Sale) => {
    // Fetch sale items for this sale
    try {
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*, inventory(name)')
        .eq('sale_id', sale.id);

      setEditingSale(sale);
      setEditForm({
        customer_id: sale.customer_id || "walk-in",
        payment_method: sale.payment_method,
        status: sale.status,
        created_at: new Date(sale.created_at),
        items: saleItems?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          pieces_sold: item.pieces_sold || 0,
          product_name: item.inventory?.name || 'Unknown Product'
        })) || []
      });
    } catch (error) {
      toast({
        title: 'Error loading sale details',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;

    try {
      await updateSale(editingSale.id, {
        customer_id: editForm.customer_id === "walk-in" ? undefined : editForm.customer_id,
        payment_method: editForm.payment_method,
        status: editForm.status,
        created_at: editForm.created_at.toISOString(),
        items: editForm.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          pieces_sold: item.pieces_sold || 0
        }))
      });

      setEditingSale(null);
      setEditForm({
        customer_id: "walk-in",
        payment_method: 'cash',
        status: 'completed',
        created_at: new Date(),
        items: []
      });
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const addEditItem = () => {
    setEditForm({
      ...editForm,
      items: [...editForm.items, {
        product_id: '',
        quantity: 0,
        unit_price: 0,
        pieces_sold: 0
      }]
    });
  };

  const removeEditItem = (index: number) => {
    setEditForm({
      ...editForm,
      items: editForm.items.filter((_, i) => i !== index)
    });
  };

  const updateEditItem = (index: number, field: string, value: any) => {
    const updatedItems = [...editForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === 'product_id' && value) {
      const product = inventory.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.selling_price;
        updatedItems[index].product_name = product.name;
      }
    }

    setEditForm({
      ...editForm,
      items: updatedItems
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800',
      credit: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge variant="outline" className={colors[method as keyof typeof colors]}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Loading sales data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
          <p className="text-muted-foreground">
            Manage and track all sales transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filterByDate ? format(selectedDate, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setFilterByDate(true);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Switch
              checked={filterByDate}
              onCheckedChange={setFilterByDate}
            />
            <Label htmlFor="filter-by-date" className="text-sm">Filter by date</Label>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue ({format(selectedDate, "MMM d")})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{dailyRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">{format(currentMonth, 'MMM yyyy')}</span>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{monthlyRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                {filterByDate
                  ? `Showing sales for ${format(selectedDate, "PPP")}`
                  : "Showing all sales"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sales found for this date.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {sale.customer?.name || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₦{sale.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(sale.payment_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sale.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <>
                            {sale.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPayingSale(sale);
                                  const balance = sale.total_amount - (sale.amount_paid || 0);
                                  setPaymentAmount(balance);
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(sale)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this sale? This action cannot be undone.
                                    Product stock will be restored to the original quantities.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(sale.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              Transaction ID: {viewingSale?.id}
            </DialogDescription>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Customer</p>
                  <p className="text-muted-foreground">{viewingSale.customer?.name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">{format(new Date(viewingSale.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  {getStatusBadge(viewingSale.status)}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Items Purchased</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingSale.sale_items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.inventory?.name || 'N/A'}</TableCell>
                        <TableCell>{item.quantity} kg</TableCell>
                        <TableCell>₦{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₦{(item.quantity * item.unit_price).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-end space-x-4">
                  <div className="text-right">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="text-muted-foreground">Discount</p>
                    <p className="font-semibold">Total Amount</p>
                    <p className="text-muted-foreground mt-2">Amount Paid</p>
                    <p className="font-semibold">Credit Owed</p>
                  </div>
                  <div className="text-right">
                    <p>₦{(viewingSale.total_amount + (viewingSale.discount || 0)).toLocaleString()}</p>
                    <p className="text-destructive">- ₦{(viewingSale.discount || 0).toLocaleString()}</p>
                    <p className="font-semibold">₦{viewingSale.total_amount.toLocaleString()}</p>
                    <p className="mt-2">₦{(viewingSale.amount_paid || 0).toLocaleString()}</p>
                    <p className="font-semibold text-orange-500">₦{(viewingSale.total_amount - (viewingSale.amount_paid || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingSale(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>
              Modify the sale details and items. Inventory will be updated accordingly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={editForm.customer_id || "walk-in"}
                  onValueChange={(value) => setEditForm({...editForm, customer_id: value === "walk-in" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={editForm.payment_method}
                  onValueChange={(value: 'cash' | 'card' | 'transfer' | 'credit') =>
                    setEditForm({...editForm, payment_method: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'pending' | 'completed' | 'cancelled') =>
                    setEditForm({...editForm, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sale_date">Date of Sale</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(editForm.created_at, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <CalendarComponent
                      mode="single"
                      selected={editForm.created_at}
                      onSelect={(date) => {
                        if (date) {
                          setEditForm({ ...editForm, created_at: date });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sale Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEditItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {editForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded">
                    <div>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateEditItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="Quantity (kg)"
                      value={item.quantity || ''}
                      onChange={(e) => updateEditItem(index, 'quantity', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price || ''}
                      onChange={(e) => updateEditItem(index, 'unit_price', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Pieces"
                      value={item.pieces_sold || ''}
                      onChange={(e) => updateEditItem(index, 'pieces_sold', Number(e.target.value))}
                    />
                    <div className="text-sm font-medium self-center">
                      ₦{((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEditItem(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {editForm.items.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">
                    Total: ₦{editForm.items.reduce((sum, item) =>
                      sum + ((item.quantity || 0) * (item.unit_price || 0)), 0
                    ).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSale(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!payingSale} onOpenChange={(open) => !open && setPayingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for sale ID: {payingSale?.id}
            </DialogDescription>
          </DialogHeader>
          {payingSale && (
            <div className="space-y-4">
              <div>
                <Label>Total Amount</Label>
                <p className="font-medium">₦{payingSale.total_amount.toLocaleString()}</p>
              </div>
              <div>
                <Label>Amount Paid</Label>
                <p className="font-medium">₦{(payingSale.amount_paid || 0).toLocaleString()}</p>
              </div>
              <div>
                <Label>Balance Due</Label>
                <p className="font-medium text-orange-500">₦{(payingSale.total_amount - (payingSale.amount_paid || 0)).toLocaleString()}</p>
              </div>
              <div className="pt-4">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingSale(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (payingSale) {
                  await recordPayment(payingSale.id, paymentAmount);
                  setPayingSale(null);
                  setPaymentAmount(0);
                }
              }}
            >
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
