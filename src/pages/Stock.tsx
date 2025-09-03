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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { useStock } from "@/hooks/useStock";
import { useInventory } from "@/hooks/useInventory";
import { format } from "date-fns";

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
      total_pieces: number;
    }>,
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const filteredStock = stock.filter(item => {
    const itemDate = new Date(item.created_at);
    const sameDay = selectedDate ? itemDate.toDateString() === selectedDate.toDateString() : true;
    return item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) && sameDay;
  });

  const handleAddStock = async () => {
    if (!newStockItem.supplier_name || newStockItem.items.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a supplier name and add at least one item.",
        variant: "destructive",
      });
      return;
    }

    for (const item of newStockItem.items) {
      if (!item.inventory_item_id) {
        toast({
          title: "Incomplete item",
          description: "Please select an inventory item for all entries.",
          variant: "destructive",
        });
        return;
      }
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

  const [historicalData, setHistoricalData] = useState({
    openingStockValue: 0,
    stockInValue: 0,
    stockOutValue: 0,
    closingStockValue: 0,
  });

  useEffect(() => {
    if (selectedDate) {
      getHistoricalStockData(selectedDate).then(data => {
        setHistoricalData(data);
      });
    }
  }, [selectedDate]);

  const totalValue = stock.reduce((sum, item) => sum + item.total_amount, 0);
  const totalRemainingValue = inventory.reduce((sum, item) => sum + (item.cost_price * item.stock_quantity), 0);

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
          <p className="text-muted-foreground">Manage suppliers and stock lots</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[280px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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

                {newStockItem.items.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const items = [...newStockItem.items];
                          items.splice(index, 1);
                          setNewStockItem({ ...newStockItem, items });
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Inventory Item</Label>
                        <Select
                          value={item.inventory_item_id}
                          onValueChange={(value) => {
                            const items = [...newStockItem.items];
                            items[index].inventory_item_id = value;
                            setNewStockItem({ ...newStockItem, items });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity (kg)</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const items = [...newStockItem.items];
                            items[index].quantity = Number(e.target.value);
                            items[index].total_cost = items[index].quantity * items[index].unit_cost;
                            setNewStockItem({ ...newStockItem, items, total_amount: items.reduce((sum, i) => sum + i.total_cost, 0) });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Unit Cost (₦)</Label>
                        <Input
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => {
                            const items = [...newStockItem.items];
                            items[index].unit_cost = Number(e.target.value);
                            items[index].total_cost = items[index].quantity * items[index].unit_cost;
                            setNewStockItem({ ...newStockItem, items, total_amount: items.reduce((sum, i) => sum + i.total_cost, 0) });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Total Pieces</Label>
                        <Input
                          type="number"
                          value={item.total_pieces}
                          onChange={(e) => {
                            const items = [...newStockItem.items];
                            items[index].total_pieces = Number(e.target.value);
                            setNewStockItem({ ...newStockItem, items });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Total Cost</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                          <span className="font-medium">₦{item.total_cost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    setNewStockItem({
                      ...newStockItem,
                      items: [
                        ...newStockItem.items,
                        { inventory_item_id: "", quantity: 0, unit_cost: 0, total_cost: 0, total_pieces: 0 },
                      ],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>

                <div>
                  <Label htmlFor="total-amount">Total Amount (₦)</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    value={newStockItem.total_amount || ""}
                    readOnly
                    className="bg-muted"
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
                <p className="text-2xl font-bold">₦{historicalData.openingStockValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Opening Stock Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₦{historicalData.stockInValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Stock In Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-destructive rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦{historicalData.stockOutValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Stock Out Value (Sales)</p>
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
                <p className="text-2xl font-bold">₦{historicalData.closingStockValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Closing Stock Value</p>
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

      {/* Stock History Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
          <CardDescription>Detailed history of all stock supplies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Quantity (kg)</TableHead>
                <TableHead className="text-right">Unit Cost (₦)</TableHead>
                <TableHead className="text-right">Total Cost (₦)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.flatMap(s =>
                s.stock_items
                  ? s.stock_items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{s.supplier_name}</TableCell>
                        <TableCell>{item.inventory?.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₦{item.unit_cost.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{item.total_cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/*
                              TODO: The Edit/Delete buttons currently operate on the entire stock lot (`s.id`),
                              not the individual item. This is because the UI shows items, but the data model
                              is based on stock lots. A future improvement would be to allow editing or
                              deleting individual items from a stock lot, which would require a more
                              complex implementation (e.g., a new dialog for editing a lot, and a new
                              function to handle deleting a single item and updating inventory).
                            */}
                            <Button variant="ghost" size="icon" onClick={() => {
                              // For now, edit is not implemented. A full implementation would
                              // likely open a dialog to edit the entire stock lot.
                              console.log(`Edit stock lot: ${s.id}`)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteStock(s.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : []
              )}
              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No stock history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
