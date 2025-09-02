import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalCustomers: number;
  totalInventoryItems: number;
  lowStockItems: number;
  pendingSales: number;
  recentSales: Array<{
    id: string;
    customer_name: string;
    amount: number;
    time: string;
    status: string;
  }>;
  topItems: Array<{
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
    totalInventoryItems: 0,
    lowStockItems: 0,
    pendingSales: 0,
    recentSales: [],
    topItems: [],
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
        inventoryResult,
        recentSalesResult,
        topItemsResult,
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

        // Inventory items and low stock
        supabase
          .from('inventory')
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

        // Top items (simplified - in real app you'd aggregate sale_items)
        supabase
          .from('inventory')
          .select('id, name')
          .eq('user_id', user.id)
          .limit(4),

        // Low stock items - we'll filter this in JavaScript since Supabase doesn't support column-to-column comparison directly
        supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (salesResult.error) throw salesResult.error;
      if (todaySalesResult.error) throw todaySalesResult.error;
      if (customersResult.error) throw customersResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      if (recentSalesResult.error) throw recentSalesResult.error;
      if (topItemsResult.error) throw topItemsResult.error;
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

      const topItems = topItemsResult.data?.map((item, index) => ({
        name: item.name,
        total_sold: Math.floor(Math.random() * 100) + 50, // Mock data for now
        revenue: Math.floor(Math.random() * 500000) + 100000 // Mock data for now
      })) || [];

      const lowStockAlerts = lowStockResult.data?.filter(item =>
        item.stock_quantity <= item.minimum_stock
      ).map(item => ({
        id: item.id,
        name: item.name,
        current_stock: item.stock_quantity,
        minimum_stock: item.minimum_stock
      })) || [];

      setStats({
        todaySales: todaySalesAmount,
        totalSales: totalSalesAmount,
        totalCustomers: customersResult.count || 0,
        totalInventoryItems: inventoryResult.data?.length || 0,
        lowStockItems: lowStockAlerts.length,
        pendingSales: 0, // Would need separate query
        recentSales,
        topItems,
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
