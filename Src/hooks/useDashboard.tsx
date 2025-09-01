import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingSales: number;
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
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    current_stock: number;
    minimum_stock: number;
  }>;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingSales: 0,
    recentSales: [],
    topProducts: [],
    lowStockAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching dashboard stats for user:', user.id);

      // Fetch various statistics in parallel
      const [
        salesResult,
        todaySalesResult,
        customersResult,
        productsResult,
        recentSalesResult,
        topProductsResult,
        lowStockResult
      ] = await Promise.all([
        // Total sales amount
        supabase
          .from('sales')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // Today's sales
        supabase
          .from('sales')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
        // Total customers
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
        
        // Products and low stock
        supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id),
        
        // Recent sales
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
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Top products (simplified - in real app you'd aggregate sale_items)
        supabase
          .from('products')
          .select('id, name')
          .eq('user_id', user.id)
          .limit(4),
        
        // Low stock products - we'll filter this in JavaScript since Supabase doesn't support column-to-column comparison directly
        supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (salesResult.error) throw salesResult.error;
      if (todaySalesResult.error) throw todaySalesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (productsResult.error) throw productsResult.error;
      if (recentSalesResult.error) throw recentSalesResult.error;
      if (topProductsResult.error) throw topProductsResult.error;
      if (lowStockResult.error) throw lowStockResult.error;

      const totalSalesAmount = salesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const todaySalesAmount = todaySalesResult.data?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

      const recentSales = recentSalesResult.data?.map(sale => ({
        id: sale.id,
        customer_name: sale.customers?.name || 'Walk-in Customer',
        amount: sale.total_amount,
        time: new Date(sale.created_at).toLocaleString(),
        status: sale.status
      })) || [];

      const topProducts = topProductsResult.data?.map((product, index) => ({
        name: product.name,
        total_sold: Math.floor(Math.random() * 100) + 50, // Mock data for now
        revenue: Math.floor(Math.random() * 500000) + 100000 // Mock data for now
      })) || [];

      const lowStockAlerts = lowStockResult.data?.filter(product => 
        product.stock_quantity <= product.minimum_stock
      ).map(product => ({
        id: product.id,
        name: product.name,
        current_stock: product.stock_quantity,
        minimum_stock: product.minimum_stock
      })) || [];

      setStats({
        todaySales: todaySalesAmount,
        totalSales: totalSalesAmount,
        totalCustomers: customersResult.count || 0,
        totalProducts: productsResult.data?.length || 0,
        lowStockProducts: lowStockAlerts.length,
        pendingSales: 0, // Would need separate query
        recentSales,
        topProducts,
        lowStockAlerts,
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
  }, [user]);

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
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDashboardStats(); // Refresh stats when products change
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
