import express from "express";
import cors from "cors";

// 导入路由
import categoriesRouter from './routes/categories';
import transactionsRouter from './routes/transactions';
import statisticsRouter from './routes/statistics';
import budgetsRouter from './routes/budgets';

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// 注册路由
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/budgets', budgetsRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
