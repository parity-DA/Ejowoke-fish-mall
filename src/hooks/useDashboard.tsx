import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { format } from 'date-fns';

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

const fetchDashboardStats = async (
  userId: string | undefined,
  selectedDate: Date,
  toast: (options: { title: string; description: string; variant: 'destructive' }) => void
): Promise<DashboardStats> => {
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    target_date: targetDateStr,
  });

  if (error) {
    toast({
      title: 'Error Fetching Dashboard Data',
      description: `An error occurred: ${error.message}`,
      variant: 'destructive',
    });
    throw error;
  }

  const fetchedStats = data;
  return {
    todaySales: fetchedStats.todaySales || 0,
    totalSales: fetchedStats.totalSales || 0,
    totalCustomers: fetchedStats.totalCustomers || 0,
    totalPiecesRemaining: fetchedStats.totalPiecesRemaining || 0,
    recentSales: fetchedStats.recentSales || [],
    lowStockAlerts: fetchedStats.lowStockAlerts || [],
    lowStockProducts: (fetchedStats.lowStockAlerts || []).length,
    totalProducts: 0,
    pendingSales: 0,
    stockSoldToday: 0,
    stockRemainingToday: fetchedStats.totalPiecesRemaining || 0,
    topProducts: [],
    dailyStockHistory: [],
  };
};

export const useDashboard = (selectedDate: Date = new Date()) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: stats,
    isLoading: loading,
    isError: error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard_stats', user?.id, selectedDate],
    queryFn: () => fetchDashboardStats(user?.id, selectedDate, toast),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    stats: stats!,
    loading,
    error,
    refetch,
  };
};
