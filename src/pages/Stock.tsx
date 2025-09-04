import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock } from '@/hooks/useStock';
import { useInventory } from '@/hooks/useInventory';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Plus, Package, TrendingUp, Calendar, Download, DollarSign, Weight, ShoppingBasket, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function Stock() {
  const { stockUpdates, loading, addStockUpdate, deleteStockUpdate, fetchStockUpdates } = useStock();
  const { inventory } = useInventory();
  const { isSuperAdmin } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newUpdate, setNewUpdate] = useState({
    inventory_id: '',
    driver_name: '',
    quantity_added_kg: 0,
    pieces_added: 0,
    update_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (fetchStockUpdates) {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      fetchStockUpdates({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
    }
  }, [month, fetchStockUpdates]);

  const handleAddUpdate = async () => {
    const result = await addStockUpdate({ ...newUpdate, update_date: new Date(newUpdate.update_date).toISOString() });
    if (result.success) {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      fetchStockUpdates({ startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') });
      setNewUpdate({ inventory_id: '', driver_name: '', quantity_added_kg: 0, pieces_added: 0, update_date: new Date().toISOString().split('T')[0] });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    const result = await deleteStockUpdate(id);
    if (result.success) {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      fetchStockUpdates({ startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') });
    }
  };

  const filteredUpdates = useMemo(() => 
    stockUpdates.filter(update =>
      update.inventory?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [stockUpdates, searchTerm]);

  // --- Card Calculation Logic ---

  // Selected Day Stats
  const selectedDateUpdates = useMemo(() => {
    const selectedDateStr = selectedDate.toDateString();
    return stockUpdates.filter(update => new Date(update.update_date).toDateString() === selectedDateStr);
  }, [stockUpdates, selectedDate]);

  const selectedDateStockValue = useMemo(() => selectedDateUpdates.reduce((total, update) => total + ((update.inventory?.cost_price || 0) * update.quantity_added_kg), 0), [selectedDateUpdates]);
  const selectedDateStockAdded = useMemo(() => selectedDateUpdates.reduce((total, update) => total + update.quantity_added_kg, 0), [selectedDateUpdates]);
  const selectedDatePiecesAdded = useMemo(() => selectedDateUpdates.reduce((total, update) => total + (update.pieces_added || 0), 0), [selectedDateUpdates]);

  // Monthly Stats
  const monthStockValue = useMemo(() => stockUpdates.reduce((total, update) => total + ((update.inventory?.cost_price || 0) * update.quantity_added_kg), 0), [stockUpdates]);
  const monthStockAdded = useMemo(() => stockUpdates.reduce((total, update) => total + update.quantity_added_kg, 0), [stockUpdates]);
  const monthPiecesAdded = useMemo(() => stockUpdates.reduce((total, update) => total + (update.pieces_added || 0), 0), [stockUpdates]);


  if (loading && stockUpdates.length === 0) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Track and update your inventory stock levels</p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(month, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(day) => day && setSelectedDate(day)}
                month={month}
                onMonthChange={(newMonth) => { setMonth(newMonth); setSelectedDate(newMonth); }}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
              />
            </PopoverContent>
          </Popover>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Stock</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Stock Update</DialogTitle><DialogDescription>Record new stock supply.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="inventory_id">Inventory Item</Label>
                  <Select value={newUpdate.inventory_id} onValueChange={(value) => setNewUpdate({ ...newUpdate, inventory_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inventory item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.size}) - Current: {item.stock_quantity}kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity_added_kg">Quantity Added (kg)</Label>
                    <Input
                      id="quantity_added_kg"
                      type="number"
                      step="0.01"
                      value={newUpdate.quantity_added_kg}
                      onChange={(e) => setNewUpdate({ ...newUpdate, quantity_added_kg: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pieces_added">Pieces Added</Label>
                    <Input
                      id="pieces_added"
                      type="number"
                      value={newUpdate.pieces_added}
                      onChange={(e) => setNewUpdate({ ...newUpdate, pieces_added: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="driver_name">Driver Name</Label>
                  <Input
                    id="driver_name"
                    value={newUpdate.driver_name}
                    onChange={(e) => setNewUpdate({ ...newUpdate, driver_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="update_date">Supply Date</Label>
                  <Input
                    id="update_date"
                    type="date"
                    value={newUpdate.update_date}
                    onChange={(e) => setNewUpdate({ ...newUpdate, update_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddUpdate}>Add Stock Update</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* --- Top Row: Selected Day --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Supplied Value (Day)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">₦{selectedDateStockValue.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stock Added (Day)</CardTitle><Weight className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{selectedDateStockAdded.toFixed(2)} kg</div><p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pieces Added (Day)</CardTitle><ShoppingBasket className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{selectedDatePiecesAdded.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Updates (Day)</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{selectedDateUpdates.length}</div><p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p></CardContent>
        </Card>

        {/* --- Bottom Row: Selected Month --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Supplied Value (Month)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">₦{monthStockValue.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">For {format(month, 'MMMM yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stock Added (Month)</CardTitle><Weight className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{monthStockAdded.toFixed(2)} kg</div><p className="text-xs text-muted-foreground mt-1">For {format(month, 'MMMM yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pieces Added (Month)</CardTitle><ShoppingBasket className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{monthPiecesAdded.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">For {format(month, 'MMMM yyyy')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Updates (Month)</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stockUpdates.length}</div><p className="text-xs text-muted-foreground mt-1">For {format(month, 'MMMM yyyy')}</p></CardContent>
        </Card>
      </div>

      {/* Stock Updates Table */}
      <Card>
        <CardHeader><CardTitle>Stock Update History</CardTitle><CardDescription>Displaying updates for {format(month, 'MMMM yyyy')}</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center py-4"><Input placeholder="Filter updates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" /></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Inventory Item</TableHead>
                <TableHead>Supplier/Driver</TableHead>
                <TableHead>Qty Added (kg)</TableHead>
                <TableHead>Pieces Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUpdates.map((update) => (
                <TableRow key={update.id}>
                  <TableCell>
                    {format(new Date(update.update_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{update.inventory?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Size: {update.inventory?.size || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{update.driver_name || '-'}</TableCell>
                  <TableCell>{update.quantity_added_kg}kg</TableCell>
                  <TableCell>{update.pieces_added || '-'}</TableCell>
                  <TableCell>
                    {isSuperAdmin && (
                      <div className="flex items-center space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Stock Update</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this stock update? This will also reverse the inventory changes. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUpdate(update.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && filteredUpdates.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">No stock updates found for {format(month, 'MMMM yyyy')}.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
