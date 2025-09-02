CREATE TYPE fish_size AS ENUM ('500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg');
ALTER TABLE "inventory" ADD COLUMN "size" fish_size;
