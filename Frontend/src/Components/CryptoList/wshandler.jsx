import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocketConnection = (symbol, onPriceUpdate) => {
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const maxReconnectDelay = 30000; // 30 seconds
  const baseDelay = 1000; // 1 second
  const maxRetries = 5;
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(import.meta.env.VITE_WS_API);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        retryCountRef.current = 0;
        
        // Subscribe to the symbol
        if (symbol) {
          ws.current.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.symbol === symbol) {
            onPriceUpdate(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if we haven't exceeded max retries
        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxReconnectDelay);
          retryCountRef.current += 1;
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Set new reconnect timeout
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Let onclose handle the reconnection
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [symbol, onPriceUpdate]);

  useEffect(() => {
    connect();

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  return isConnected;
};

export default useWebSocketConnection;