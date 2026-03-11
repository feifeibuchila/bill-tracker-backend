import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * GET /api/v1/products - 获取商品列表
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/products - 创建商品
 * Body: { name: string, specification?: string, price: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, specification, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .insert({
        name,
        specification: specification || null,
        price,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/products/:id - 更新商品
 * Body: { name?: string, specification?: string, price?: string }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specification, price } = req.body;

    if (!name && !specification && !price) {
      return res.status(400).json({ error: 'At least one field is required' });
    }

    const client = getSupabaseClient();
    const updateData: any = {};
    if (name) updateData.name = name;
    if (specification !== undefined) updateData.specification = specification;
    if (price) updateData.price = price;

    const { data, error } = await client
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/products/:id - 删除商品
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = getSupabaseClient();
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
