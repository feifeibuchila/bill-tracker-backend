import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';

const router = express.Router();

/**
 * GET /api/v1/statistics/summary
 * 获取收支概览
 * Query 参数：
 * - startDate: 开始日期 (YYYY-MM-DD)
 * - endDate: 结束日期 (YYYY-MM-DD)
 */
router.get('/summary', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { startDate, endDate } = req.query;

    // 获取所有交易记录
    let query = client
      .from('transactions')
      .select('type, amount');

    if (startDate) {
      query = query.gte('transaction_date', startDate as string);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching summary:', error);
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }

    // 计算收入和支出总额
    let totalIncome = 0;
    let totalExpense = 0;

    data?.forEach((transaction: any) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        balance: balance.toFixed(2),
      }
    });
  } catch (error) {
    console.error('Error in GET /statistics/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/statistics/by-category
 * 获取分类统计
 * Query 参数：
 * - startDate: 开始日期 (YYYY-MM-DD)
 * - endDate: 结束日期 (YYYY-MM-DD)
 * - type: 类型 ('income' | 'expense')
 */
router.get('/by-category', async (req, res) => {
  try {
    const client = getSupabaseClient();
    const { startDate, endDate, type } = req.query;

    // 获取所有交易记录及分类信息
    let query = client
      .from('transactions')
      .select(`
        type,
        amount,
        categories (
          id,
          name,
          type,
          icon,
          color
        )
      `);

    if (startDate) {
      query = query.gte('transaction_date', startDate as string);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate as string);
    }
    if (type) {
      query = query.eq('type', type as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching category statistics:', error);
      return res.status(500).json({ error: 'Failed to fetch category statistics' });
    }

    // 按分类统计金额
    const categoryMap = new Map<number, {
      category: any;
      total: number;
      count: number;
    }>();

    data?.forEach((transaction: any) => {
      const categoryId = transaction.categories.id;
      const amount = parseFloat(transaction.amount);

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: transaction.categories,
          total: 0,
          count: 0,
        });
      }

      const stats = categoryMap.get(categoryId)!;
      stats.total += amount;
      stats.count += 1;
    });

    // 转换为数组并按金额排序
    const result = Array.from(categoryMap.values())
      .map((stats) => ({
        category: stats.category,
        total: stats.total.toFixed(2),
        count: stats.count,
      }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in GET /statistics/by-category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
