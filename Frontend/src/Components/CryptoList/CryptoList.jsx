import { fetchCryptos } from '../../Services/cryptoService';
import styles from './CryptoList.module.css';
import { useState, useEffect } from 'react';

const CryptoList = () => {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCryptos = async () => {
      const cryptoData = await fetchCryptos();
      setCryptos(cryptoData);
      setLoading(false);
    };

    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket('ws://localhost:5000');

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setCryptos(prevCryptos => 
          prevCryptos.map(crypto => 
            crypto.symbol === data.symbol 
              ? { ...crypto, price: data.price, percentageChange: data.percentageChange }
              : crypto
          )
        );
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 5000);
      };
    };

    loadCryptos();
    connectWebSocket();

    return () => ws?.close();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.cryptoListContainer}>
      <h2>Crypto List</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Percentage Change</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((crypto) => (
            <tr key={crypto.symbol}>
              <td>{crypto.symbol}</td>
              <td>${parseFloat(crypto.price).toFixed(2)}</td>
              <td
                style={{
                  color: parseFloat(crypto.percentageChange) > 0 ? 'green' : 'red',
                }}
              >
                {crypto.percentageChange}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CryptoList;