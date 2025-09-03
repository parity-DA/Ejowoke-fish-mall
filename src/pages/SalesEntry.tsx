import { useState } from "react";
import { Plus, Minus, ShoppingCart, Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useSales } from "@/hooks/useSales";

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  pricingMethod: "per_kg" | "per_piece";
  unitPrice: number;
  quantityKg?: number;
  quantityPieces?: number;
  totalPiecesSold?: number;
  lineTotal: number;
  availableStock: string;
}

export default function SalesEntry() {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { createSale } = useSales();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const addItem = () => {
    const newItem: SaleItem = {
      id: `item-${Date.now()}`,
      productId: "",
      productName: "",
      pricingMethod: "per_kg",
      unitPrice: 0,
      quantityKg: 0,
      quantityPieces: 0,
      totalPiecesSold: 0,
      lineTotal: 0,
      availableStock: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SaleItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // Auto-populate product details when product is selected
        if (field === "productId") {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.pricingMethod = product.category?.includes('kg') ? "per_kg" : "per_piece";
            updatedItem.unitPrice = product.selling_price;
            updatedItem.availableStock = `${product.stock_quantity} ${product.category?.includes('kg') ? 'kg' : 'pcs'}`;
          }
        }

        // Calculate line total and total pieces sold
        if (updatedItem.pricingMethod === "per_kg") {
          updatedItem.lineTotal = (updatedItem.quantityKg || 0) * updatedItem.unitPrice;
          if (field !== 'totalPiecesSold') {
            // Estimate pieces from kg, allowing user to override
            updatedItem.totalPiecesSold = Math.round((updatedItem.quantityKg || 0) / 1.2);
          }
        } else if (updatedItem.pricingMethod === "per_piece") {
          updatedItem.lineTotal = (updatedItem.quantityPieces || 0) * updatedItem.unitPrice;
          updatedItem.totalPiecesSold = updatedItem.quantityPieces || 0;
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal - discount;
  const balance = total - amountPaid;

  const handleSave = async () => {
    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Please add at least one item to the sale.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSale({
        customer_id: selectedCustomer === "walk-in" ? undefined : selectedCustomer,
        payment_method: paymentMethod as 'cash' | 'card' | 'transfer' | 'credit',
        status: balance > 0 ? 'pending' : 'completed',
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.pricingMethod === "per_kg" ? Math.round((item.quantityKg || 0) * 1000) / 1000 : item.quantityPieces || 0,
          unit_price: item.unitPrice,
        })),
      });

      // Reset form
      setItems([]);
      setSelectedCustomer("");
      setDiscount(0);
      setAmountPaid(0);
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Entry</h1>
          <p className="text-muted-foreground">Record new sales transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Complete Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sale Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer">Select Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose customer or walk-in" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{customer.name}</span>
                          {customer.credit_limit && customer.credit_limit > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              Credit: ₦{customer.credit_limit.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sale Items</CardTitle>
                <CardDescription>Add products to this sale</CardDescription>
              </div>
              <Button onClick={addItem} size="sm" className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No items added yet. Click "Add Item" to get started.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item #{items.indexOf(item) + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                          <Label>Product</Label>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(item.id, "productId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div>
                                    <div>{product.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ₦{product.selling_price.toLocaleString()} {product.category?.includes('kg') ? "/kg" : "/pc"}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.availableStock && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Available: {item.availableStock}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Unit Price (₦)</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                          />
                        </div>

                        {item.pricingMethod === "per_kg" ? (
                          <>
                            <div>
                              <Label>Quantity (kg)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={item.quantityKg || ""}
                                onChange={(e) => updateItem(item.id, "quantityKg", Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label>Total Pieces Sold</Label>
                              <Input
                                type="number"
                                value={item.totalPiecesSold || ""}
                                onChange={(e) => updateItem(item.id, "totalPiecesSold", Number(e.target.value))}
                                placeholder="Pieces"
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <Label>Quantity (pieces)</Label>
                            <Input
                              type="number"
                              value={item.quantityPieces || ""}
                              onChange={(e) => updateItem(item.id, "quantityPieces", Number(e.target.value))}
                            />
                          </div>
                        )}

                        <div>
                          <Label>Line Total</Label>
                          <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                            <span className="font-medium">₦{item.lineTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Sale Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">₦{subtotal.toLocaleString()}</span>
              </div>

              <div>
                <Label htmlFor="discount">Discount (₦)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card/POS</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount-paid">Amount Paid (₦)</Label>
                <Input
                  id="amount-paid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Balance Due:</span>
                  <span className={`font-medium ${balance > 0 ? 'text-warning' : balance < 0 ? 'text-success' : ''}`}>
                    ₦{balance.toLocaleString()}
                  </span>
                </div>
                {balance > 0 && (
                  <Badge variant="secondary" className="mt-2 w-full justify-center">
                    Credit Sale
                  </Badge>
                )}
                {balance < 0 && (
                  <Badge variant="default" className="mt-2 w-full justify-center">
                    Change Due: ₦{Math.abs(balance).toLocaleString()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
