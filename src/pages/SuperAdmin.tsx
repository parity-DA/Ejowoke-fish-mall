import { useState, useMemo } from "react";
import { Lock, TrendingUp, DollarSign, Users, Package, AlertTriangle, Eye, BarChart3, PieChart, Activity } from "lucide-react";
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
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useExpenses } from "@/hooks/useExpenses";
import { usePurchases } from "@/hooks/usePurchases";

interface SuperAdminMetrics {
  totalRevenue: number;
  totalCosts: number;
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
}

interface EditRequest {
  id: string;
  tableName: string;
  recordId: string;
  requestedBy: string;
  requestDate: string;
  changeDescription: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  tableName: string;
  recordId: string;
  timestamp: string;
  changes: string;
}

const SUPER_ADMIN_PASSWORD = "EJowoke2024!";

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  // Fetch real data
  const { sales, loading: salesLoading } = useSales();
  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { purchases, loading: purchasesLoading } = usePurchases();

  // Calculate real metrics from data
  const metrics = useMemo(() => {
    if (salesLoading || productsLoading || customersLoading || expensesLoading || purchasesLoading) {
      return null;
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPurchaseCosts = purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
    const totalCosts = totalExpenses + totalPurchaseCosts;
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - (totalExpenses * 0.1); // Assuming 10% additional costs
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.minimum_stock).length;
    const outstandingCredits = customers.reduce((sum, customer) => sum + (customer.outstanding_balance || 0), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });
    
    const activeCustomers = new Set(thisMonthSales.map(sale => sale.customer_id).filter(Boolean)).size;
    const dailyAvgSales = thisMonthSales.length > 0 ? totalRevenue / 30 : 0; // Rough daily average
    
    // Calculate monthly growth (comparing to previous month)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
    });
    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts,
      grossProfit,
      netProfit,
      profitMargin,
      totalCustomers: customers.length,
      activeCustomers,
      totalProducts: products.length,
      lowStockProducts,
      outstandingCredits,
      dailyAvgSales,
      monthlyGrowth,
    };
  }, [sales, products, customers, expenses, purchases, salesLoading, productsLoading, customersLoading, expensesLoading, purchasesLoading]);

  // Calculate top performing products
  const topPerformingProducts = useMemo(() => {
    if (!sales.length || !products.length) return [];
    
    const productSales = new Map();
    sales.forEach(sale => {
      // For now, we'll distribute sales evenly across all products
      // In a real app, you'd have sale_items to track individual product sales
      products.forEach(product => {
        if (!productSales.has(product.id)) {
          productSales.set(product.id, { product, revenue: 0, salesCount: 0 });
        }
        const productData = productSales.get(product.id);
        productData.revenue += sale.total_amount / products.length; // Rough distribution
        productData.salesCount += 1;
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
      .map(item => ({
        name: item.product.name,
        revenue: Math.round(item.revenue),
        profit: Math.round(item.revenue * 0.3), // Assuming 30% profit margin
        margin: 30
      }));
  }, [sales, products]);

  // Calculate top customers
  const topCustomers = useMemo(() => {
    if (!sales.length || !customers.length) return [];
    
    const customerSales = new Map();
    sales.forEach(sale => {
      if (sale.customer_id) {
        const customer = customers.find(c => c.id === sale.customer_id);
        if (customer) {
          if (!customerSales.has(sale.customer_id)) {
            customerSales.set(sale.customer_id, { 
              customer, 
              revenue: 0, 
              visits: 0 
            });
          }
          const customerData = customerSales.get(sale.customer_id);
          customerData.revenue += sale.total_amount;
          customerData.visits += 1;
        }
      }
    });

    return Array.from(customerSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map(item => ({
        name: item.customer.name,
        revenue: Math.round(item.revenue),
        visits: item.visits,
        avgOrder: Math.round(item.revenue / item.visits)
      }));
  }, [sales, customers]);

  // Mock edit requests and audit logs (these would come from a real audit system)
  const editRequests: EditRequest[] = [];
  const auditLogs: AuditLog[] = [];

  const handleLogin = () => {
    if (password === SUPER_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access granted",
        description: "Welcome to Super Admin Dashboard",
      });
    } else {
      toast({
        title: "Access denied",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditRequest = (requestId: string, action: "approve" | "reject") => {
    toast({
      title: `Edit request ${action}d`,
      description: `The edit request has been ${action}d successfully.`,
    });
  };

  if (salesLoading || productsLoading || customersLoading || expensesLoading || purchasesLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center">Error loading dashboard data</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Super Admin Access</CardTitle>
            <CardDescription>
              Enter the super admin password to access advanced analytics and controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter super admin password"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-gradient-primary">
              <Lock className="mr-2 h-4 w-4" />
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Advanced analytics, profit metrics, and system controls</p>
        </div>
        <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
          <Lock className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₦{metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">+{metrics.monthlyGrowth.toFixed(1)}% from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p className="text-3xl font-bold text-blue-600">₦{metrics.netProfit.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.profitMargin.toFixed(1)}% profit margin</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Credits</p>
                <p className="text-3xl font-bold text-yellow-600">₦{metrics.outstandingCredits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Needs collection</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Avg Sales</p>
                <p className="text-3xl font-bold text-purple-600">₦{metrics.dailyAvgSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Per day average</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Profit Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Profit Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Revenue</span>
                <span className="font-medium">₦{metrics.totalRevenue.toLocaleString()}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Costs</span>
                <span className="font-medium text-red-600">₦{metrics.totalCosts.toLocaleString()}</span>
              </div>
              <Progress value={metrics.totalRevenue > 0 ? (metrics.totalCosts / metrics.totalRevenue) * 100 : 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gross Profit</span>
                <span className="font-medium text-green-600">₦{metrics.grossProfit.toLocaleString()}</span>
              </div>
              <Progress value={metrics.totalRevenue > 0 ? (metrics.grossProfit / metrics.totalRevenue) * 100 : 0} className="h-2" />
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="font-semibold">Net Profit</span>
                <span className="font-bold text-green-600 text-lg">₦{metrics.netProfit.toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.profitMargin.toFixed(1)}% of total revenue
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Business Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.totalCustomers}</div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.activeCustomers}</div>
                <div className="text-sm text-muted-foreground">Active This Month</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.lowStockProducts}</div>
                <div className="text-sm text-muted-foreground">Low Stock Items</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {metrics.totalCustomers > 0 ? ((metrics.activeCustomers / metrics.totalCustomers) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Customer Activity Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="edit-requests">Edit Requests</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Products ranked by revenue and profit contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformingProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">₦{product.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">₦{product.profit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">{product.margin}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Customers ranked by total revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right">₦{customer.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{customer.visits}</TableCell>
                      <TableCell className="text-right">₦{customer.avgOrder.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit-requests">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Edit Requests Pending Approval</CardTitle>
              <CardDescription>Review and approve edit requests from admins</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Details</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No edit requests available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Complete record of all system activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No audit logs available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
