import { useState } from "react";
import { Plus, Receipt, Calendar as CalendarIcon, TrendingDown, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useExpenses, Expense } from "@/hooks/useExpenses";
import { useUserRoles } from "@/hooks/useUserRoles";


const expenseCategories = [
  { value: "ice", label: "Ice & Preservation", icon: "❄️" },
  { value: "logistics", label: "Logistics & Transport", icon: "🚚" },
  { value: "power", label: "Power & Utilities", icon: "⚡" },
  { value: "packaging", label: "Packaging Materials", icon: "📦" },
  { value: "staff", label: "Staff & Labor", icon: "👥" },
  { value: "misc", label: "Miscellaneous", icon: "📝" },
];

export default function Expenses() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { isSuperAdmin } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    category: "misc",
    amount: 0,
    payment_method: "cash",
    expense_date: new Date(),
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || expense.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.title) {
      toast({
        title: "Missing information",
        description: "Please fill in amount and title.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await addExpense(newExpense);
    
    if (!error) {
      setNewExpense({
        title: "",
        description: "",
        category: "misc",
        amount: 0,
        payment_method: "cash",
        expense_date: new Date(),
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleOpenEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    if (!editingExpense.amount || !editingExpense.title) {
      toast({
        title: "Missing information",
        description: "Please fill in amount and title.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await updateExpense(editingExpense.id, {
      title: editingExpense.title,
      description: editingExpense.description,
      category: editingExpense.category,
      amount: editingExpense.amount,
      payment_method: editingExpense.payment_method,
    });

    if (!error) {
      setIsEditDialogOpen(false);
      setEditingExpense(null);
    }
  };

  const totalExpensesToday = expenses
    .filter(e => new Date(e.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpensesMonth = expenses
    .filter(e => new Date(e.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = expenseCategories.map(category => ({
    ...category,
    total: expenses
      .filter(e => e.category === category.value)
      .reduce((sum, e) => sum + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses and operational costs</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a business expense to track operational costs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  placeholder="Expense title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount || ""}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-method">Payment Method *</Label>
                  <Select 
                    value={newExpense.payment_method} 
                    onValueChange={(value) => setNewExpense({ ...newExpense, payment_method: value })}
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
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense_date">Date of Expense</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newExpense.expense_date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newExpense.expense_date}
                      onSelect={(date) => setNewExpense({ ...newExpense, expense_date: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Describe the expense..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense} className="bg-gradient-primary">
                  Add Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Expense Dialog */}
      {editingExpense && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Update the details of your expense.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingExpense.title}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, title: e.target.value })
                  }
                  placeholder="Expense title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount (₦) *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editingExpense.amount || ""}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        amount: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-payment-method">Payment Method *</Label>
                  <Select
                    value={editingExpense.payment_method}
                    onValueChange={(value) =>
                      setEditingExpense({ ...editingExpense, payment_method: value })
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
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editingExpense.category || ''}
                  onValueChange={(value) =>
                    setEditingExpense({ ...editingExpense, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingExpense.description || ''}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the expense..."
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
                <Button onClick={handleUpdateExpense} className="bg-gradient-primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">₦{totalExpensesToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today's Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₦{totalExpensesMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-accent rounded-full flex items-center justify-center">
                <Receipt className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expenses.length}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">₦{Math.round(totalExpensesMonth / 30).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Daily Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Month-to-date spending breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {expensesByCategory.map((category) => (
              <div key={category.value} className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl mb-2">{category.icon}</div>
                <p className="text-sm font-medium">{category.label}</p>
                <p className="text-lg font-bold text-destructive">₦{category.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.icon} {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>All recorded business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const category = expenseCategories.find(c => c.value === expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category?.icon} {category?.label || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{expense.title}</div>
                      {expense.description && (
                        <div className="text-sm text-muted-foreground">{expense.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      ₦{expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {expense.payment_method}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSuperAdmin && (
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteExpense && deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
