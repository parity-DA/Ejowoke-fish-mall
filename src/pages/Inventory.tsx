import { useState } from "react";
import { Plus, Package, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useInventory } from "@/hooks/useInventory";

export default function Inventory() {
  const { inventory, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [newItem, setNewItem] = useState({
    name: "Catfish",
    description: "",
    category: "Fish",
    size: "1kg",
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    total_pieces: 0,
    minimum_stock: 0,
    barcode: "",
  });

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.selling_price) {
      return;
    }

    try {
      await addInventoryItem(newItem);
      setNewItem({
        name: "Catfish",
        description: "",
        category: "Fish",
        size: "1kg",
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        total_pieces: 0,
        minimum_stock: 0,
        barcode: "",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory & Price List</h1>
          <p className="text-muted-foreground">Manage your catfish inventory and pricing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add to Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Inventory</DialogTitle>
              <DialogDescription>
                Create a new inventory item with pricing information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Specie</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="size">Size</Label>
                  <Select value={newItem.size} onValueChange={(value) => setNewItem({ ...newItem, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500g">500g</SelectItem>
                      <SelectItem value="1kg">1kg</SelectItem>
                      <SelectItem value="1.5kg">1.5kg</SelectItem>
                      <SelectItem value="2kg">2kg</SelectItem>
                      <SelectItem value="2.5kg">2.5kg</SelectItem>
                      <SelectItem value="3kg">3kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost-price">Cost Price per kg (₦) *</Label>
                    <Input
                      id="cost-price"
                      type="number"
                      value={newItem.cost_price || ""}
                      onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })}
                      placeholder="Purchase cost per kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selling-price">Selling Price per kg (₦) *</Label>
                    <Input
                      id="selling-price"
                      type="number"
                      value={newItem.selling_price || ""}
                      onChange={(e) => setNewItem({ ...newItem, selling_price: Number(e.target.value) })}
                      placeholder="Selling price per kg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Total kg supplied</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="0.1"
                      value={newItem.stock_quantity || ""}
                      onChange={(e) => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })}
                      placeholder="Stock in kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-pieces">Total Pieces</Label>
                    <Input
                      id="total-pieces"
                      type="number"
                      value={newItem.total_pieces || ""}
                      onChange={(e) => setNewItem({ ...newItem, total_pieces: Number(e.target.value) })}
                      placeholder={Math.round((newItem.stock_quantity || 0) / 1.2).toString()}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="min-stock">Minimum Stock (kg)</Label>
                  <Input
                    id="min-stock"
                    type="number"
                    step="0.1"
                    value={newItem.minimum_stock || ""}
                    onChange={(e) => setNewItem({ ...newItem, minimum_stock: Number(e.target.value) })}
                    placeholder="Alert when below this amount"
                  />
                </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} className="bg-gradient-primary">
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : inventory.length}</p>
                <p className="text-xs text-muted-foreground">Total Inventory Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-success rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : inventory.filter(p => p.stock_quantity > p.minimum_stock).length}</p>
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-accent rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : inventory.filter(p => p.stock_quantity <= p.minimum_stock).length}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stock Dashboard */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Daily Stock Dashboard</CardTitle>
          <CardDescription>
            Track daily stock movements and remaining inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventory.map((item) => {
              // Mock daily data - in real app this would come from more detailed tracking
              const todayReceived = Math.floor(Math.random() * 50) + 10;
              const yesterdayLeftover = Math.floor(Math.random() * 30) + 5;
              const todaySold = Math.floor(Math.random() * 40) + 15;

              return (
                <Card key={item.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-3">{item.name} ({item.size})</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-medium">{item.stock_quantity} units</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Minimum Stock:</span>
                        <span className="font-medium">{item.minimum_stock} units</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Stock Status:</span>
                          <Badge
                            variant={item.stock_quantity <= item.minimum_stock ? "destructive" : "default"}
                          >
                            {item.stock_quantity <= item.minimum_stock ? "Low Stock" : "In Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Inventory Catalog</CardTitle>
          <CardDescription>
            Manage your catfish inventory, pricing, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
               <TableRow>
                 <TableHead>Specie</TableHead>
                 <TableHead>Size</TableHead>
                 <TableHead className="text-right">Selling Price (/kg)</TableHead>
                 <TableHead className="text-right">Cost Price (/kg)</TableHead>
                 <TableHead className="text-right">Stock (kg) + Pieces</TableHead>
                 <TableHead className="text-right">Profit Margin</TableHead>
                 <TableHead>Description</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const profitMargin = item.selling_price > 0 && item.cost_price > 0
                  ? (((item.selling_price - item.cost_price) / item.selling_price) * 100).toFixed(1)
                  : "0";
                const isLowMargin = parseFloat(profitMargin) < 15;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.size || "N/A"}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                       ₦{item.selling_price.toLocaleString()}/kg
                     </TableCell>
                     <TableCell className="text-right">
                       ₦{item.cost_price.toLocaleString()}/kg
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="space-y-1">
                         <Badge variant={item.stock_quantity <= item.minimum_stock ? "destructive" : "default"}>
                           {item.stock_quantity} kg
                         </Badge>
                         <div className="text-xs text-muted-foreground">
                           {item.total_pieces ? `${item.total_pieces} pcs` : `≈ ${Math.round(item.stock_quantity / 1.2)} pcs`}
                         </div>
                       </div>
                     </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isLowMargin ? "destructive" : "default"}>
                        {profitMargin}%
                      </Badge>
                    </TableCell>
                     <TableCell>
                       {item.description || "N/A"}
                     </TableCell>
                     <TableCell>
                       <Badge variant={item.stock_quantity <= item.minimum_stock ? "destructive" : "default"}>
                         {item.stock_quantity <= item.minimum_stock ? "Low Stock" : "Active"}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                         <Button variant="ghost" size="sm" onClick={() => updateInventoryItem(item.id, item)}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="text-destructive hover:text-destructive"
                           onClick={() => deleteInventoryItem(item.id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
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
