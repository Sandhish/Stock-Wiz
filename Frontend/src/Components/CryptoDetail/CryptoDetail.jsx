import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './CryptoDetail.module.css';
import PriceChart from '../Chart/PriceChart';
import { fetchCryptoDetails } from '../../Services/cryptoService';

const CryptoDetail = () => {
  const { symbol } = useParams();
  const [cryptoData, setCryptoData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await fetchCryptoDetails(symbol);
        if (data) {
          setCryptoData(data);
          setPriceHistory(data.priceHistory || []);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:5000');

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.symbol === symbol) {
          setCryptoData(prev => ({
            ...prev,
            price: data.price,
            percentageChange: data.percentageChange
          }));

          setPriceHistory(prev => [
            ...prev.slice(-49),
            { price: parseFloat(data.price), date: new Date() }
          ]);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 5000);
      };
    };

    fetchInitialData();
    connectWebSocket();

    return () => ws?.close();
  }, [symbol]);

  if (!cryptoData) return <div>Loading...</div>;

  return (
    <div className={styles.cryptoDetailContainer}>
      <h2>{symbol}</h2>
      <p>Price: ${parseFloat(cryptoData.price).toFixed(2)}</p>
      <p>Percentage Change: {cryptoData.percentageChange}%</p>
      <PriceChart priceHistory={priceHistory} />
    </div>
  );
};

export default CryptoDetail;