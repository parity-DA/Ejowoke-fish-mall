-- Rename existing purchases tables
ALTER TABLE "purchases" RENAME TO "stock";
ALTER TABLE "purchase_items" RENAME TO "stock_items";

-- Create the new stock_updates table
CREATE TABLE "stock_updates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "inventory_id" uuid NOT NULL,
  "quantity_added_kg" numeric NOT NULL,
  "pieces_added" integer,
  "driver_name" text,
  "update_date" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "stock_updates_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON DELETE CASCADE
);
