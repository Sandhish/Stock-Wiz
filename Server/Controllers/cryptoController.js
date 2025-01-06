const axios = require('axios');
const Crypto = require('../Models/Crypto');

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

const fetchCryptoData = async (symbol) => {
    try {
        const response = await axios.get(`${BINANCE_API_URL}/ticker/price`, {
            params: { symbol },
        });

        if (!response.data || !response.data.price) {
            throw new Error('Invalid cryptocurrency symbol');
        }

        const price = parseFloat(response.data.price);
        return { symbol, price };
    } catch (error) {
        throw new Error(`Error fetching crypto data: ${error.message}`);
    }
};

const fetchCryptoHistory = async (symbol) => {
    try {
        const response = await axios.get(`${BINANCE_API_URL}/klines`, {
            params: {
                symbol,
                interval: '1h',
                limit: 24,
            },
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('No historical data found');
        }

        return response.data.map((data) => ({
            price: parseFloat(data[4]),
            date: new Date(data[6]),
        }));
    } catch (error) {
        throw new Error(`Error fetching historical data: ${error.message}`);
    }
};

const updateCryptoData = async (symbol) => {
    const liveData = await fetchCryptoData(symbol);
    const priceHistory = await fetchCryptoHistory(symbol);

    const crypto = await Crypto.findOne({ symbol });
    const previousPrice = crypto?.price || 0;
    const percentageChange = previousPrice
        ? ((liveData.price - previousPrice) / previousPrice) * 100
        : 0;

    const updatedCrypto = await Crypto.findOneAndUpdate(
        { symbol: liveData.symbol },
        {
            price: liveData.price,
            percentageChange: percentageChange.toFixed(2),
            priceHistory: priceHistory,
        },
        { upsert: true, new: true }
    );

    return updatedCrypto;
};

const getAllCryptos = async (req, res) => {
    try {
        const cryptos = await Crypto.find();
        res.status(200).json(cryptos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCryptoDetails = async (req, res) => {
    try {
        const { symbol } = req.params;
        const crypto = await Crypto.findOne({ symbol });

        if (!crypto) {
            return res.status(404).json({ message: 'Cryptocurrency not found' });
        }

        res.status(200).json(crypto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addCrypto = async (req, res) => {
    try {
        const { symbol, name } = req.body;

        if (!symbol || !name) {
            return res.status(400).json({ message: 'Symbol and name are required' });
        }

        const liveData = await fetchCryptoData(symbol);

        const newCrypto = new Crypto({
            symbol: liveData.symbol,
            name: name,
            price: liveData.price,
            priceHistory: [{ price: liveData.price, date: new Date() }],
        });

        await newCrypto.save();
        res.status(201).json({ message: 'Cryptocurrency added successfully', crypto: newCrypto });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const refreshCryptoData = async (req, res) => {
    try {
        const { symbol } = req.params;
        const updatedCrypto = await updateCryptoData(symbol);

        res.status(200).json(updatedCrypto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCryptos,
    getCryptoDetails,
    addCrypto,
    refreshCryptoData,
};
