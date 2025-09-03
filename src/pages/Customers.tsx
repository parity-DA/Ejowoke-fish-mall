import { useState } from "react";
import { Plus, Users, Search, CreditCard, AlertTriangle, Phone, MapPin, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/useCustomers";

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    channel: "walk-in" as const,
    credit_limit: 0,
    outstanding_balance: 0,
    total_purchases: 0,
    notes: "",
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm));
    const matchesChannel = filterChannel === "all" || customer.channel === filterChannel;
    return matchesSearch && matchesChannel;
  });

  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.outstanding_balance, 0);
  const customersWithCredit = customers.filter(customer => customer.outstanding_balance > 0).length;

  const handleAddCustomer = async () => {
    if (!newCustomer.name) {
      return;
    }

    try {
      await addCustomer(newCustomer);
      setNewCustomer({
        name: "",
        phone: "",
        address: "",
        email: "",
        channel: "walk-in" as const,
        credit_limit: 0,
        outstanding_balance: 0,
        total_purchases: 0,
        notes: "",
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const channelColors = {
    "walk-in": "default",
    "retailer": "secondary", 
    "restaurant": "outline",
    "wholesaler": "default"
  } as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers & Credits</h1>
          <p className="text-muted-foreground">Manage your customer relationships and credit accounts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile with contact and credit information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="e.g., 08012345678"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Enter customer address"
                  rows={2}
                />
              </div>

                <div>
                  <Label htmlFor="channel">Customer Type</Label>
                  <Select
                    value={newCustomer.channel}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, channel: value as 'walk-in' | 'retailer' | 'restaurant' | 'wholesaler' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="retailer">Retailer</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="credit-limit">Credit Limit (₦)</Label>
                  <Input
                    id="credit-limit"
                    type="number"
                    value={newCustomer.credit_limit || ""}
                    onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: Number(e.target.value) })}
                  />
                </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Additional notes about this customer"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer} className="bg-gradient-primary">
                  Add Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">₦{totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{customersWithCredit}</p>
                <p className="text-xs text-muted-foreground">Customers with Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-success rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.filter(c => c.channel === "wholesaler").length}</p>
                <p className="text-xs text-muted-foreground">Wholesalers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="retailer">Retailers</SelectItem>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="wholesaler">Wholesalers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            Complete list of your customers with contact and credit information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.address && (
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {customer.address.slice(0, 30)}...
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={channelColors[customer.channel]}>
                      {customer.channel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.credit_limit > 0 ? `₦${customer.credit_limit.toLocaleString()}` : "No Credit"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={customer.outstanding_balance > 0 ? "text-warning font-medium" : ""}>
                      {customer.outstanding_balance > 0 ? `₦${customer.outstanding_balance.toLocaleString()}` : "₦0"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{customer.total_purchases.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : "Never"}
                    </span>
                  </TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end space-x-2">
                       <Button variant="outline" size="sm">
                         View
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => updateCustomer && updateCustomer(customer.id, customer)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-destructive hover:text-destructive"
                         onClick={() => deleteCustomer && deleteCustomer(customer.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
