import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';

export const useSocketConnection = () => {
  const { socket, reconnect, disconnect, isConnected } = useSocket();
  const { user, authed } = useAuth();

  useEffect(() => {
    if (authed && user) {
      console.log('🔐 User authenticated, connecting socket...');
      reconnect();
    } else {
      console.log('🔒 User not authenticated, disconnecting socket...');
      disconnect();
    }

    return () => {
      // Don't disconnect on unmount to maintain connection between screens
      // The SocketProvider will handle cleanup when auth changes
    };
  }, [authed, user?.id]);

  return {
    isConnected,
    socket,
  };
};