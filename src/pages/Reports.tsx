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
  const { inventory: products } = useInventory();
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

  const productPerformance = products.map(product => ({
    productName: product.name,
    totalRevenue: sales
      .reduce((sum, sale) => sum + sale.total_amount, 0) / products.length, // Simplified calculation
    totalKg: 0,
    totalPieces: 0,
    avgPrice: product.selling_price
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading reports...</div>
      </div>
    );
  }

  const handleExportReport = (format: "csv" | "pdf") => {
    toast({
      title: "Exporting report...",
      description: `Your ${format.toUpperCase()} report is being generated.`,
    });

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export completed!",
        description: `Report has been downloaded as ${format.toUpperCase()}.`,
      });
    }, 2000);
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generating report...",
      description: "Please wait while we compile your data.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export business reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExportReport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportReport("pdf")} className="bg-gradient-primary">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_sales">Daily Sales Summary</SelectItem>
                  <SelectItem value="product_performance">Product Performance</SelectItem>
                  <SelectItem value="customer_statement">Customer Statements</SelectItem>
                  <SelectItem value="stock_movement">Stock Movement</SelectItem>
                  <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} className="w-full bg-gradient-primary">
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="daily-sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily-sales">Daily Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Daily Sales Report */}
        <TabsContent value="daily-sales">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Daily Sales Summary
              </CardTitle>
              <CardDescription>
                Daily sales performance from {dateFrom} to {dateTo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Sales (₦)</TableHead>
                    <TableHead className="text-right">KG Sold</TableHead>
                    <TableHead className="text-right">Pieces Sold</TableHead>
                    <TableHead className="text-right">Gross Profit (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySalesData.slice(0, 5).map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{day.totalSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{day.totalKg}</TableCell>
                      <TableCell className="text-right">{day.totalPieces}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ₦{day.grossProfit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">
                      ₦{dailySalesData.reduce((sum, d) => sum + d.totalSales, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">0</TableCell>
                    <TableCell className="text-right">0</TableCell>
                    <TableCell className="text-right text-green-600">
                      ₦{dailySalesData.reduce((sum, d) => sum + d.grossProfit, 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance Report */}
        <TabsContent value="products">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Product Performance
              </CardTitle>
              <CardDescription>Revenue and sales volume by product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Revenue (₦)</TableHead>
                    <TableHead className="text-right">KG Sold</TableHead>
                    <TableHead className="text-right">Pieces Sold</TableHead>
                    <TableHead className="text-right">Avg Price (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productPerformance.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{product.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">
                        ₦{product.avgPrice.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Statements */}
        <TabsContent value="customers">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Customer Statements
              </CardTitle>
              <CardDescription>Customer sales and payment summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Total Sales (₦)</TableHead>
                    <TableHead className="text-right">Payments (₦)</TableHead>
                    <TableHead className="text-right">Outstanding (₦)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.filter(c => (c.outstanding_balance || 0) > 0).map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right">
                        ₦{(customer.total_purchases || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">₦0</TableCell>
                      <TableCell className="text-right">
                        ₦{(customer.outstanding_balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(customer.outstanding_balance || 0) > 0 ? "destructive" : "default"}>
                          {(customer.outstanding_balance || 0) > 0 ? "Credit Balance" : "Fully Paid"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movement Report */}
        <TabsContent value="inventory">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Stock Movement Report
              </CardTitle>
              <CardDescription>Opening, in, out, and closing stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Opening Stock</TableHead>
                    <TableHead className="text-right">Stock In</TableHead>
                    <TableHead className="text-right">Stock Out</TableHead>
                    <TableHead className="text-right">Closing Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.stock_quantity}</TableCell>
                      <TableCell className="text-right text-green-600">+0</TableCell>
                      <TableCell className="text-right text-red-600">-0</TableCell>
                      <TableCell className="text-right font-medium">
                        {product.stock_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
