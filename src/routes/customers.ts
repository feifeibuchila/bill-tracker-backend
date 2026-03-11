import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * GET /api/v1/customers - 获取客户列表
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/customers - 创建客户
 * Body: { name: string, phone?: string, address?: string, note?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, note } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .insert({
        name,
        phone: phone || null,
        address: address || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/customers/:id - 更新客户
 * Body: { name?: string, phone?: string, address?: string, note?: string }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, note } = req.body;

    const client = getSupabaseClient();
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (note !== undefined) updateData.note = note;

    const { data, error } = await client
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({ error: 'Failed to update customer' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/customers/:id - 删除客户
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = getSupabaseClient();
    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
