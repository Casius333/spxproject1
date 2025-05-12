import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

interface UseSocketIOOptions {
  autoConnect?: boolean;
  autoAuthenticate?: boolean;
  onMessage?: (eventName: string, data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onAuthenticated?: (success: boolean) => void;
}

interface UseSocketIOReturn {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  connect: () => void;
  disconnect: () => void;
  authenticate: () => void;
  emit: (eventName: string, data: any) => void;
  on: (eventName: string, callback: (data: any) => void) => void;
  off: (eventName: string, callback?: (data: any) => void) => void;
}

export function useSocketIO(options: UseSocketIOOptions = {}): UseSocketIOReturn {
  const {
    autoConnect = true,
    autoAuthenticate = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    onAuthenticated
  } = options;

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create socket connection
  const createSocket = useCallback(() => {
    // Get the current origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}`;

    // Create a new socket connection
    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    socketRef.current = socket;
    return socket;
  }, []);

  // Connect to socket server
  const connect = useCallback(() => {
    if (!socketRef.current) {
      createSocket();
    }
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [createSocket]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  // Authenticate the socket connection
  const authenticate = useCallback(() => {
    if (socketRef.current && user) {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        socketRef.current.emit('authenticate', { token });
      }
    }
  }, [user]);

  // Emit an event
  const emit = useCallback((eventName: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(eventName, data);
    }
  }, []);

  // Subscribe to an event
  const on = useCallback((eventName: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, callback);
    }
  }, []);

  // Unsubscribe from an event
  const off = useCallback((eventName: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(eventName, callback);
    }
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    const socket = socketRef.current || createSocket();

    // Connect and disconnect handlers
    socket.on('connect', () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
      if (onConnect) onConnect();
      if (autoAuthenticate) authenticate();
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
      setIsAuthenticated(false);
      if (onDisconnect) onDisconnect();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      if (onError) onError(error);
    });

    // Authentication handler
    socket.on('authenticated', (data) => {
      setIsAuthenticated(data.success);
      if (onAuthenticated) onAuthenticated(data.success);
    });

    // Generic message handler
    if (onMessage) {
      socket.onAny((eventName, data) => {
        onMessage(eventName, data);
      });
    }

    // Auto connect if specified
    if (autoConnect) {
      socket.connect();
    }

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('authenticated');
      if (onMessage) {
        socket.offAny();
      }
      socket.disconnect();
    };
  }, [
    autoConnect, 
    autoAuthenticate, 
    authenticate, 
    createSocket, 
    onConnect, 
    onDisconnect, 
    onError, 
    onMessage,
    onAuthenticated
  ]);

  return {
    socket: socketRef.current,
    isConnected,
    isAuthenticated,
    connect,
    disconnect,
    authenticate,
    emit,
    on,
    off
  };
}