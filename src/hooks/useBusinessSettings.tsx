import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface BusinessSettings {
  id?: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  lowStockThreshold: number;
}

export const useBusinessSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "My Business",
    address: "",
    phone: "",
    email: "",
    taxRate: 0,
    currency: "NGN",
    lowStockThreshold: 20,
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          businessName: data.business_name,
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          taxRate: Number(data.tax_rate) || 0,
          currency: data.currency || "NGN",
          lowStockThreshold: data.low_stock_threshold || 20,
        });
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSettings = async (newSettings: Omit<BusinessSettings, 'id'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive",
      });
      return { error: "Not authenticated" };
    }

    try {
      const { data, error } = await supabase
        .from('business_settings')
        .upsert({
          user_id: user.id,
          business_name: newSettings.businessName,
          address: newSettings.address,
          phone: newSettings.phone,
          email: newSettings.email,
          tax_rate: newSettings.taxRate,
          currency: newSettings.currency,
          low_stock_threshold: newSettings.lowStockThreshold,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSettings({
        id: data.id,
        businessName: data.business_name,
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        taxRate: Number(data.tax_rate) || 0,
        currency: data.currency || "NGN",
        lowStockThreshold: data.low_stock_threshold || 20,
      });

      toast({
        title: "Settings saved!",
        description: "Business settings have been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save business settings. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user, fetchSettings]);

  return {
    settings,
    loading,
    saveSettings,
    fetchSettings,
  };
};
