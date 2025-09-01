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
import { useProducts } from "@/hooks/useProducts";

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock: 0,
    barcode: "",
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.selling_price) {
      return;
    }

    try {
      await addProduct(newProduct);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        minimum_stock: 0,
        barcode: "",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products & Price List</h1>
          <p className="text-muted-foreground">Manage your catfish products and pricing</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new catfish product with pricing information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={newProduct.name || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Fresh Catfish"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newProduct.description || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost-price">Cost Price per kg (₦) *</Label>
                    <Input
                      id="cost-price"
                      type="number"
                      value={newProduct.cost_price || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, cost_price: Number(e.target.value) })}
                      placeholder="Purchase cost per kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selling-price">Selling Price per kg (₦) *</Label>
                    <Input
                      id="selling-price"
                      type="number"
                      value={newProduct.selling_price || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, selling_price: Number(e.target.value) })}
                      placeholder="Selling price per kg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock Quantity (kg)</Label>
                    <Input
                      id="stock"
                      type="number"
                      step="0.1"
                      value={newProduct.stock_quantity || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                      placeholder="Stock in kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-pieces">Total Pieces</Label>
                    <Input
                      type="number"
                      value={Math.round((newProduct.stock_quantity || 0) / 1.2)}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="min-stock">Minimum Stock (kg)</Label>
                  <Input
                    id="min-stock"
                    type="number"
                    step="0.1"
                    value={newProduct.minimum_stock || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, minimum_stock: Number(e.target.value) })}
                    placeholder="Alert when below this amount"
                  />
                </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} className="bg-gradient-primary">
                  Add Product
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
                <p className="text-2xl font-bold">{loading ? "..." : products.length}</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : products.filter(p => p.stock_quantity > p.minimum_stock).length}</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : products.filter(p => p.stock_quantity <= p.minimum_stock).length}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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
            {products.map((product) => {
              // Mock daily data - in real app this would come from more detailed tracking
              const todayReceived = Math.floor(Math.random() * 50) + 10;
              const yesterdayLeftover = Math.floor(Math.random() * 30) + 5;
              const todaySold = Math.floor(Math.random() * 40) + 15;
              
              return (
                <Card key={product.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-3">{product.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Current Stock:</span>
                        <span className="font-medium">{product.stock_quantity} units</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Minimum Stock:</span>
                        <span className="font-medium">{product.minimum_stock} units</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Stock Status:</span>
                          <Badge 
                            variant={product.stock_quantity <= product.minimum_stock ? "destructive" : "default"}
                          >
                            {product.stock_quantity <= product.minimum_stock ? "Low Stock" : "In Stock"}
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

      {/* Products Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            Manage your catfish products, pricing, and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
               <TableRow>
                 <TableHead>Product Name</TableHead>
                 <TableHead>Category</TableHead>
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
              {filteredProducts.map((product) => {
                const profitMargin = product.selling_price > 0 && product.cost_price > 0
                  ? (((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)
                  : "0";
                const isLowMargin = parseFloat(profitMargin) < 15;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.category || "General"}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                       ₦{product.selling_price.toLocaleString()}/kg
                     </TableCell>
                     <TableCell className="text-right">
                       ₦{product.cost_price.toLocaleString()}/kg
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="space-y-1">
                         <Badge variant={product.stock_quantity <= product.minimum_stock ? "destructive" : "default"}>
                           {product.stock_quantity} kg
                         </Badge>
                         <div className="text-xs text-muted-foreground">
                           ≈ {Math.round(product.stock_quantity / 1.2)} pcs
                         </div>
                       </div>
                     </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isLowMargin ? "destructive" : "default"}>
                        {profitMargin}%
                      </Badge>
                    </TableCell>
                     <TableCell>
                       {product.description || "N/A"}
                     </TableCell>
                     <TableCell>
                       <Badge variant={product.stock_quantity <= product.minimum_stock ? "destructive" : "default"}>
                         {product.stock_quantity <= product.minimum_stock ? "Low Stock" : "Active"}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                         <Button variant="ghost" size="sm" onClick={() => updateProduct(product.id, product)}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-destructive hover:text-destructive"
                           onClick={() => deleteProduct(product.id)}
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
