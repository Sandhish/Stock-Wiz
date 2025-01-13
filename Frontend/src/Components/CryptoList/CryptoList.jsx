import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from 'lucide-react';
import axios from 'axios';
import classNames from 'classnames';
import styles from './CryptoList.module.css';
import { useNavigate } from 'react-router-dom';

const CryptoList = () => {
  const navigate = useNavigate();
  const savedPage = parseInt(sessionStorage.getItem('cryptoListPage')) || 1;
  const ws = useRef(null);

  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(savedPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [websocketConnected, setWebsocketConnected] = useState(false);

  const ITEMS_PER_PAGE = 30;
  const API_KEY = 'ecb7d232-1db3-4128-9e40-e0d8ae6a6abf';
  const WS_URL = 'ws://localhost:3001/ws';

  const cryptosRef = useRef(cryptos);
  useEffect(() => {
    cryptosRef.current = cryptos;
  }, [cryptos]);

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setWebsocketConnected(true);
      
      cryptosRef.current.forEach(crypto => {
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          symbol: `${crypto.symbol}USDT`
        }));
      });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        setCryptos(prevCryptos => 
          prevCryptos.map(crypto => 
            crypto.symbol === data.symbol.replace('USDT', '') 
              ? {
                  ...crypto,
                  price: data.price,
                  percentageChange: data.percentageChange,
                  volume: data.volume
                }
              : crypto
          )
        );
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setWebsocketConnected(false);
      setTimeout(connectWebSocket, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.current?.close();
    };
  }, []);

  const fetchCryptos = async () => {
    setLoading(true);
    setError(null);

    try {
      if (totalCoins === 0) {
        const overviewResponse = await axios.post('https://api.livecoinwatch.com/coins/list', {
          currency: 'USD',
          sort: 'rank',
          order: 'ascending',
          offset: 0,
          limit: 1,
          meta: true
        }, {
          headers: {
            'content-type': 'application/json',
            'x-api-key': API_KEY
          }
        });
        setTotalCoins(overviewResponse.headers['x-total-count'] || 5000);
      }

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await axios.post('https://api.livecoinwatch.com/coins/list', {
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset: offset,
        limit: ITEMS_PER_PAGE,
        meta: true
      }, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY
        }
      });

      const formattedData = response.data.map((crypto) => ({
        id: crypto.code,
        symbol: crypto.code,
        name: crypto.name,
        price: crypto.rate,
        percentageChange: crypto.delta.day,
        marketCap: crypto.cap,
        volume: crypto.volume,
        iconUrl: `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${crypto.code.toLowerCase()}.png`,
        rank: crypto.rank || Infinity
      }));

      formattedData.sort((a, b) => a.rank - b.rank);
      
      setCryptos(formattedData);
      
      if (websocketConnected && ws.current?.readyState === WebSocket.OPEN) {
        formattedData.forEach(crypto => {
          ws.current.send(JSON.stringify({
            type: 'subscribe',
            symbol: `${crypto.symbol}USDT`
          }));
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while fetching data. Please try again later.');
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const localResults = cryptos.filter(crypto => 
      crypto.name.toLowerCase().includes(query.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    setSearchResults(localResults);

    try {
      const response = await axios.post('https://api.livecoinwatch.com/coins/list', {
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset: 0,
        limit: 10,
        meta: true,
        search: query
      }, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY
        }
      });

      const apiResults = response.data.map(crypto => ({
        id: crypto.code,
        symbol: crypto.code,
        name: crypto.name,
        price: crypto.rate,
        percentageChange: crypto.delta.day,
        marketCap: crypto.cap,
        volume: crypto.volume,
        iconUrl: `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${crypto.code.toLowerCase()}.png`
      }));

      setSearchResults(apiResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [cryptos]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    sessionStorage.setItem('cryptoListPage', page.toString());
  }, [page]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    fetchCryptos();
  }, [page]);

  const handleRowClick = (symbol) => {
    navigate(`/crypto/${symbol}USDT`);
  };

  const handleNextPage = () => {
    const maxPages = Math.ceil(totalCoins / ITEMS_PER_PAGE);
    if (page < maxPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (loading && page === 1) {
    return (
      <div className={styles.loading}>
        Loading...
      </div>
    );
  }

  const totalPages = Math.ceil(totalCoins / ITEMS_PER_PAGE);

  return (
    <div className={styles.cryptoListContainer}>
      {error && (
        <div className={styles.errorDialog}>
          <div className={styles.errorContent}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      )}

      {!error && (
        <>
          <div className={styles.headerContainer}>
            <h2 className={styles.cryptoListHeading}>Live Crypto Prices</h2>
            <div className={styles.searchBarContainer}>
              <input 
                type="text" 
                placeholder="Search by name or symbol..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={styles.searchBar} 
              />
              <SearchIcon className={styles.searchIcon} size={20} />
              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map((crypto) => (
                    <div 
                      key={crypto.id} 
                      className={styles.searchResultItem} 
                      onClick={() => handleRowClick(crypto.symbol)}
                    >
                      <img 
                        src={crypto.iconUrl} 
                        alt={crypto.symbol} 
                        className={styles.searchResultIcon}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/fallback-crypto-icon.png';
                        }}
                      />
                      <span>{crypto.name} ({crypto.symbol})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.cryptoListTable}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                  <th>Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {cryptos.map((crypto) => (
                  <tr 
                    key={`${crypto.symbol}-${crypto.id}`} 
                    className={styles.cryptoRow} 
                    onClick={() => handleRowClick(crypto.symbol)}
                  >
                    <td className={styles.assetCell}>
                      <img 
                        src={crypto.iconUrl} 
                        alt={crypto.symbol} 
                        className={styles.cryptoIcon}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/fallback-crypto-icon.png';
                        }}
                      />
                      <span className={styles.cryptoName}>{crypto.name}</span>
                      <span className={styles.cryptoSymbol}>{crypto.symbol}</span>
                    </td>
                    <td className={styles.priceCell}>
                      ${crypto.price.toFixed(2)}
                    </td>
                    <td className={classNames(styles.changeCell, {
                      [styles.positive]: crypto.percentageChange > 0,
                      [styles.negative]: crypto.percentageChange < 0,
                    })}>
                      {crypto.percentageChange > 0 ? (
                        <ArrowUpIcon className={styles.arrowIcon} />
                      ) : (
                        <ArrowDownIcon className={styles.arrowIcon} />
                      )}
                      {Math.abs(crypto.percentageChange).toFixed(2)}%
                    </td>
                    <td className={styles.marketCapCell}>
                      ${crypto.marketCap ? (crypto.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
                    </td>
                    <td className={styles.volumeCell}>
                      ${crypto.volume ? (crypto.volume / 1e6).toFixed(2) + 'M' : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={handlePreviousPage}
              disabled={page === 1 || loading}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              className={styles.pageButton}
              onClick={handleNextPage}
              disabled={page === totalPages || loading}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CryptoList;