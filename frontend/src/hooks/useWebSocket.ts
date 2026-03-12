import { useCallback, useEffect, useRef, useState } from 'react';
import type { WSClientMessage, WSServerMessage } from '../types/websocket';
import { API_URLS } from '../services/api';

interface UseWebSocketReturn {
  sendMessage: (msg: WSClientMessage) => void;
  messageQueue: WSServerMessage[];
  isConnected: boolean;
  resetQueue: () => void;
}

export function useWebSocket(sessionId: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [messageQueue, setMessageQueue] = useState<WSServerMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(API_URLS.chatWs(sessionId));

    ws.onopen = () => {
      setIsConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (event) => {
      const data: WSServerMessage = JSON.parse(event.data);
      setMessageQueue(prev => [...prev, data]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect with backoff
      reconnectTimeout.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const resetQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  return { sendMessage, messageQueue, isConnected, resetQueue };
}
