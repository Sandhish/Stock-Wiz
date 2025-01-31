import { useState, useEffect, useCallback } from 'react';

const useWebSocketConnection = (symbol, initialData) => {
    const [cryptoData, setCryptoData] = useState(initialData);
    const [wsConnected, setWsConnected] = useState(false);
    const [historicalData, setHistoricalData] = useState({});

    const fetchLatestData = useCallback(async () => {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            if (!response.ok) {
                console.error('Network response was not ok');
                return initialData;
            }
            const data = await response.json();

            return {
                price: parseFloat(data.lastPrice),
                percentageChange: parseFloat(data.priceChangePercent),
                high: parseFloat(data.highPrice),
                low: parseFloat(data.lowPrice),
                volume: parseFloat(data.volume)
            };
        } catch (error) {
            console.error('Fallback data fetch error:', error);
            return initialData;
        }
    }, [symbol]);

    const fetchHistoricalDataForInterval = useCallback(async (interval, limit) => {
        try {
            let apiInterval = interval;
            let apiLimit = limit;

            switch (interval) {
                case '3M':
                    apiInterval = '1w';
                    apiLimit = 12;
                    break;
                case '1Y':
                    apiInterval = '1M';
                    apiLimit = 12;
                    break;
                case 'ALL':
                    apiInterval = '1M';
                    apiLimit = 24;
                    break;
                default:
                    break;
            }

            const response = await fetch(
                `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${apiInterval}&limit=${apiLimit}`
            );

            if (!response.ok) throw new Error('Failed to fetch historical data');

            const data = await response.json();
            const formattedData = data.map(d => ({
                date: d[0],
                price: parseFloat(d[4]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                volume: parseFloat(d[5])
            }));

            return formattedData;
        } catch (error) {
            console.error(`Error fetching ${interval} historical data:`, error);
            return [];
        }
    }, [symbol]);

    const updateHistoricalData = useCallback((newData, interval) => {
        setHistoricalData(prev => {
            const intervalData = prev[interval] || [];
            const newEntry = {
                date: new Date().getTime(),
                price: newData.price,
                high: newData.high,
                low: newData.low,
                volume: newData.volume
            };

            const updatedIntervalData = [...intervalData.slice(1), newEntry];
            return {
                ...prev,
                [interval]: updatedIntervalData
            };
        });
    }, []);

    useEffect(() => {
        let ws = null;
        let fallbackInterval = null;

        const connectWebSocket = async () => {
            const intervals = ['15m', '30m', '1h', '4h', '1d', '1w', '1M', '3M', '1Y', 'ALL'];
            const limits = [96, 96, 96, 96, 30, 52, 12, 12, 12, 24];

            const historicalDataPromises = intervals.map((interval, index) =>
                fetchHistoricalDataForInterval(interval, limits[index])
            );

            const loadedHistoricalData = await Promise.all(historicalDataPromises);
            const historicalDataMap = {};
            intervals.forEach((interval, index) => {
                historicalDataMap[interval] = loadedHistoricalData[index];
            });

            setHistoricalData(historicalDataMap);

            const WS_URL = import.meta.env.VITE_WS_API || `wss://${window.location.hostname}/ws`;
            ws = new WebSocket(WS_URL);
            
            ws.onopen = () => {
                setWsConnected(true);
                ws.send(JSON.stringify({ type: 'subscribe', symbol }));
                if (fallbackInterval) clearInterval(fallbackInterval);
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'price_update' && data.symbol === symbol) {
                        const newData = {
                            price: data.price,
                            percentageChange: data.percentageChange,
                            high: data.high,
                            low: data.low,
                            volume: data.volume
                        };

                        setCryptoData(newData);

                        ['15m', '30m', '1h', '4h', '1d', '1w', '1M'].forEach(interval => {
                            updateHistoricalData(newData, interval);
                        });
                    }
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                }
            };

            ws.onclose = async () => {
                setWsConnected(false);
                fallbackInterval = setInterval(async () => {
                    const latestData = await fetchLatestData();
                    if (latestData) {
                        setCryptoData(latestData);

                        ['15m', '30m', '1h', '4h', '1d', '1w', '1M'].forEach(interval => {
                            updateHistoricalData(latestData, interval);
                        });
                    }
                }, 2000);
            };

            ws.onerror = async (error) => {
                console.error('WebSocket error:', error);
                const latestData = await fetchLatestData();
                if (latestData) {
                    setCryptoData(latestData);

                    ['15m', '30m', '1h', '4h', '1d', '1w', '1M'].forEach(interval => {
                        updateHistoricalData(latestData, interval);
                    });
                }
            };
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
        };
    }, [symbol, fetchLatestData, fetchHistoricalDataForInterval, updateHistoricalData]);

    return {
        cryptoData,
        wsConnected,
        historicalData
    };
};

export default useWebSocketConnection;