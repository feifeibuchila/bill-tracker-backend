import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import customersRouter from "./routes/customers";
import ordersRouter from "./routes/orders";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/orders', ordersRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
