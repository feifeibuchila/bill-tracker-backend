import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * GET /api/v1/budgets
 * 获取预算列表
 * Query 参数：
 * - month: 月份 (YYYY-MM)
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { month } = req.query;

    let query = client
      .from('budgets')
      .select(`
        *,
        categories (
          id,
          name,
          type,
          icon,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching budgets:', error);
      return res.status(500).json({ error: 'Failed to fetch budgets' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/budgets
 * 创建预算
 * Body 参数：
 * - categoryId: 分类ID (number)
 * - amount: 预算金额 (string)
 * - month: 月份 (YYYY-MM)
 */
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { categoryId, amount, month } = req.body;

    // 参数验证
    if (!categoryId || !amount || !month) {
      return res.status(400).json({ error: 'Missing required fields: categoryId, amount, month' });
    }

    // 检查是否已存在该月份该分类的预算
    const { data: existingBudget, error: checkError } = await client
      .from('budgets')
      .select('id')
      .eq('category_id', categoryId)
      .eq('month', month)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing budget:', checkError);
      return res.status(500).json({ error: 'Failed to check existing budget' });
    }

    if (existingBudget) {
      return res.status(400).json({ error: 'Budget already exists for this category and month' });
    }

    const { data, error } = await client
      .from('budgets')
      .insert({
        category_id: categoryId,
        amount,
        month,
      })
      .select(`
        *,
        categories (
          id,
          name,
          type,
          icon,
          color
        )
      `)
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return res.status(500).json({ error: 'Failed to create budget' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/budgets/:id
 * 更新预算
 * Body 参数：
 * - amount: 预算金额 (string, 可选)
 * - month: 月份 (YYYY-MM, 可选)
 */
router.put('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const { amount, month } = req.body;

    const updateData: any = {};
    
    if (amount) updateData.amount = amount;
    if (month) updateData.month = month;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await client
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name,
          type,
          icon,
          color
        )
      `)
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return res.status(500).json({ error: 'Failed to update budget' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in PUT /budgets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/budgets/:id
 * 删除预算
 */
router.delete('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget:', error);
      return res.status(500).json({ error: 'Failed to delete budget' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /budgets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
