export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          low_stock_threshold: number | null
          phone: string | null
          tax_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          low_stock_threshold?: number | null
          phone?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          low_stock_threshold?: number | null
          phone?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          channel: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          last_purchase_date: string | null
          name: string
          notes: string | null
          outstanding_balance: number | null
          phone: string | null
          total_purchases: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          channel?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name: string
          notes?: string | null
          outstanding_balance?: number | null
          phone?: string | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          channel?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          last_purchase_date?: string | null
          name?: string
          notes?: string | null
          outstanding_balance?: number | null
          phone?: string | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          barcode: string | null
          category: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          id: string
          minimum_stock: number
          minimum_stock_kg: number | null
          name: string
          selling_price: number
          size: string | null
          specie: string | null
          stock_quantity: number
          total_kg_supplied: number | null
          total_pieces: number | null
          total_pieces_supplied: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          minimum_stock?: number
          minimum_stock_kg?: number | null
          name: string
          selling_price?: number
          size?: string | null
          specie?: string | null
          stock_quantity?: number
          total_kg_supplied?: number | null
          total_pieces?: number | null
          total_pieces_supplied?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          id?: string
          minimum_stock?: number
          minimum_stock_kg?: number | null
          name?: string
          selling_price?: number
          size?: string | null
          specie?: string | null
          stock_quantity?: number
          total_kg_supplied?: number | null
          total_pieces?: number | null
          total_pieces_supplied?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          pieces_sold: number | null
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          pieces_sold?: number | null
          product_id: string
          quantity?: number
          sale_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          pieces_sold?: number | null
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          payment_method: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          supplier_name: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          supplier_name: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          quantity: number
          stock_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          quantity?: number
          stock_id: string
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          quantity?: number
          stock_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_updates: {
        Row: {
          created_at: string
          driver_name: string | null
          id: string
          inventory_id: string
          pieces_added: number | null
          quantity_added_kg: number
          update_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          id?: string
          inventory_id: string
          pieces_added?: number | null
          quantity_added_kg: number
          update_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          id?: string
          inventory_id?: string
          pieces_added?: number | null
          quantity_added_kg?: number
          update_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_updates_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          status: string | null
          temporary_password: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          temporary_password?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          temporary_password?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: { assigner_id?: string; new_role: string; target_user_id: string }
        Returns: undefined
      }
      get_historical_stock_data: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          closing_stock_value: number
          opening_stock_value: number
          stock_in_value: number
          stock_out_value: number
        }[]
      }
      invite_user: {
        Args: {
          invite_email: string
          invite_role?: string
          invited_by_id?: string
        }
        Returns: Json
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      remove_user_role: {
        Args: { role_to_remove: string; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      fish_size: "500g" | "1kg" | "1.5kg" | "2kg" | "2.5kg" | "3kg"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fish_size: ["500g", "1kg", "1.5kg", "2kg", "2.5kg", "3kg"],
    },
  },
} as const
