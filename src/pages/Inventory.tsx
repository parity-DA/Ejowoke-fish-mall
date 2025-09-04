import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useInventory, type InventoryItem } from '@/hooks/useInventory';
import { Plus, Package, AlertTriangle, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Inventory() {
  const { inventory, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem, refetch } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newItem, setNewItem] = useState({
    name: 'Fresh Catfish',
    size: '',
    cost_price: 0,
    selling_price: 0,
    total_kg_supplied: 0,
    total_pieces_supplied: 0,
    minimum_stock_kg: 0,
    barcode: '',
  });

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = async () => {
    try {
      await addInventoryItem({
        ...newItem,
        specie: 'Catfish',
        stock_quantity: newItem.total_kg_supplied, // Initialize current stock with supplied
        total_pieces: newItem.total_pieces_supplied, // Initialize current pieces
      } as Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>);
      
      setNewItem({
        name: 'Fresh Catfish',
        size: '',
        cost_price: 0,
        selling_price: 0,
        total_kg_supplied: 0,
        total_pieces_supplied: 0,
        minimum_stock_kg: 0,
        barcode: '',
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      await updateInventoryItem(editingItem.id, editingItem);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity <= 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.stock_quantity <= item.minimum_stock_kg) return { label: 'Low Stock', variant: 'outline' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const getTotalInventoryValue = () => {
    return inventory.reduce((total, item) => total + (item.cost_price * item.stock_quantity), 0);
  };

  const getInStockItems = () => {
    return inventory.filter(item => item.stock_quantity > item.minimum_stock_kg).length;
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.minimum_stock_kg).length;
  };

  const getOutOfStockItems = () => {
    return inventory.filter(item => item.stock_quantity <= 0).length;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your catfish inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Inventory Item
              </Button>
             </DialogTrigger>
            <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new catfish inventory item to your system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Fresh Catfish"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={newItem.size}
                  onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                  placeholder="e.g., 1kg, 500g, 2.5kg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_kg_supplied">Total kg Supplied</Label>
                  <Input
                    id="total_kg_supplied"
                    type="number"
                    step="0.01"
                    value={newItem.total_kg_supplied}
                    onChange={(e) => setNewItem({ ...newItem, total_kg_supplied: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_pieces_supplied">Total Pieces</Label>
                  <Input
                    id="total_pieces_supplied"
                    type="number"
                    value={newItem.total_pieces_supplied}
                    onChange={(e) => setNewItem({ ...newItem, total_pieces_supplied: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cost_price">Cost Price per kg (₦)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={newItem.cost_price}
                    onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="selling_price">Selling Price per kg (₦)</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={newItem.selling_price}
                    onChange={(e) => setNewItem({ ...newItem, selling_price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minimum_stock_kg">Minimum Stock (kg)</Label>
                <Input
                  id="minimum_stock_kg"
                  type="number"
                  step="0.01"
                  value={newItem.minimum_stock_kg}
                  onChange={(e) => setNewItem({ ...newItem, minimum_stock_kg: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddItem}>Add Item</Button>
             </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{getTotalInventoryValue().toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getInStockItems()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getLowStockItems()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getOutOfStockItems()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pond Cards - Individual Inventory Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Inventory Ponds</h2>
          <Badge variant="outline" className="text-sm">
            {filteredInventory.length} {filteredInventory.length === 1 ? 'pond' : 'ponds'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => {
            const status = getStockStatus(item);
            const stockPercentage = item.minimum_stock_kg > 0 
              ? Math.min(100, (item.stock_quantity / item.minimum_stock_kg) * 100)
              : item.stock_quantity > 0 ? 100 : 0;
            
            return (
              <Card 
                key={item.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  status.variant === 'destructive' ? 'border-red-200 bg-red-50/50' :
                  status.variant === 'outline' ? 'border-yellow-200 bg-yellow-50/50' :
                  'border-green-200 bg-green-50/50'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">{item.name}</h3>
                      <p className="text-lg font-bold text-gray-700">{item.size || 'N/A'}</p>
                    </div>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {/* Stock Level Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Stock Level</span>
                      <span>{stockPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          status.variant === 'destructive' ? 'bg-red-500' :
                          status.variant === 'outline' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, stockPercentage)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Stock Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <div className="text-lg font-bold text-blue-600">{item.stock_quantity}</div>
                      <div className="text-xs text-gray-500">kg</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <div className="text-lg font-bold text-purple-600">{item.total_pieces || 0}</div>
                      <div className="text-xs text-gray-500">pieces</div>
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">
                        ₦{(item.cost_price * item.stock_quantity).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Current Value</div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-1 pt-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 h-8 text-xs"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Inventory Item</DialogTitle>
                          <DialogDescription>
                            Update the details of this inventory item.
                          </DialogDescription>
                        </DialogHeader>
                        {editingItem && (
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Product Name</Label>
                              <Input
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                placeholder="Fresh Catfish"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Size</Label>
                              <Input
                                value={editingItem.size || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                                placeholder="e.g., 1kg, 500g, 2.5kg"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Current Stock (kg)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingItem.stock_quantity}
                                  onChange={(e) => setEditingItem({ ...editingItem, stock_quantity: Number(e.target.value) })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Current Pieces</Label>
                                <Input
                                  type="number"
                                  value={editingItem.total_pieces || 0}
                                  onChange={(e) => setEditingItem({ ...editingItem, total_pieces: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Total kg Supplied</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingItem.total_kg_supplied}
                                  onChange={(e) => setEditingItem({ ...editingItem, total_kg_supplied: Number(e.target.value) })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Total Pieces Supplied</Label>
                                <Input
                                  type="number"
                                  value={editingItem.total_pieces_supplied || 0}
                                  onChange={(e) => setEditingItem({ ...editingItem, total_pieces_supplied: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Cost Price per kg (₦)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingItem.cost_price}
                                  onChange={(e) => setEditingItem({ ...editingItem, cost_price: Number(e.target.value) })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Selling Price per kg (₦)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingItem.selling_price}
                                  onChange={(e) => setEditingItem({ ...editingItem, selling_price: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label>Minimum Stock (kg)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingItem.minimum_stock_kg}
                                onChange={(e) => setEditingItem({ ...editingItem, minimum_stock_kg: Number(e.target.value) })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Barcode (Optional)</Label>
                              <Input
                                value={editingItem.barcode || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                                placeholder="Product barcode"
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateItem}>
                            Update Item
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        // Navigate to stock page with this item selected
                        window.location.href = '/stock';
                      }}
                    >
                      <Package className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No inventory items found</p>
            <p className="text-sm">Add your first inventory item to get started</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Manage your catfish inventory items and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Stock (kg)</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Cost/kg</TableHead>
                <TableHead>Sale/kg</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const totalValue = item.cost_price * item.stock_quantity;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.category && (
                          <div className="text-sm text-muted-foreground">{item.category}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.size || '-'}</TableCell>
                    <TableCell>{item.stock_quantity}kg</TableCell>
                    <TableCell>{item.total_pieces}</TableCell>
                    <TableCell>₦{item.cost_price.toLocaleString()}</TableCell>
                    <TableCell>₦{item.selling_price.toLocaleString()}</TableCell>
                    <TableCell>₦{totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Inventory Item</DialogTitle>
                              <DialogDescription>
                                Update the details of this inventory item.
                              </DialogDescription>
                            </DialogHeader>
                            {editingItem && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Product Name</Label>
                                  <Input
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    placeholder="Fresh Catfish"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Size</Label>
                                  <Input
                                    value={editingItem.size || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                                    placeholder="e.g., 1kg, 500g, 2.5kg"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <Label>Current Stock (kg)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.stock_quantity}
                                      onChange={(e) => setEditingItem({ ...editingItem, stock_quantity: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Current Pieces</Label>
                                    <Input
                                      type="number"
                                      value={editingItem.total_pieces || 0}
                                      onChange={(e) => setEditingItem({ ...editingItem, total_pieces: Number(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <Label>Total kg Supplied</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.total_kg_supplied}
                                      onChange={(e) => setEditingItem({ ...editingItem, total_kg_supplied: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Total Pieces Supplied</Label>
                                    <Input
                                      type="number"
                                      value={editingItem.total_pieces_supplied || 0}
                                      onChange={(e) => setEditingItem({ ...editingItem, total_pieces_supplied: Number(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <Label>Cost Price per kg (₦)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.cost_price}
                                      onChange={(e) => setEditingItem({ ...editingItem, cost_price: Number(e.target.value) })}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Selling Price per kg (₦)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingItem.selling_price}
                                      onChange={(e) => setEditingItem({ ...editingItem, selling_price: Number(e.target.value) })}
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-2">
                                  <Label>Minimum Stock (kg)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editingItem.minimum_stock_kg}
                                    onChange={(e) => setEditingItem({ ...editingItem, minimum_stock_kg: Number(e.target.value) })}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Barcode (Optional)</Label>
                                  <Input
                                    value={editingItem.barcode || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                                    placeholder="Product barcode"
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingItem(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateItem}>
                                Update Item
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
