import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * POST /api/v1/orders - 创建订单
 * Body: {
 *   customer_name: string,
 *   items: [{ product_id: number, quantity: number, unit_price: string, subtotal: string }],
 *   total_amount: string,
 *   order_date?: string
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { customer_name, items, total_amount, order_date } = req.body;

    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name and items are required' });
    }

    const client = getSupabaseClient();

    // 创建订单
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        customer_name,
        total_amount,
        order_date: order_date || new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // 创建订单明细
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return res.status(500).json({ error: 'Failed to create order items' });
    }

    res.status(201).json({ data: order });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/orders - 获取订单列表
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/orders/:id - 获取订单详情（包含商品信息）
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    // 获取订单信息
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return res.status(500).json({ error: 'Failed to fetch order' });
    }

    // 获取订单明细
    const { data: orderItems, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return res.status(500).json({ error: 'Failed to fetch order items' });
    }

    // 获取商品信息
    const productIds = orderItems.map(item => item.product_id);
    const { data: products, error: productsError } = await client
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // 组合数据
    const itemsWithProducts = orderItems.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        ...item,
        product,
      };
    });

    res.json({ data: { ...order, items: itemsWithProducts } });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/orders/:id - 删除订单
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = getSupabaseClient();
    const { error } = await client
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({ error: 'Failed to delete order' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
