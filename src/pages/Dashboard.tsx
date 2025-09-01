import { TrendingUp, DollarSign, CreditCard, Package, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {
  const { stats, loading } = useDashboard();

  const kpis = [
    {
      title: "Today's Sales",
      value: loading ? "..." : `₦${stats.todaySales.toLocaleString()}`,
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Total Sales",
      value: loading ? "..." : `₦${stats.totalSales.toLocaleString()}`,
      change: "+8.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Total Customers",
      value: loading ? "..." : stats.totalCustomers.toString(),
      change: "+5.1%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Total Products",
      value: loading ? "..." : stats.totalProducts.toString(),
      change: loading ? "..." : `${stats.lowStockProducts} low stock`,
      changeType: stats.lowStockProducts > 0 ? "warning" as const : "positive" as const,
      icon: Package,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Today</Button>
          <Button variant="outline">This Week</Button>
          <Button variant="outline">This Month</Button>
          <Button variant="default">Custom Range</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center space-x-1 text-xs">
                <Badge 
                  variant={kpi.changeType === "positive" ? "default" : kpi.changeType === "warning" ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {kpi.change}
                </Badge>
                <span className="text-muted-foreground">from yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Sales
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
            <CardDescription>Latest transactions in your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : stats.recentSales.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No recent sales</div>
              ) : (
                stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{sale.customer_name}</p>
                      <p className="text-sm text-muted-foreground">#{sale.id.slice(0, 8)} • {new Date(sale.time).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₦{sale.amount.toLocaleString()}</p>
                      <Badge 
                        variant={sale.status === "completed" ? "default" : sale.status === "pending" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : stats.topProducts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No product data yet</div>
              ) : (
                stats.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.total_sold} sold</p>
                      </div>
                    </div>
                    <p className="font-semibold text-success">₦{product.revenue.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {!loading && stats.lowStockAlerts.length > 0 && (
        <Card className="shadow-card border-warning">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span>Stock Alerts</span>
            </CardTitle>
            <CardDescription>Products running low on stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lowStockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">Only {alert.current_stock} remaining (min: {alert.minimum_stock})</p>
                  </div>
                  <Badge variant={alert.current_stock === 0 ? "destructive" : "secondary"}>
                    {alert.current_stock === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2 bg-gradient-primary hover:opacity-90">
              <Package className="h-6 w-6" />
              <span>New Sale</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Add Customer</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>Record Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <CreditCard className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
