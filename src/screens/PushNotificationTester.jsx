// FinalPushTest.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Button, 
  Alert, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  StatusBar, 
  Platform
} from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthProvider';

const FinalPushTest = () => {
  const socket = useSocket();
  const auth = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({});
  
  // Load initial status
  useEffect(() => {
    refreshStatus();
  }, []);
  
  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const result = `${timestamp}: ${message}`;
    console.log(`🧪 ${result}`);
    setTestResults(prev => [...prev.slice(-9), { message: result, type }]); // Keep last 10
  };
  
  const refreshStatus = () => {
    const currentStatus = socket.getPushTokenStatus();
    setStatus(currentStatus);
    return currentStatus;
  };
  
  const testAllConnection = async () => {
    setLoading(true);
    addResult('=== STARTING COMPREHENSIVE TEST ===', 'test');
    
    // Step 1: Check status
    const currentStatus = refreshStatus();
    addResult(`1. Status Check:`, 'info');
    addResult(`   • User: ${currentStatus.userId || 'None'}`, 'info');
    addResult(`   • Token: ${currentStatus.hasToken ? '✅' : '❌'}`, currentStatus.hasToken ? 'success' : 'error');
    addResult(`   • Auth: ${currentStatus.authed ? '✅' : '❌'}`, currentStatus.authed ? 'success' : 'error');
    addResult(`   • Registered: ${currentStatus.isRegistered ? '✅' : '❌'}`, currentStatus.isRegistered ? 'success' : 'error');
    
    // Step 2: Check socket
    addResult(`2. Socket: ${socket.isConnected ? '✅ Connected' : '❌ Disconnected'}`, 
              socket.isConnected ? 'success' : 'error');
    
    // Step 3: Register push token if not registered
    if (!currentStatus.isRegistered && currentStatus.authed && currentStatus.hasToken) {
      addResult('3. Attempting to register push token...', 'test');
      try {
        const registered = await socket.triggerPushRegistrationNow();
        addResult(`   Registration: ${registered ? '✅ Success' : '❌ Failed'}`, 
                  registered ? 'success' : 'error');
      } catch (error) {
        addResult(`   ❌ Error: ${error.message}`, 'error');
      }
    } else if (currentStatus.isRegistered) {
      addResult('3. Push token already registered ✅', 'success');
    }
    
    // Step 4: Test socket notification
    addResult('4. Testing socket notification...', 'test');
    if (socket.isConnected) {
      socket.sendTestNotification();
      addResult('   ✅ Socket test sent', 'success');
    } else {
      addResult('   ❌ Socket not connected', 'error');
    }
    
    // Step 5: Test direct push
    addResult('5. Testing direct push notification...', 'test');
    if (currentStatus.isRegistered) {
      const result = await socket.sendTestPushNotification();
      addResult(`   Direct push: ${result.success ? '✅ Sent' : '❌ Failed'}`, 
                result.success ? 'success' : 'error');
    } else {
      addResult('   ❌ Cannot send push - token not registered', 'error');
    }
    
    addResult('=== TEST COMPLETE ===', 'test');
    setLoading(false);
  };
  
  const testSocketNotification = () => {
    addResult('Testing SOCKET notification...', 'test');
    
    if (!socket.isConnected) {
      addResult('❌ Socket not connected', 'error');
      Alert.alert('Error', 'Socket is not connected');
      return;
    }
    
    socket.sendTestNotification();
    addResult('✅ Socket test notification sent', 'success');
    
    Alert.alert(
      'Socket Test Sent',
      'Socket notification test sent to backend.\n\n' +
      'Check:\n' +
      '1. Backend logs for "Test notification requested"\n' +
      '2. App logs for "Socket notification received"'
    );
  };
  
  const testDirectPushNotification = async () => {
    addResult('Testing DIRECT push notification...', 'test');
    
    if (!status.isRegistered) {
      addResult('❌ Push token not registered with backend', 'error');
      Alert.alert(
        'Not Registered',
        'Push token needs to be registered first.\n\n' +
        'Run "Run All Tests" or manually register the token.'
      );
      return;
    }
    
    setLoading(true);
    try {
      const result = await socket.sendTestPushNotification();
      
      if (result.success) {
        addResult('✅ Direct push test sent successfully', 'success');
        Alert.alert(
          'Success!',
          'Direct push notification sent!\n\n' +
          'You should receive a push notification on your device shortly.'
        );
      } else {
        addResult(`❌ Push test failed: ${result.error}`, 'error');
        Alert.alert('Failed', 'Could not send push notification');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const testManualRegistration = async () => {
    addResult('Testing MANUAL registration...', 'test');
    
    if (!status.hasToken) {
      addResult('❌ No push token available', 'error');
      Alert.alert('Error', 'No push token available. Setup notifications first.');
      return;
    }
    
    setLoading(true);
    try {
      const success = await socket.manuallyRegisterPushToken();
      
      if (success) {
        addResult('✅ Manual registration successful', 'success');
        refreshStatus();
      } else {
        addResult('❌ Manual registration failed', 'error');
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const checkStatus = () => {
    const currentStatus = refreshStatus();
    addResult('🔍 Checking current status...', 'info');
    
    Alert.alert(
      'Current Status',
      `User: ${currentStatus.userId || 'None'}\n` +
      `Authenticated: ${currentStatus.authed ? '✅ Yes' : '❌ No'}\n` +
      `Push Token: ${currentStatus.hasToken ? '✅ Present' : '❌ Missing'}\n` +
      `Registered with Backend: ${currentStatus.isRegistered ? '✅ Yes' : '❌ No'}\n` +
      `Socket Connected: ${socket.isConnected ? '✅ Yes' : '❌ No'}\n\n` +
      `${currentStatus.isRegistered && currentStatus.authed && socket.isConnected ? 
        '✅ All systems GO!' : 
        '⚠️ Some requirements missing'}`
    );
  };
  
  const clearResults = () => {
    setTestResults([]);
  };
  
  const TestButton = ({ title, onPress, color = '#2196F3', disabled = false }) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: color, opacity: disabled || loading ? 0.6 : 1 }
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#2e7d32" />
      
      <View style={styles.header}>
        <Text style={styles.title}>✅ Push Notification Test Suite</Text>
        <Text style={styles.subtitle}>Comprehensive Testing Tool</Text>
      </View>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Current Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>User ID:</Text>
          <Text style={[styles.statusValue, status.userId ? styles.success : styles.error]}>
            {status.userId || 'Not logged in'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Authenticated:</Text>
          <Text style={[styles.statusValue, status.authed ? styles.success : styles.error]}>
            {status.authed ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Push Token:</Text>
          <Text style={[styles.statusValue, status.hasToken ? styles.success : styles.error]}>
            {status.hasToken ? 'Present' : 'Missing'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Registered:</Text>
          <Text style={[styles.statusValue, status.isRegistered ? styles.success : styles.error]}>
            {status.isRegistered ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Socket:</Text>
          <Text style={[styles.statusValue, socket.isConnected ? styles.success : styles.error]}>
            {socket.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TestButton 
  title="🧨 CLEAR ALL PUSH STORAGE" 
  onPress={async () => {
    await AsyncStorage.multiRemove([
      'yescharge_push_token',
      'yescharge_push_registered', 
      'yescharge_notifications',
      'yescharge_unread_count'
    ]);
    Alert.alert(
      'Storage Cleared',
      'All push notification storage cleared.\n\nRESTART THE APP NOW!',
      [{ text: 'OK' }]
    );
  }}
  color="#FF3D00"
/>
        <TestButton 
          title="🔄 Run All Tests" 
          onPress={testAllConnection}
          color="#4CAF50"
          disabled={loading}
        />
        
        <TestButton 
          title="1. Check Status" 
          onPress={checkStatus}
          color="#607D8B"
          disabled={loading}
        />
        
        <TestButton 
          title="2. Register Push Token" 
          onPress={testManualRegistration}
          color="#FF9800"
          disabled={loading}
        />
        
        <TestButton 
          title="3. Test Socket Notification" 
          onPress={testSocketNotification}
          color="#2196F3"
          disabled={loading || !socket.isConnected}
        />
        
        <TestButton 
          title="4. Test Direct Push" 
          onPress={testDirectPushNotification}
          color="#9C27B0"
          disabled={loading || !status.isRegistered}
        />
        
        <TestButton 
          title="🧹 Clear Results" 
          onPress={clearResults}
          color="#9E9E9E"
          disabled={loading}
        />
      </View>
      
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          <Text style={styles.resultsCount}>{testResults.length} logs</Text>
        </View>
        
        {testResults.length === 0 ? (
          <Text style={styles.emptyResults}>No tests run yet. Click "Run All Tests" to start.</Text>
        ) : (
          testResults.map((result, index) => (
            <View 
              key={index} 
              style={[
                styles.resultItem,
                result.type === 'success' && styles.resultSuccess,
                result.type === 'error' && styles.resultError,
                result.type === 'test' && styles.resultTest,
              ]}
            >
              <Text style={styles.resultText}>{result.message}</Text>
            </View>
          ))
        )}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Expected Backend Logs:</Text>
        <Text style={styles.infoText}>
          • Socket Test: "Test notification requested for user X"{'\n'}
          • Push Registration: "Registering push token for user X"{'\n'}
          • Direct Push: "Direct push test for user X"{'\n'}
          • Success: "Expo push notification sent successfully"
        </Text>
      </View>
      
      <View style={styles.debugBox}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          Auth Token: {auth.user?.token ? '✅ Present' : '❌ Missing'}{'\n'}
          Device: {Platform.OS}{'\n'}
          User Role: {auth.user?.role || 'None'}{'\n'}
          Notifications: {socket.notificationsAvailable ? '✅ Enabled' : '❌ Disabled'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#2e7d32',
  },
  error: {
    color: '#d32f2f',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptyResults: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultSuccess: {
    backgroundColor: '#E8F5E9',
  },
  resultError: {
    backgroundColor: '#FFEBEE',
  },
  resultTest: {
    backgroundColor: '#E3F2FD',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#2196F3',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  debugBox: {
    backgroundColor: '#F3E5F5',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 8,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#7B1FA2',
  },
  debugText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});

export default FinalPushTest;