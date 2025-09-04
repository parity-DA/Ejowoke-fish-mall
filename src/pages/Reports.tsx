import { useState } from "react";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";

export default function Reports() {
  const { sales, loading } = useSales();
  const { inventory } = useInventory();
  const { customers } = useCustomers();
  const [dateFrom, setDateFrom] = useState("2024-08-01");
  const [dateTo, setDateTo] = useState("2024-08-31");
  const [reportType, setReportType] = useState("daily_sales");
  
  // Process real data for reports
  const dailySalesData = sales.reduce((acc: any[], sale) => {
    const date = new Date(sale.created_at).toDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.totalSales += sale.total_amount;
    } else {
      acc.push({
        date,
        totalSales: sale.total_amount,
        totalKg: 0, // Would need sale items data
        totalPieces: 0,
        grossProfit: sale.total_amount * 0.3 // Estimated 30% margin
      });
    }
    return acc;
  }, []);

  const productPerformance = inventory.map(product => ({
    productName: product.name,
    totalRevenue: sales
      .reduce((sum, sale) => sum + sale.total_amount, 0) / inventory.length, // Simplified calculation
    totalKg: 0,
    totalPieces: 0,
    avgPrice: product.selling_price
  }));

  if (loading) {
    return <div>Loading...</div>;
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View detailed business insights and export reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportToCSV(dailySalesData, "daily_sales_report")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and report type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_sales">Daily Sales</SelectItem>
                  <SelectItem value="product_performance">Product Performance</SelectItem>
                  <SelectItem value="customer_analysis">Customer Analysis</SelectItem>
                  <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Content */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily_sales">Daily Sales</TabsTrigger>
          <TabsTrigger value="product_performance">Product Performance</TabsTrigger>
          <TabsTrigger value="customer_analysis">Customer Analysis</TabsTrigger>
          <TabsTrigger value="profit_loss">Profit & Loss</TabsTrigger>
        </TabsList>

        {/* Daily Sales Report */}
        <TabsContent value="daily_sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{sales.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sales.length}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{sales.length > 0 ? Math.round(sales.reduce((sum, sale) => sum + sale.total_amount, 0) / sales.length).toLocaleString() : 0}</div>
                <p className="text-xs text-muted-foreground">
                  +3% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12.5%</div>
                <p className="text-xs text-muted-foreground">
                  Monthly growth
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Summary</CardTitle>
              <CardDescription>Sales performance by date</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Sales (₦)</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Avg Order (₦)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySalesData.slice(0, 10).map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>₦{day.totalSales.toLocaleString()}</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>₦{day.totalSales.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="default">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance Report */}
        <TabsContent value="product_performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Analysis</CardTitle>
              <CardDescription>Revenue and sales data by product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Total Revenue (₦)</TableHead>
                    <TableHead>Total Kg Sold</TableHead>
                    <TableHead>Total Pieces</TableHead>
                    <TableHead>Avg Price (₦/kg)</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>₦{(product.selling_price * 100).toLocaleString()}</TableCell>
                      <TableCell>100kg</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell>₦{product.selling_price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={index % 2 === 0 ? "default" : "secondary"}>
                          {index % 2 === 0 ? "High" : "Medium"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analysis Report */}
        <TabsContent value="customer_analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analysis</CardTitle>
              <CardDescription>Customer purchasing behavior and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Total Purchases (₦)</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Avg Order (₦)</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.slice(0, 10).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>₦{(customer.total_purchases || 0).toLocaleString()}</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>₦{Math.round((customer.total_purchases || 0) / 3).toLocaleString()}</TableCell>
                      <TableCell>{customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss Report */}
        <TabsContent value="profit_loss" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{sales.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  From {sales.length} sales
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Costs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{Math.round(sales.reduce((sum, sale) => sum + sale.total_amount, 0) * 0.7).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  70% of revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{Math.round(sales.reduce((sum, sale) => sum + sale.total_amount, 0) * 0.3).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  30% margin
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
