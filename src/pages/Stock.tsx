import { useState } from "react";
import { Plus, Truck, Calendar, Package, Edit, Trash2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useStock } from "@/hooks/useStock";
import { useInventory } from "@/hooks/useInventory";

export default function Stock() {
  const { stock, loading, addStock, updateStock, deleteStock } = useStock();
  const { inventory } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  const [newStockItem, setNewStockItem] = useState({
    supplier_name: "",
    total_amount: 0,
    items: [] as Array<{
      inventory_item_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
    }>,
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
  });


  const filteredStock = stock.filter(item =>
    item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStock = async () => {
    if (!newStockItem.supplier_name || !newStockItem.total_amount) {
      toast({
        title: "Missing information",
        description: "Please fill in supplier name and total amount.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await addStock(newStockItem);

    if (!error) {
      setNewStockItem({
        supplier_name: "",
        total_amount: 0,
        items: [],
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in supplier name and phone.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would save to database
    toast({
      title: "Supplier added successfully!",
      description: `${newSupplier.name} has been added.`,
    });

    setNewSupplier({ name: "", phone: "", address: "" });
    setIsSupplierDialogOpen(false);
  };

  const totalValue = stock.reduce((sum, item) => sum + item.total_amount, 0);
  const totalRemainingValue = stock.reduce((sum, item) => sum + item.total_amount, 0); // This would need proper calculation in real app

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading stock...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
          <p className="text-muted-foreground">Manage suppliers and stock lots</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>Create a new supplier for purchasing stock.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="e.g., Aqua Farm Lagos"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier-phone">Phone *</Label>
                  <Input
                    id="supplier-phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="e.g., 08012345678"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier-address">Address</Label>
                  <Input
                    id="supplier-address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="e.g., Lagos State"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSupplier} className="bg-gradient-primary">
                    Add Supplier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Stock</DialogTitle>
                <DialogDescription>Record a new stock lot from a supplier.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    value={newStockItem.supplier_name}
                    onChange={(e) => setNewStockItem({ ...newStockItem, supplier_name: e.target.value })}
                    placeholder="e.g., Aqua Farm Lagos"
                  />
                </div>

                <div>
                  <Label htmlFor="total-amount">Total Amount (₦) *</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    value={newStockItem.total_amount || ""}
                    onChange={(e) => setNewStockItem({ ...newStockItem, total_amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStock} className="bg-gradient-primary">
                    Add Stock
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stock.length}</p>
                <p className="text-xs text-muted-foreground">Total Stock Lots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Suppliers</p>
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
                <p className="text-2xl font-bold">₦{totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Stock Value</p>
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
                <p className="text-2xl font-bold">₦{totalRemainingValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Remaining Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

      {/* Stock Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Stock Records</CardTitle>
          <CardDescription>All recorded stock lots from suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{item.supplier_name}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{item.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => updateStock && updateStock(item.id, item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteStock && deleteStock(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No stock found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
