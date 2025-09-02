ALTER TABLE "products" ADD CONSTRAINT "products_total_pieces_check" CHECK (total_pieces >= 0);
