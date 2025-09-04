import { useState, useMemo, useEffect } from "react";
import { Lock, TrendingUp, DollarSign, Users, Package, AlertTriangle, Eye, BarChart3, PieChart, Activity, Shield, Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";
import { useExpenses } from "@/hooks/useExpenses";
import { useStock } from "@/hooks/useStock";
import { supabase } from "@/integrations/supabase/client";

interface SuperAdminMetrics {
  totalRevenue: number;
  totalExpenses: number;
  dailyExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  outstandingCredits: number;
  dailyAvgSales: number;
  monthlyGrowth: number;
  totalKgSold: number;
}

export default function SuperAdmin() {
  const { inventory } = useInventory();
  const { sales } = useSales();
  const { customers } = useCustomers();
  const { stockUpdates } = useStock();
  const { expenses } = useExpenses();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch sale items for profit calculations
  useEffect(() => {
    const fetchSaleItems = async () => {
      const { data } = await supabase
        .from('sale_items')
        .select(`
          *,
          inventory(cost_price, selling_price)
        `);
      setSaleItems(data || []);
    };
    fetchSaleItems();
  }, []);

  // Calculate comprehensive metrics - MUST be called before any early returns
  const metrics: SuperAdminMetrics = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Filter data by selected date
    const filteredSales = sales.filter(sale => 
      sale.created_at.startsWith(selectedDateStr)
    );
    const filteredExpenses = expenses.filter(expense => 
      expense.created_at.startsWith(selectedDateStr)
    );
    const filteredSaleItems = saleItems.filter(item => {
      const saleForItem = sales.find(sale => sale.id === item.sale_id);
      return saleForItem && saleForItem.created_at.startsWith(selectedDateStr);
    });

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const dailyExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate gross profit based on (selling price - cost price) * kg sold for selected date
    const grossProfit = filteredSaleItems.reduce((profit, item) => {
      const costPrice = item.inventory?.cost_price || 0;
      const sellingPrice = item.inventory?.selling_price || 0;
      const profitPerKg = sellingPrice - costPrice;
      return profit + (profitPerKg * item.quantity);
    }, 0);
    
    // Net profit after expenses for selected date
    const netProfit = grossProfit - dailyExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Calculate total kg sold for selected date
    const totalKgSold = filteredSaleItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const activeCustomers = customers.filter(customer => 
      customer.last_purchase_date && 
      new Date(customer.last_purchase_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const lowStockProducts = inventory.filter(product => 
      product.stock_quantity <= product.minimum_stock_kg
    ).length;

    const outstandingCredits = customers.reduce((sum, customer) => 
      sum + (customer.outstanding_balance || 0), 0
    );

    const dailyAvgSales = sales.length > 0 ? totalRevenue / Math.max(1, 
      (new Date().getTime() - new Date(sales[sales.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
    ) : 0;

    return {
      totalRevenue,
      totalExpenses,
      dailyExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      totalCustomers: customers.length,
      activeCustomers,
      totalProducts: inventory.length,
      lowStockProducts,
      outstandingCredits,
      dailyAvgSales,
      monthlyGrowth: 12.5, // Mock data
      totalKgSold
    };
  }, [sales, customers, inventory, expenses, stockUpdates, saleItems, selectedDate]);

  const handlePasswordSubmit = () => {
    // In production, this should be more secure
    const correctPassword = "admin2024"; // This should be stored securely
    if (password === correctPassword) {
      setIsAuthenticated(true);
      toast({
        title: "Access granted",
        description: "Welcome to Super Admin Dashboard",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const generateCSVReport = () => {
    const csvData = [
      ['Super Admin Dashboard Report'],
      ['Date:', selectedDate.toLocaleDateString()],
      [''],
      ['FINANCIAL METRICS'],
      ['Total Revenue', `₦${metrics.totalRevenue.toLocaleString()}`],
      ['Gross Profit', `₦${metrics.grossProfit.toLocaleString()}`],
      ['Daily Expenses', `₦${metrics.dailyExpenses.toLocaleString()}`],
      ['Net Profit', `₦${metrics.netProfit.toLocaleString()}`],
      ['Profit Margin', `${metrics.profitMargin.toFixed(1)}%`],
      ['Total KG Sold', metrics.totalKgSold.toFixed(1)],
      [''],
      ['BUSINESS METRICS'],
      ['Total Customers', metrics.totalCustomers],
      ['Active Customers', metrics.activeCustomers],
      ['Total Products', metrics.totalProducts],
      ['Low Stock Products', metrics.lowStockProducts],
      ['Outstanding Credits', `₦${metrics.outstandingCredits.toLocaleString()}`],
      [''],
      ['INVENTORY SUMMARY'],
      ['Product Name', 'Stock (kg)', 'Min Stock', 'Pieces', 'Status'],
      ...inventory.slice(0, 20).map(product => [
        product.name,
        `${product.stock_quantity}kg`,
        `${product.minimum_stock_kg}kg`,
        product.total_pieces || 0,
        product.stock_quantity > product.minimum_stock_kg ? 'In Stock' : 'Low Stock'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `super-admin-report-${selectedDate.toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Report Generated",
      description: "CSV report has been downloaded successfully",
    });
  };

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Super Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter admin password"
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              <Lock className="mr-2 h-4 w-4" />
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="h-8 w-8 text-destructive" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive business oversight and management</p>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Admin Access
        </Badge>
      </div>

      {/* Date Navigation and Export Controls */}
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous Day
          </Button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-md border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            disabled={selectedDate.toDateString() === new Date().toDateString()}
          >
            Next Day
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={generateCSVReport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV Report
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.grossProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.totalKgSold.toFixed(1)}kg sold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Of {metrics.totalCustomers} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory: {inventory.length}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.lowStockProducts} low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Profit Breakdown</CardTitle>
                <CardDescription>Today's financial summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gross Profit</span>
                  <span className="text-sm font-bold text-green-600">₦{metrics.grossProfit.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Daily Expenses</span>
                  <span className="text-sm font-bold text-red-600">-₦{metrics.dailyExpenses.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Net Profit</span>
                    <span className="text-sm font-bold text-blue-600">₦{(metrics.grossProfit - metrics.dailyExpenses).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Profit formula: (Selling - Cost) × KG Sold - Expenses
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Performance</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue Growth</span>
                  <span className="text-sm text-muted-foreground">+{metrics.monthlyGrowth}%</span>
                </div>
                <Progress value={metrics.monthlyGrowth} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Profit Margin</span>
                  <span className="text-sm text-muted-foreground">{metrics.profitMargin.toFixed(1)}%</span>
                </div>
                <Progress value={Math.max(0, metrics.profitMargin)} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Customer Retention</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Updates: {stockUpdates.length}</CardTitle>
                <CardDescription>Total stock update records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recent Updates</span>
                    <Badge variant="outline">{stockUpdates.slice(0, 5).length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {stockUpdates.slice(0, 3).map((update) => (
                      <div key={update.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{update.inventory?.name}</span>
                        <span className="text-muted-foreground">+{update.quantity_added_kg}kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Detailed sales analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 10).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>Customer #{sale.customer_id?.slice(-4) || 'N/A'}</TableCell>
                      <TableCell>₦{sale.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{sale.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Stock levels and product performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Stock (kg)</TableHead>
                    <TableHead>Pieces</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.slice(0, 10).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.size || '-'}</TableCell>
                      <TableCell>{product.stock_quantity}kg</TableCell>
                      <TableCell>{product.total_pieces}</TableCell>
                      <TableCell>{product.minimum_stock_kg}kg</TableCell>
                      <TableCell>
                        <Badge variant={product.stock_quantity > product.minimum_stock_kg ? 'default' : 'destructive'}>
                          {product.stock_quantity > product.minimum_stock_kg ? 'In Stock' : 'Low Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analysis</CardTitle>
              <CardDescription>Customer behavior and purchase patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.slice(0, 10).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>₦{(customer.total_purchases || 0).toLocaleString()}</TableCell>
                      <TableCell>₦{(customer.outstanding_balance || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {customer.last_purchase_date 
                          ? new Date(customer.last_purchase_date).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.outstanding_balance && customer.outstanding_balance > 0 ? 'secondary' : 'default'}>
                          {customer.outstanding_balance && customer.outstanding_balance > 0 ? 'Credit' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{metrics.totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Today: ₦{metrics.dailyExpenses.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{metrics.netProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  After all expenses
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
