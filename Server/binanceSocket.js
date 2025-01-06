const WebSocket = require('ws');
const Crypto = require('./Models/Crypto');

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream?streams=';
const clients = new Set();

const trackCryptoPrices = (symbols, wss) => {
    const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `${BINANCE_WS_URL}${streams}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('Connected to Binance WebSocket');
    });

    ws.on('message', async (data) => {
        try {
            const parsedData = JSON.parse(data);
            const { s: symbol, c: price } = parsedData.data;

            const existingCrypto = await Crypto.findOne({ symbol });
            const previousPrice = existingCrypto?.price || 0;
            const updatedPrice = parseFloat(price);

            const percentageChange = previousPrice ? 
                ((updatedPrice - previousPrice) / previousPrice) * 100 : 0;

            await Crypto.findOneAndUpdate(
                { symbol },
                {
                    price: updatedPrice,
                    $push: { 
                        priceHistory: { 
                            price: updatedPrice, 
                            date: new Date() 
                        } 
                    },
                    percentageChange: percentageChange.toFixed(2)
                },
                { upsert: true, new: true }
            );

            const update = JSON.stringify({
                symbol,
                price: updatedPrice,
                percentageChange: percentageChange.toFixed(2)
            });

            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(update);
                }
            });
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('error', console.error);
    ws.on('close', () => setTimeout(() => trackCryptoPrices(symbols, wss), 5000));
};

const startWebSocket = async (wss) => {
    try {
        const cryptos = await Crypto.find();
        const symbols = cryptos.map(crypto => crypto.symbol);

        if (!symbols.length) {
            console.error('No symbols found in database');
            return;
        }

        wss.on('connection', (ws) => {
            clients.add(ws);
            console.log('Client connected');

            ws.on('close', () => {
                clients.delete(ws);
                console.log('Client disconnected');
            });
        });

        trackCryptoPrices(symbols, wss);
    } catch (error) {
        console.error('StartWebSocket error:', error);
    }
};

module.exports = startWebSocket;