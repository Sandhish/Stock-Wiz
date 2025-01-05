const express = require('express');
const cors = require('cors');
const connectDB = require('./Config/db');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { updateStockData } = require('./Controllers/stockController');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/stocks', require('./Routes/stockRoutes'));
// app.use('/api/portfolio', require('./Routes/portfolioRoutes'));

connectDB();

cron.schedule('0 * * * *', async () => {
    console.log('Updating stock data...');

    const stocks = await Stock.find();

    for (const stock of stocks) {
        try {
            await updateStockData(stock.symbol);
            console.log(`Updated ${stock.symbol}`);
        } catch (error) {
            console.error(`Failed to update ${stock.symbol}:`, error.message);
        }
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});