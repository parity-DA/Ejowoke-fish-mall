import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

type StockUpdatePayload = Database['public']['Tables']['stock_updates']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export interface StockUpdate extends StockUpdatePayload {
  inventory: InventoryItem;
}

export const useStock = () => {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchStockUpdates = useCallback(async ({ startDate, endDate }: { startDate: string, endDate: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_updates')
        .select(`*, inventory:inventory_id (*)`)
        .gte('update_date', startDate)
        .lte('update_date', endDate)
        .order('update_date', { ascending: false });

      if (error) throw error;
      setStockUpdates(data as StockUpdate[] || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error fetching stock updates',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const addStockUpdate = async (updateData: {
    inventory_id: string;
    driver_name?: string;
    quantity_added_kg: number;
    pieces_added?: number;
    update_date: string;
  }) => {
    if (!user || !profile) return { success: false, error: 'Not authenticated' };

    try {
      const { data: stockUpdate, error: stockError } = await supabase
        .from('stock_updates')
        .insert([{ 
          ...updateData, 
          user_id: user.id,
          business_id: profile.business_id
        }])
        .select(`*, inventory:inventory_id (*)`)
        .single();

      if (stockError) throw stockError;

      const currentInventory = (stockUpdate as StockUpdate).inventory;
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          stock_quantity: (currentInventory.stock_quantity || 0) + updateData.quantity_added_kg,
          total_pieces: (currentInventory.total_pieces || 0) + (updateData.pieces_added || 0)
        })
        .eq('id', updateData.inventory_id)
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Stock updated successfully!',
        description: `Added ${updateData.quantity_added_kg}kg${updateData.pieces_added ? ` (${updateData.pieces_added} pieces)` : ''} to ${currentInventory.name}.`,
      });

      return { success: true, data: stockUpdate };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating stock',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  const updateStockUpdate = async (id: string, updates: Partial<StockUpdate>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase.rpc('update_stock_and_inventory', {
        update_id: id,
        new_quantity: updates.quantity_added_kg,
        new_pieces: updates.pieces_added,
        new_date: updates.update_date,
        new_driver: updates.driver_name
      });

      if (error) throw error;

      toast({
        title: 'Stock update modified successfully!',
      });

      return { success: true };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating stock record',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  const deleteStockUpdate = async (id: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const { data: stockUpdate, error: fetchError } = await supabase
        .from('stock_updates')
        .select('*, inventory:inventory_id(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from('stock_updates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      const currentInventory = (stockUpdate as StockUpdate).inventory;
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          stock_quantity: Math.max(0, (currentInventory.stock_quantity || 0) - stockUpdate.quantity_added_kg),
          total_pieces: Math.max(0, (currentInventory.total_pieces || 0) - (stockUpdate.pieces_added || 0))
        })
        .eq('id', stockUpdate.inventory_id)
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Stock update deleted successfully!',
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error deleting stock update',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stock-updates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_updates'
        },
        () => {
          // Refetch data when changes occur
          // This is a simplified approach. For a more robust solution,
          // you might want to check the payload and update the state directly.
          const today = new Date();
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);

          fetchStockUpdates({
            startDate: oneMonthAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStockUpdates]);

  return {
    stockUpdates,
    loading,
    addStockUpdate,
    updateStockUpdate,
    deleteStockUpdate,
    fetchStockUpdates,
  };
};
