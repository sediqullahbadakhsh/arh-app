// socketManager.js (create this new file)
import io from 'socket.io-client';
import { Platform } from 'react-native';

class SocketManager {
  static instance = null;
  
  static getInstance() {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
  
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  connect(url, options) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io(url, options);
    this.setupListeners();
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  setupListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect', this.socket.id);
    });
    
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emit('disconnect', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      this.emit('connect_error', error);
    });
    
    // Forward all socket events
    const events = ['system_notification', 'all_notifications', 'registered', 'notification_sent', 'test_response'];
    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
  
  getSocket() {
    return this.socket;
  }
  
  getIsConnected() {
    return this.isConnected;
  }
}

export default SocketManager.getInstance();