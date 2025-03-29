import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type WebSocketMessage = {
  type: string;
  electionId?: number;
  transactionHash?: string;
  message?: string;
};

interface WebSocketContextType {
  lastMessage: WebSocketMessage | null;
  connected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  lastMessage: null,
  connected: false,
  sendMessage: () => {}
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        setLastMessage(data);
        
        // Show toast notifications for specific events
        if (data.type === 'vote') {
          toast({
            title: 'New Vote',
            description: data.message || `A new vote has been recorded for election #${data.electionId}`,
            duration: 3000,
          });
        } else if (data.type === 'election_created') {
          toast({
            title: 'New Election',
            description: data.message || 'A new election has been created',
            duration: 3000,
          });
        } else if (data.type === 'election_error') {
          toast({
            title: 'Election Error',
            description: data.message || 'There was an error with an election',
            variant: 'destructive',
            duration: 5000,
          });
        } else if (data.type === 'transaction_error') {
          toast({
            title: 'Transaction Failed',
            description: data.message || 'There was an error with a blockchain transaction',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        // The effect cleanup will run and then this effect will run again
      }, 5000);
    });

    // Connection error
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'WebSocket Error',
        description: 'Connection to the server was lost. Some real-time updates may be delayed.',
        variant: 'destructive',
      });
    });

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, [toast]);

  // Function to send messages through the WebSocket
  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider value={{ lastMessage, connected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}