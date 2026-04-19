// socketManager.js
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
    this.connectionUrl = null;
    this.connectionOptions = null;
  }
  
  connect(url, options) {
    console.log('🔌 SocketManager.connect() called:', {
      url,
      options: {
        ...options,
        auth: options.auth ? {
          ...options.auth,
          token: options.auth.token ? 'Present (redacted)' : 'Missing'
        } : 'No auth'
      }
    });
    
    // Store connection parameters for reconnection
    this.connectionUrl = url;
    this.connectionOptions = options;
    
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }
    
    if (this.socket) {
      console.log('🔌 Disconnecting existing socket...');
      this.socket.disconnect();
    }
    
    try {
      console.log('🔄 Creating new socket connection...');
      const socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        ...options
      };
      
      console.log('📋 Socket options:', socketOptions);
      this.socket = io(url, socketOptions);
      this.setupListeners();
      
      console.log('✅ Socket instance created');
      return this.socket;
      
    } catch (error) {
      console.error('❌ Error creating socket connection:', error);
      return null;
    }
  }
  
  disconnect() {
    console.log('🔌 SocketManager.disconnect() called');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  setupListeners() {
    if (!this.socket) {
      console.log('⚠️ No socket available for listeners');
      return;
    }
    
    console.log('🎧 Setting up socket listeners...');
    
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully! Socket ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connect', this.socket.id);
      
      // Auto-register user after connection
      if (this.connectionOptions?.auth) {
        setTimeout(() => {
          this.registerUser();
        }, 100);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected. Reason:', reason);
      this.isConnected = false;
      this.emit('disconnect', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.emit('connect_error', error);
      
      // Try to reconnect if needed
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      }
    });
    
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnect attempt ${attemptNumber}`);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
    
    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnect error:', error);
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnect failed');
    });
    
    // Forward all socket events
    const events = [
      'system_notification', 
      'all_notifications', 
      'registered', 
      'notification_sent', 
      'test_response',
      'online_users',
      'notification_read',
      'all_marked_read',
      'notification_deleted',
      'push_notifications_sync'
    ];
    
    events.forEach(event => {
      this.socket.on(event, (data) => {
        console.log(`📡 Received event: ${event}`, data);
        this.emit(event, data);
      });
    });
    
    // Custom event for registration response
    this.socket.on('registration_response', (data) => {
      console.log('✅ User registered with socket server:', data);
      this.emit('registration_response', data);
    });
  }
  
  registerUser() {
    if (!this.socket || !this.socket.connected || !this.connectionOptions?.auth) {
      console.log('⚠️ Cannot register user - socket not ready');
      return;
    }
    
    const auth = this.connectionOptions.auth;
    console.log('📝 Registering user with socket server:', {
      userId: auth.userId,
      role: auth.role,
      hasToken: !!auth.token
    });
    
    this.socket.emit('register', {
      userId: auth.userId,
      role: auth.role || 'customer',
      username: auth.username,
      email: auth.email,
      token: auth.token
    });
  }
  
  on(event, callback) {
    console.log(`🎧 Adding listener for event: ${event}`);
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
    if (!this.listeners.has(event)) {
      console.log(`⚠️ No listeners for event: ${event}`);
      return;
    }
    
    console.log(`📤 Emitting event to listeners: ${event}`, data);
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in ${event} listener:`, error);
      }
    });
  }
  
  getSocket() {
    return this.socket;
  }
  
  getIsConnected() {
    const isConnected = this.socket?.connected || this.isConnected;
    console.log('🔍 Socket connection status:', {
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected,
      isConnected: this.isConnected,
      finalStatus: isConnected
    });
    return isConnected;
  }
  
  // Helper method to check connection status
  getConnectionStatus() {
    return {
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected || false,
      isConnected: this.isConnected,
      url: this.connectionUrl,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default SocketManager.getInstance();