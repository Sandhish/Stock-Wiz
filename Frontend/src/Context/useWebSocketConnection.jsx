import { useState, useEffect, useCallback } from 'react';

const useWebSocketConnection = (symbol, initialData) => {
    const [cryptoData, setCryptoData] = useState(initialData);
    const [wsConnected, setWsConnected] = useState(false);
    const [fallbackData, setFallbackData] = useState(null);

    const fetchLatestData = useCallback(async () => {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();

            const latestData = {
                price: parseFloat(data.lastPrice),
                percentageChange: parseFloat(data.priceChangePercent),
                high: parseFloat(data.highPrice),
                low: parseFloat(data.lowPrice),
                volume: parseFloat(data.volume)
            };

            setFallbackData(latestData);
            return latestData;
        } catch (error) {
            console.error('Fallback data fetch error:', error);
            return null;
        }
    }, [symbol]);

    useEffect(() => {
        let ws = null;
        let fallbackInterval = null;

        const connectWebSocket = () => {
            // Use a more reliable WebSocket server URL
            ws = new WebSocket(import.meta.env.VITE_WS_FALLBACK_URL || 'wss://your-websocket-server.com');

            ws.onopen = () => {
                setWsConnected(true);
                ws.send(JSON.stringify({ type: 'subscribe', symbol }));

                // Clear fallback interval if WebSocket is active
                if (fallbackInterval) {
                    clearInterval(fallbackInterval);
                }
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update' && data.symbol === symbol) {
                        setCryptoData({
                            price: data.price,
                            percentageChange: data.percentageChange,
                            high: data.high,
                            low: data.low,
                            volume: data.volume
                        });
                    }
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                }
            };

            ws.onclose = async () => {
                setWsConnected(false);

                // Implement fallback polling
                fallbackInterval = setInterval(async () => {
                    const latestData = await fetchLatestData();
                    if (latestData) {
                        setCryptoData(latestData);
                    }
                }, 10000); // Poll every 10 seconds
            };

            ws.onerror = async (error) => {
                console.error('WebSocket error:', error);

                // Immediate fallback on error
                const latestData = await fetchLatestData();
                if (latestData) {
                    setCryptoData(latestData);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, [symbol, fetchLatestData]);

    return {
        cryptoData,
        wsConnected,
        fallbackData
    };
};

export default useWebSocketConnection;