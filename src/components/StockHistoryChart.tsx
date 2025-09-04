import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";

interface StockHistoryChartProps {
  data: Array<{
    date: string;
    stock_sold: number;
    stock_remaining: number;
    revenue: number;
  }>;
}

export function StockHistoryChart({ data }: StockHistoryChartProps) {
  const chartConfig = {
    stock_sold: {
      label: "Stock Sold (kg)",
      color: "hsl(var(--primary))",
    },
    stock_remaining: {
      label: "Stock Remaining (kg)",
      color: "hsl(var(--muted-foreground))",
    },
    revenue: {
      label: "Revenue (₦)",
      color: "hsl(var(--success))",
    },
  };

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
          <CardDescription>7-day stock movement overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No historical data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Stock History</CardTitle>
        <CardDescription>7-day stock movement and sales performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stock Movement Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Daily Stock Movement (kg)</h4>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="stock_sold"
                    fill="var(--color-stock_sold)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Revenue Trend */}
          <div>
            <h4 className="text-sm font-medium mb-3">Revenue Trend (₦)</h4>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis 
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
                    className="text-xs"
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₦${Number(value).toLocaleString()}` : value,
                        chartConfig[name as keyof typeof chartConfig]?.label
                      ]}
                    />} 
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
