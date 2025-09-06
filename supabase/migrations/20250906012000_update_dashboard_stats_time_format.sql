CREATE OR REPLACE FUNCTION public.get_dashboard_stats(target_date TEXT)
RETURNS JSONB AS $$
DECLARE
  business_uuid UUID;
  stats JSONB;
BEGIN
  -- Get the business_id for the current user
  business_uuid := public.get_current_user_business_id();

  -- Aggregate all stats in a single query for efficiency
  SELECT jsonb_build_object(
    'todaySales', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
      AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
    ),
    'totalSales', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
    ),
    'totalCustomers', (
      SELECT COUNT(DISTINCT customer_id)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
      AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
    ),
    'totalPiecesRemaining', (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM public.inventory
        WHERE business_id = business_uuid
    ),
    'recentSales', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'customer_name', COALESCE(c.name, 'Walk-in Customer'),
          'amount', s.total_amount,
          'time', s.created_at::text,
          'status', s.status
        )
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM public.sales
        WHERE business_id = business_uuid
        AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
        ORDER BY created_at DESC
        LIMIT 5
      ) s
      LEFT JOIN public.customers c ON s.customer_id = c.id
    ),
    'lowStockAlerts', (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'current_stock', i.stock_quantity,
                'minimum_stock', i.minimum_stock
            )
        ), '[]'::jsonb)
        FROM public.inventory i
        WHERE i.business_id = business_uuid AND i.stock_quantity <= i.minimum_stock
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;
