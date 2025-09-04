import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalPiecesRemaining: number;
  lowStockProducts: number;
  pendingSales: number;
  stockSoldToday: number;
  stockRemainingToday: number;
  recentSales: Array<{
    id: string;
    customer_name: string;
    amount: number;
    time: string;
    status: string;
  }>;
  topProducts: Array<{
    name: string;
    total_sold: number;
    revenue: number;
    stock_sold: number;
    stock_remaining: number;
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    current_stock: number;
    minimum_stock: number;
  }>;
  dailyStockHistory: Array<{
    date: string;
    stock_sold: number;
    stock_remaining: number;
    revenue: number;
  }>;
}

export const useDashboard = (selectedDate?: Date) => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalPiecesRemaining: 0,
    lowStockProducts: 0,
    pendingSales: 0,
    stockSoldToday: 0,
    stockRemainingToday: 0,
    recentSales: [],
    topProducts: [],
    lowStockAlerts: [],
    dailyStockHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const targetDate = selectedDate || new Date();
      
      // Use local timezone formatting to avoid timezone conversion issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${year}-${month}-${day}`;
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextYear = nextDay.getFullYear();
      const nextMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nextDayNum = String(nextDay.getDate()).padStart(2, '0');
      const nextDayStr = `${nextYear}-${nextMonth}-${nextDayNum}`;
      
      console.log('Fetching dashboard stats for user:', user.id, 'date:', targetDateStr, 'to', nextDayStr);

      // Fetch various statistics in parallel
      const [
        salesResult,
        todaySalesResult,
        customersResult,
        inventoryResult,
        recentSalesResult,
        topProductsResult,
        lowStockResult,
        stockHistoryResult
      ] = await Promise.all([
        // Total sales amount
        supabase
          .from('sales')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // Target date's sales with items
        supabase
          .from('sales')
          .select(`
            total_amount,
            sale_items(quantity, product_id)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', targetDateStr + 'T00:00:00')
          .lt('created_at', nextDayStr + 'T00:00:00'),
        
        // Customers who made purchases on target date
        supabase
          .from('sales')
          .select('customer_id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', targetDateStr + 'T00:00:00')
          .lt('created_at', nextDayStr + 'T00:00:00')
          .not('customer_id', 'is', null),
        
        // Inventory and low stock
        supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id),
        
        // Recent sales for target date
        supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            created_at,
            status,
            customers(name)
          `)
          .eq('user_id', user.id)
          .gte('created_at', targetDateStr + 'T00:00:00')
          .lt('created_at', nextDayStr + 'T00:00:00')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Top products with actual sales data for target date
        supabase
          .from('sale_items')
          .select(`
            quantity,
            unit_price,
            total_price,
            product_id,
            inventory:product_id(name, stock_quantity),
            sales!inner(user_id, created_at)
          `)
          .eq('sales.user_id', user.id)
          .gte('sales.created_at', targetDateStr + 'T00:00:00')
          .lt('sales.created_at', nextDayStr + 'T00:00:00'),
        
        // Low stock products
        supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id),

        // Stock history for the last 7 days
        supabase
          .from('sales')
          .select(`
            created_at,
            total_amount,
            sale_items(quantity)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', (() => {
            const sevenDaysAgo = new Date(targetDate);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const year = sevenDaysAgo.getFullYear();
            const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0');
            const day = String(sevenDaysAgo.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}T00:00:00`;
          })())
          .lt('created_at', nextDayStr + 'T00:00:00')
      ]);

      if (salesResult.error) throw salesResult.error;
      if (todaySalesResult.error) throw todaySalesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      if (recentSalesResult.error) throw recentSalesResult.error;
      if (topProductsResult.error) throw topProductsResult.error;
      if (lowStockResult.error) throw lowStockResult.error;
      if (stockHistoryResult.error) throw stockHistoryResult.error;

      const totalSalesAmount = salesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const todaySalesAmount = todaySalesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      // Calculate stock sold for target date
      const stockSoldToday = todaySalesResult.data?.reduce((sum, sale) => {
        const saleItems = sale.sale_items || [];
        return sum + saleItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0) || 0;

      // Calculate current remaining stock and total pieces sold
      const stockRemainingToday = inventoryResult.data?.reduce((sum, item) => sum + item.stock_quantity, 0) || 0;
      
      // Count unique customers who made purchases on target date
      const uniqueCustomerIds = new Set(customersResult.data?.map(sale => sale.customer_id));
      const customersToday = uniqueCustomerIds.size;
      
      // Calculate total pieces sold from sale_items for the target date
      const piecesSoldResult = await supabase
        .from('sale_items')
        .select('pieces_sold, sales!inner(user_id, created_at)')
        .eq('sales.user_id', user.id)
        .gte('sales.created_at', targetDateStr + 'T00:00:00')
        .lt('sales.created_at', nextDayStr + 'T00:00:00');
      
      const totalPiecesSold = piecesSoldResult.data?.reduce((sum, item) => sum + (item.pieces_sold || 0), 0) || 0;

      const recentSales = recentSalesResult.data?.map(sale => ({
        id: sale.id,
        customer_name: sale.customers?.name || 'Walk-in Customer',
        amount: sale.total_amount,
        time: new Date(sale.created_at).toLocaleString(),
        status: sale.status
      })) || [];

      // Process top products with real data
      const productSalesMap = new Map();
      topProductsResult.data?.forEach(item => {
        const productId = item.product_id;
        if (!productSalesMap.has(productId)) {
          productSalesMap.set(productId, {
            name: item.inventory?.name || 'Unknown Product',
            total_sold: 0,
            revenue: 0,
            stock_sold: 0,
            stock_remaining: item.inventory?.stock_quantity || 0
          });
        }
        const product = productSalesMap.get(productId);
        product.total_sold += item.quantity;
        product.revenue += item.total_price;
        product.stock_sold += item.quantity;
      });

      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      const lowStockAlerts = lowStockResult.data?.filter(item => 
        item.stock_quantity <= item.minimum_stock
      ).map(item => ({
        id: item.id,
        name: item.name,
        current_stock: item.stock_quantity,
        minimum_stock: item.minimum_stock
      })) || [];

      // Process daily stock history
      const dailyHistory = new Map();
      stockHistoryResult.data?.forEach(sale => {
        const date = sale.created_at.split('T')[0];
        if (!dailyHistory.has(date)) {
          dailyHistory.set(date, {
            date,
            stock_sold: 0,
            revenue: 0
          });
        }
        const day = dailyHistory.get(date);
        day.stock_sold += sale.sale_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        day.revenue += sale.total_amount;
      });

      const dailyStockHistory = Array.from(dailyHistory.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(day => ({
          ...day,
          stock_remaining: stockRemainingToday // Simplified - in real app would calculate per day
        }));

      setStats({
        todaySales: todaySalesAmount,
        totalSales: totalSalesAmount,
        totalCustomers: customersToday,
        totalProducts: topProducts.length, // Products sold on this date
        totalPiecesRemaining: totalPiecesSold, // Pieces sold on this date
        lowStockProducts: lowStockAlerts.length,
        pendingSales: 0, // Would need separate query
        stockSoldToday,
        stockRemainingToday,
        recentSales,
        topProducts,
        lowStockAlerts,
        dailyStockHistory,
      });
    } catch (error: any) {
      toast({
        title: 'Error fetching dashboard data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user, selectedDate]);

  // Set up real-time subscription for live updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDashboardStats(); // Refresh stats when sales change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDashboardStats(); // Refresh stats when inventory changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchDashboardStats,
  };
};
