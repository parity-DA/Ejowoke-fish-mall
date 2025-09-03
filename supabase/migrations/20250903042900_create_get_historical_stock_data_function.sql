CREATE OR REPLACE FUNCTION get_historical_stock_data(p_user_id UUID, p_date DATE)
RETURNS TABLE(opening_stock_value NUMERIC, stock_in_value NUMERIC, stock_out_value NUMERIC, closing_stock_value NUMERIC) AS $$
DECLARE
    v_start_of_day TIMESTAMPTZ;
    v_end_of_day TIMESTAMPTZ;
    v_total_stock_in_before NUMERIC;
    v_total_stock_out_before NUMERIC;
    v_stock_in_today NUMERIC;
    v_stock_out_today NUMERIC;
BEGIN
    v_start_of_day := date_trunc('day', p_date);
    v_end_of_day := v_start_of_day + interval '1 day - 1 second';

    -- Calculate total stock in value before the selected day
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_stock_in_before
    FROM stock
    WHERE user_id = p_user_id AND created_at < v_start_of_day;

    -- Calculate total stock out value (cost of goods sold) before the selected day
    SELECT COALESCE(SUM(si.quantity * i.cost_price), 0)
    INTO v_total_stock_out_before
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN inventory i ON si.inventory_item_id = i.id
    WHERE s.user_id = p_user_id AND s.created_at < v_start_of_day AND s.status = 'completed';

    -- Calculate opening stock value
    opening_stock_value := v_total_stock_in_before - v_total_stock_out_before;

    -- Calculate stock in value for the selected day
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_stock_in_today
    FROM stock
    WHERE user_id = p_user_id AND created_at >= v_start_of_day AND created_at <= v_end_of_day;

    stock_in_value := v_stock_in_today;

    -- Calculate stock out value (cost of goods sold) for the selected day
    SELECT COALESCE(SUM(si.quantity * i.cost_price), 0)
    INTO v_stock_out_today
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN inventory i ON si.inventory_item_id = i.id
    WHERE s.user_id = p_user_id AND s.created_at >= v_start_of_day AND s.created_at <= v_end_of_day AND s.status = 'completed';

    stock_out_value := v_stock_out_today;

    -- Calculate closing stock value
    closing_stock_value := opening_stock_value + stock_in_value - stock_out_value;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
