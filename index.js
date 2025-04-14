const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sellerCategoriesRouter = require('./routes/sellerCategories');
const stockTransactionsRouter = require('./routes/stockTransaction');
const ordersRouter = require('./routes/orders');
const itemsrouter =require('./routes/items');

app.use('/api/vendor-categories', sellerCategoriesRouter);
app.use('/api/Stock-transactions', stockTransactionsRouter);
app.use('/api/orders', ordersRouter);

const productImage = require('./productImageUpload')
app.use('/upload_product_image',productImage);


app.use('/api/item', itemsrouter);
// Routes
app.use('/api', routes);


const verifyRoutes = require('./verifyRoute');
app.use('/twilio', verifyRoutes);


// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
