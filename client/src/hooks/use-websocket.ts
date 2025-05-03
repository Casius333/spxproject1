import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '@/lib/utils';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  sendMessage: (data: any) => void;
  lastMessage: any;
  readyState: number;
  connect: () => void;
  disconnect: () => void;
}

// Create a singleton WebSocket instance to prevent multiple connections
let globalWs: WebSocket | null = null;
let connectionCount = 0;

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true
  } = options;
  
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [readyState, setReadyState] = useState<number>(globalWs?.readyState || WebSocket.CLOSED);
  
  const reconnectCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasConnectedRef = useRef<boolean>(false);
  
  const connect = useCallback(() => {
    // Already connected, just register this component
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      connectionCount++;
      setReadyState(WebSocket.OPEN);
      if (onOpen) onOpen();
      hasConnectedRef.current = true;
      return;
    }
    
    // Connection in progress or already closed, create a new one
    if (!globalWs || globalWs.readyState === WebSocket.CLOSED) {
      try {
        globalWs = new WebSocket(getWebSocketUrl());
        connectionCount++;
        
        globalWs.onopen = () => {
          setReadyState(WebSocket.OPEN);
          reconnectCountRef.current = 0;
          hasConnectedRef.current = true;
          if (onOpen) onOpen();
        };
        
        globalWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            if (onMessage) onMessage(data);
          } catch (err) {
            setLastMessage(event.data);
            if (onMessage) onMessage(event.data);
          }
        };
        
        globalWs.onclose = () => {
          setReadyState(WebSocket.CLOSED);
          
          // Only try to reconnect from one component instance
          if (hasConnectedRef.current && reconnectCountRef.current < reconnectAttempts) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectCountRef.current += 1;
              globalWs = null; // Clear the global reference for a fresh start
              connect();
            }, reconnectInterval);
          }
          
          if (onClose) onClose();
        };
        
        globalWs.onerror = (error) => {
          if (onError) onError(error);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        if (onError) onError(error as Event);
      }
    }
  }, [onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    hasConnectedRef.current = false;
    connectionCount--;
    
    // Only close the global WebSocket if this is the last component using it
    if (globalWs && connectionCount <= 0) {
      globalWs.close();
      globalWs = null;
      connectionCount = 0;
    }
  }, []);
  
  const sendMessage = useCallback((data: any) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      globalWs.send(message);
    }
  }, []);
  
  useEffect(() => {
    if (autoConnect) connect();
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  return {
    sendMessage,
    lastMessage,
    readyState,
    connect,
    disconnect
  };
}
