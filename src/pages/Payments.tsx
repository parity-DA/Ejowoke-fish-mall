import { useState } from "react";
import { Plus, CreditCard, Receipt, Search, DollarSign, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { usePayments, Payment } from "@/hooks/usePayment";
import { useCustomers } from "@/hooks/useCustomers";


export default function Payments() {
  const { payments, loading, addPayment, updatePayment, deletePayment } = usePayments();
  const { customers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  
  const [newPayment, setNewPayment] = useState({
    type: "income",
    amount: 0,
    payment_method: "cash",
    reference_id: "",
    description: "",
    category: "",
  });


  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || payment.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleAddPayment = async () => {
    if (!newPayment.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in the amount.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await addPayment(newPayment);
    
    if (!error) {
      setNewPayment({
        type: "income",
        amount: 0,
        payment_method: "cash",
        reference_id: "",
        description: "",
        category: "",
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    if (!editingPayment.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in the amount.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await updatePayment(editingPayment.id, {
      type: editingPayment.type,
      amount: editingPayment.amount,
      payment_method: editingPayment.payment_method,
      reference_id: editingPayment.reference_id,
      description: editingPayment.description,
      category: editingPayment.category,
    });

    if (!error) {
      setIsEditDialogOpen(false);
      setEditingPayment(null);
    }
  };

  const totalPaymentsToday = payments
    .filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstandingCredits = customers
    .reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);

  const overdueCredits = customers.filter(c => (c.outstanding_balance || 0) > 0).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments & Credits</h1>
          <p className="text-muted-foreground">Manage payments and customer credits</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a new payment or credit repayment from a customer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-type">Payment Type *</Label>
                <Select 
                  value={newPayment.type} 
                  onValueChange={(value) => setNewPayment({ ...newPayment, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newPayment.amount || ""}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method *</Label>
                  <Select 
                    value={newPayment.payment_method} 
                    onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Reference (Optional)</Label>
                <Input
                  id="reference"
                  value={newPayment.reference_id}
                  onChange={(e) => setNewPayment({ ...newPayment, reference_id: e.target.value })}
                  placeholder="e.g., TRF-240831-001"
                />
              </div>

              <div>
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={newPayment.category}
                  onChange={(e) => setNewPayment({ ...newPayment, category: e.target.value })}
                  placeholder="e.g., Sales, Purchases, etc."
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment} className="bg-gradient-primary">
                  Record Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Payment Dialog */}
      {editingPayment && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
              <DialogDescription>
                Update the details of this payment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-payment-type">Payment Type *</Label>
                <Select
                  value={editingPayment.type}
                  onValueChange={(value) =>
                    setEditingPayment({ ...editingPayment, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount (₦) *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editingPayment.amount || ""}
                    onChange={(e) =>
                      setEditingPayment({
                        ...editingPayment,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-method">Payment Method *</Label>
                  <Select
                    value={editingPayment.payment_method}
                    onValueChange={(value) =>
                      setEditingPayment({ ...editingPayment, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Bank Transfer</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-reference">Reference (Optional)</Label>
                <Input
                  id="edit-reference"
                  value={editingPayment.reference_id || ""}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, reference_id: e.target.value })
                  }
                  placeholder="e.g., TRF-240831-001"
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Category (Optional)</Label>
                <Input
                  id="edit-category"
                  value={editingPayment.category || ""}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, category: e.target.value })
                  }
                  placeholder="e.g., Sales, Purchases, etc."
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editingPayment.description || ""}
                  onChange={(e) =>
                    setEditingPayment({
                      ...editingPayment,
                      description: e.target.value,
                    })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdatePayment} className="bg-gradient-primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₦{totalPaymentsToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today's Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-warning rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">₦{totalOutstandingCredits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-destructive rounded-full flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCredits}</p>
                <p className="text-xs text-muted-foreground">Overdue Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Outstanding Credits */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Outstanding Credits</CardTitle>
          <CardDescription>Customer credit balances</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.filter(c => (c.outstanding_balance || 0) > 0).map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium min-w-[150px]">{customer.name}</TableCell>
                  <TableCell className="text-right">₦{(customer.outstanding_balance || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Open</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {customers.filter(c => (c.outstanding_balance || 0) > 0).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No outstanding credits
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All recorded payments and repayments</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Date</TableHead>
                 <TableHead>Type</TableHead>
                 <TableHead className="text-right">Amount</TableHead>
                 <TableHead>Method</TableHead>
                 <TableHead>Reference</TableHead>
                 <TableHead>Notes</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment.type === "income" ? "default" : "destructive"}>
                      {payment.type === "income" ? "Income" : "Expense"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    ₦{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {payment.payment_method === "cash" ? "Cash" : payment.payment_method === "transfer" ? "Transfer" : "POS"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm min-w-[150px]">{payment.reference_id || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground min-w-[200px]">
                    {payment.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deletePayment && deletePayment(payment.id)}
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
