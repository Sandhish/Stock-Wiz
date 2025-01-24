import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, Star, StarOff } from 'lucide-react';

import PriceChart from '../Chart/PriceChart';
import TradingForm from '../TradingForm/TradingForm';
import useWebSocketConnection from '../../Context/useWebSocketConnection';
import { useWatchlist } from '../../Services/Watchlist';
import styles from './CryptoDetail.module.css';

const TimeFrames = {
  MIN_15: '15m',
  MIN_30: '30m',
  HOUR_1: '1h',
  HOUR_4: '4h',
  DAY_1: '1d',
  WEEK_1: '1w',
  MONTH_1: '1M',
  MONTH_3: '3M',
  YEAR_1: '1Y',
  ALL: 'ALL'
};

const formatPrice = (price) => {
  if (price === 0) return '0';
  const decimalPlaces = price >= 1 ? 2 : Math.min(8, Math.abs(Math.floor(Math.log10(price))) + 2);
  return price.toFixed(decimalPlaces);
};

const CryptoDetail = () => {
  const { symbol } = useParams();
  const baseSymbol = symbol.replace('USDT', '');
  const [timeframe, setTimeframe] = useState(TimeFrames.HOUR_1);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialData = {
    price: 0,
    percentageChange: 0,
    high: 0,
    low: 0,
    volume: 0
  };

  const { cryptoData, wsConnected } = useWebSocketConnection(symbol, initialData);
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      let interval, limit;

      switch (timeframe) {
        case '15m': interval = '15m'; limit = 96; break;
        case '30m': interval = '30m'; limit = 96; break;
        case '1h': interval = '1h'; limit = 96; break;
        case '4h': interval = '4h'; limit = 96; break;
        case '1d': interval = '1d'; limit = 30; break;
        case '1w': interval = '1w'; limit = 52; break;
        case '1M': interval = '1M'; limit = 12; break;
        default: interval = '1h'; limit = 96;
      }

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
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

      setPriceHistory(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol, timeframe]);

  useEffect(() => {
    if (['15m', '30m', '1h'].includes(timeframe) && cryptoData.price) {
      setPriceHistory(prev => {
        const newPrice = {
          date: new Date().getTime(),
          price: cryptoData.price,
          high: cryptoData.high,
          low: cryptoData.low,
          volume: cryptoData.volume
        };
        return [...prev.slice(1), newPrice];
      });
    }
  }, [cryptoData, timeframe]);

  const handleWatchlistClick = async () => {
    const isInWatchlist = watchlist.some(item => item.symbol === baseSymbol);
    if (isInWatchlist) {
      await removeFromWatchlist(baseSymbol);
    } else {
      await addToWatchlist(baseSymbol);
    }
  };

  const isInWatchlist = () => {
    return watchlist.some(item => item.symbol === baseSymbol);
  };

  if (loading && !cryptoData.price) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.cryptoDetailContainer}>
      <div className={styles.cryptoHeader}>
        <div className={styles.titleAndWatchlist}>
          <h2 className={styles.cryptoTitle}>{baseSymbol}</h2>
          <button
            className={styles.watchlistButton}
            onClick={handleWatchlistClick}
            title={isInWatchlist() ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isInWatchlist() ? <Star className={styles.starIcon} /> : <StarOff className={styles.starIcon} />}
          </button>
        </div>
        <div className={styles.cryptoPriceContainer}>
          <span className={styles.cryptoPrice}>
            ${formatPrice(cryptoData.price)}
          </span>
          <span className={`${styles.priceChange} ${cryptoData.percentageChange >= 0 ? styles.textGreen : styles.textRed}`}>
            {cryptoData.percentageChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={styles.timeframeButtons}>
        {Object.entries(TimeFrames).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setTimeframe(value)}
            className={`${styles.timeframeButton} ${timeframe === value ? styles.active : ''}`}
          >
            {value}
          </button>
        ))}
      </div>

      <PriceChart
        className={styles.chartContainer}
        priceHistory={priceHistory}
        timeframe={timeframe}
        symbol={symbol}
      />

      <div className={styles.bottomContainer}>
        <div className={styles.statisticsGrid}>
          {[
            { label: 'High', value: cryptoData.high, format: true },
            { label: 'Low', value: cryptoData.low, format: true },
            { label: '24h Change', value: cryptoData.percentageChange, format: false, percentage: true },
            { label: 'Volume', value: cryptoData.volume, format: 'localeString' }
          ].map(({ label, value, format, percentage }) => (
            <div key={label} className={styles.statCard}>
              <span className={styles.statLabel}>{label}</span>
              <p className={`${styles.statValue} ${percentage && (value >= 0 ? styles.textGreen : styles.textRed)}`}>
                {format === 'localeString' ? value.toLocaleString() :
                  format ? `$${formatPrice(value)}` :
                    percentage ? `${value.toFixed(2)}%` : value}
              </p>
            </div>
          ))}
        </div>

        <div className={styles.tradingFormContainer}>
          <TradingForm symbol={symbol} currentPrice={cryptoData.price} />
        </div>
      </div>
      <Link to="/portfolio" className={styles.portfolioLink}>
        Go to Portfolio<ArrowRightIcon />
      </Link>
    </div>
  );
};

export default CryptoDetail;