import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * GET /api/v1/transactions
 * 获取交易记录列表
 * Query 参数：
 * - startDate: 开始日期 (YYYY-MM-DD)
 * - endDate: 结束日期 (YYYY-MM-DD)
 * - type: 类型 ('income' | 'expense')
 * - categoryId: 分类ID
 */
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { startDate, endDate, type, categoryId } = req.query;

    let query = client
      .from('transactions')
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
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate as string);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate as string);
    }
    if (type) {
      query = query.eq('type', type as string);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/transactions
 * 创建交易记录
 * Body 参数：
 * - type: 类型 ('income' | 'expense')
 * - amount: 金额 (string)
 * - categoryId: 分类ID (number)
 * - description: 备注 (string, 可选)
 * - transactionDate: 交易日期 (string, 可选，默认当前时间)
 */
router.post('/', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { type, amount, categoryId, description, transactionDate } = req.body;

    // 参数验证
    if (!type || !amount || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields: type, amount, categoryId' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Invalid type, must be "income" or "expense"' });
    }

    const insertData: any = {
      type,
      amount,
      category_id: categoryId,
    };

    if (description) {
      insertData.description = description;
    }
    if (transactionDate) {
      insertData.transaction_date = transactionDate;
    }

    const { data, error } = await client
      .from('transactions')
      .insert(insertData)
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
      console.error('Error creating transaction:', error);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/transactions/:id
 * 更新交易记录
 * Body 参数：
 * - type: 类型 ('income' | 'expense', 可选)
 * - amount: 金额 (string, 可选)
 * - categoryId: 分类ID (number, 可选)
 * - description: 备注 (string, 可选)
 * - transactionDate: 交易日期 (string, 可选)
 */
router.put('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const { type, amount, categoryId, description, transactionDate } = req.body;

    const updateData: any = {};
    
    if (type) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: 'Invalid type, must be "income" or "expense"' });
      }
      updateData.type = type;
    }
    if (amount) updateData.amount = amount;
    if (categoryId) updateData.category_id = categoryId;
    if (description !== undefined) updateData.description = description;
    if (transactionDate) updateData.transaction_date = transactionDate;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await client
      .from('transactions')
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
      console.error('Error updating transaction:', error);
      return res.status(500).json({ error: 'Failed to update transaction' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in PUT /transactions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/transactions/:id
 * 删除交易记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /transactions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
