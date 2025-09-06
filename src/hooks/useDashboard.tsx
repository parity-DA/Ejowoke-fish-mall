import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// The interface remains the same, as the RPC function is designed to return data in a compatible format.
export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalPiecesRemaining: number;
  lowStockProducts: number;
  pendingSales: number; // This can be enhanced in the RPC function later
  stockSoldToday: number; // This can be enhanced in the RPC function later
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
      
      // Format the date to 'YYYY-MM-DD' string for the RPC function
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${year}-${month}-${day}`;
      
      console.log('Fetching dashboard stats via RPC for date:', targetDateStr);

      // Call the new RPC function with the target date
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        target_date: targetDateStr,
      });

      if (error) {
        throw error;
      }

      // The RPC function returns a single JSONB object with all the stats.
      // We can now directly set the state, providing default values for any stats not yet implemented in the RPC.
      const fetchedStats = data;
      setStats({
        todaySales: fetchedStats.todaySales || 0,
        totalSales: fetchedStats.totalSales || 0,
        totalCustomers: fetchedStats.totalCustomers || 0,
        totalPiecesRemaining: fetchedStats.totalPiecesRemaining || 0,
        recentSales: fetchedStats.recentSales || [],
        lowStockAlerts: fetchedStats.lowStockAlerts || [],
        lowStockProducts: (fetchedStats.lowStockAlerts || []).length,
        // The following fields are not yet implemented in the RPC function, so we provide defaults.
        // They can be added to the `get_dashboard_stats` function later.
        totalProducts: 0, // Placeholder
        pendingSales: 0, // Placeholder
        stockSoldToday: 0, // Placeholder
        stockRemainingToday: fetchedStats.totalPiecesRemaining || 0, // Use total for now
        topProducts: [], // Placeholder
        dailyStockHistory: [], // Placeholder
      });

    } catch (error: any) {
      toast({
        title: 'Error Fetching Dashboard Data',
        description: `An error occurred: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user, selectedDate]);

  // Real-time subscription remains useful. It will now trigger the efficient RPC call.
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
        },
        () => {
          console.log('Sales changed, refetching dashboard stats.');
          fetchDashboardStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
        },
        () => {
          console.log('Inventory changed, refetching dashboard stats.');
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDashboardStats]); // Added fetchDashboardStats to dependency array

  return {
    stats,
    loading,
    refetch: fetchDashboardStats,
  };
};
