CREATE OR REPLACE FUNCTION update_stock_and_inventory(
    update_id uuid,
    new_quantity double precision,
    new_pieces integer,
    new_date text,
    new_driver text
)
RETURNS void AS $$
DECLARE
    old_quantity double precision;
    old_pieces integer;
    inv_id uuid;
    quantity_diff double precision;
    pieces_diff integer;
BEGIN
    -- Get the old values and inventory_id from the stock_updates table
    SELECT quantity_added_kg, pieces_added, inventory_id
    INTO old_quantity, old_pieces, inv_id
    FROM public.stock_updates
    WHERE id = update_id;

    -- Update the stock_updates table
    UPDATE public.stock_updates
    SET
        quantity_added_kg = new_quantity,
        pieces_added = new_pieces,
        update_date = new_date::date,
        driver_name = new_driver
    WHERE id = update_id;

    -- Calculate the difference
    quantity_diff := new_quantity - old_quantity;
    pieces_diff := new_pieces - old_pieces;

    -- Update the inventory table
    UPDATE public.inventory
    SET
        stock_quantity = stock_quantity + quantity_diff,
        total_pieces = total_pieces + pieces_diff
    WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql;
