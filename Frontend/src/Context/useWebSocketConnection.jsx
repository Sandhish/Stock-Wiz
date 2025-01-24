import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocketConnection = (initialCryptos, WS_URL) => {
  const [cryptos, setCryptos] = useState(initialCryptos);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const ws = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setWebsocketConnected(true);

      cryptos.forEach(crypto => {
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

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [cryptos, WS_URL]);

  const updateCryptos = useCallback((newCryptos) => {
    setCryptos(newCryptos);
    if (websocketConnected && ws.current?.readyState === WebSocket.OPEN) {
      newCryptos.forEach(crypto => {
        ws.current.send(JSON.stringify({
          type: 'subscribe',
          symbol: `${crypto.symbol}USDT`
        }));
      });
    }
  }, [websocketConnected]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  return { 
    cryptos, 
    websocketConnected, 
    updateCryptos 
  };
};

export default useWebSocketConnection;