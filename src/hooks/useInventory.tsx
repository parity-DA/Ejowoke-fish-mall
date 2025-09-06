import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryItemInsert = Database['public']['Tables']['inventory']['Insert'];

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchInventory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error fetching inventory',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'business_id'>) => {
    if (!user || !profile) return;

    try {
      const insertData: InventoryItemInsert = {
        ...itemData,
        user_id: user.id,
        business_id: profile.business_id,
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Inventory item added successfully!',
        description: `${data.name} has been added to your inventory.`,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error adding inventory item',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if(!user) return;
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Inventory item updated successfully!',
        description: `${data.name} has been updated.`,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating inventory item',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if(!user) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Inventory item deleted successfully!',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error deleting inventory item',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user, fetchInventory]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [payload.new as InventoryItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as InventoryItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => prev.filter(item => item.id !== (payload.old as {id: string}).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalPieces = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.total_pieces || 0), 0);
  }, [inventory]);

  return {
    inventory,
    loading,
    totalPieces,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refetch: fetchInventory,
  };
};
