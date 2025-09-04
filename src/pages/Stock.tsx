import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock } from '@/hooks/useStock';
import { useInventory } from '@/hooks/useInventory';
import { Plus, Package, TrendingUp, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, addDays, subDays } from 'date-fns';

export default function Stock() {
  const { stockUpdates, loading, addStockUpdate, deleteStockUpdate } = useStock();
  const { inventory } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newUpdate, setNewUpdate] = useState({
    inventory_id: '',
    driver_name: '',
    quantity_added_kg: 0,
    pieces_added: 0,
    update_date: new Date().toISOString().split('T')[0], // Today's date
  });

  const filteredUpdates = stockUpdates.filter(update =>
    update.inventory?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUpdate = async () => {
    try {
      await addStockUpdate({
        ...newUpdate,
        update_date: new Date(newUpdate.update_date).toISOString(),
      });
      
      setNewUpdate({
        inventory_id: '',
        driver_name: '',
        quantity_added_kg: 0,
        pieces_added: 0,
        update_date: new Date().toISOString().split('T')[0],
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding stock update:', error);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    try {
      await deleteStockUpdate(id);
    } catch (error) {
      console.error('Error deleting stock update:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const generateCSVReport = () => {
    const selectedDateStr = selectedDate.toDateString();
    const dayUpdates = stockUpdates.filter(update => 
      new Date(update.update_date).toDateString() === selectedDateStr
    );

    const csvContent = [
      ['Date', 'Inventory Item', 'Size', 'Driver/Supplier', 'Quantity Added (kg)', 'Pieces Added', 'Cost Price per kg', 'Value Added'],
      ...dayUpdates.map(update => [
        format(new Date(update.update_date), 'MMM dd, yyyy'),
        update.inventory?.name || '',
        update.inventory?.size || '',
        update.driver_name || '',
        update.quantity_added_kg.toString(),
        update.pieces_added?.toString() || '0',
        update.inventory?.cost_price?.toString() || '0',
        ((update.inventory?.cost_price || 0) * update.quantity_added_kg).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get cumulative total supplied stock value (never reduces)
  const getTotalSuppliedStockValue = () => {
    const selectedDateStr = selectedDate.toDateString();
    const updatesUpToDate = stockUpdates.filter(update => 
      new Date(update.update_date) <= selectedDate
    );
    
    return updatesUpToDate.reduce((total, update) => {
      const costPrice = update.inventory?.cost_price || 0;
      return total + (costPrice * update.quantity_added_kg);
    }, 0);
  };

  const getSelectedDateUpdates = () => {
    const selectedDateStr = selectedDate.toDateString();
    return stockUpdates.filter(update => 
      new Date(update.update_date).toDateString() === selectedDateStr
    );
  };

  const getSelectedDateStockAdded = () => {
    const selectedDateUpdates = getSelectedDateUpdates();
    return selectedDateUpdates.reduce((total, update) => total + update.quantity_added_kg, 0);
  };

  const getSelectedDateSuppliedStockValue = () => {
    const selectedDateUpdates = getSelectedDateUpdates();
    return selectedDateUpdates.reduce((total, update) => {
      const costPrice = update.inventory?.cost_price || 0;
      return total + (costPrice * update.quantity_added_kg);
    }, 0);
  };

  const getCumulativeStockAdded = () => {
    const updatesUpToDate = stockUpdates.filter(update => 
      new Date(update.update_date) <= selectedDate
    );
    
    return updatesUpToDate.reduce((total, update) => total + update.quantity_added_kg, 0);
  };

  // Get cumulative total pieces added up to selected date
  const getTotalPiecesAdded = () => {
    const updatesUpToDate = stockUpdates.filter(update => 
      new Date(update.update_date) <= selectedDate
    );
    
    return updatesUpToDate.reduce((total, update) => {
      return total + (update.pieces_added || 0);
    }, 0);
  };

  const getSelectedDatePiecesAdded = () => {
    const selectedDateUpdates = getSelectedDateUpdates();
    return selectedDateUpdates.reduce((total, update) => total + (update.pieces_added || 0), 0);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Track and update your inventory stock levels</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium px-3 py-1 bg-muted rounded">
              {format(selectedDate, 'MMM dd, yyyy')}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Export Button */}
          <Button variant="outline" onClick={generateCSVReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Stock Update</DialogTitle>
                <DialogDescription>
                  Record new stock supply for an inventory item.
                </DialogDescription>
              </DialogHeader>
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
              <DialogFooter>
                <Button onClick={handleAddUpdate}>Add Stock Update</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supplied Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{getTotalSuppliedStockValue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative value up to {format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date Supplied Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{getSelectedDateSuppliedStockValue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date Updates</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSelectedDateUpdates().length}</div>
            <p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date Stock Added</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSelectedDateStockAdded()}kg</div>
            <p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumulative Stock Added</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCumulativeStockAdded()}kg</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative up to {format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pieces Added</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalPiecesAdded().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative up to {format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Date Pcs Added</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getSelectedDatePiecesAdded().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{format(selectedDate, 'MMM dd, yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search stock updates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stock Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Update History</CardTitle>
          <CardDescription>
            View and manage all stock updates and supply records
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUpdates.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No stock updates found. Add your first stock update to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
