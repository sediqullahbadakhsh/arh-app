// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   Alert, 
//   ScrollView, 
//   StyleSheet,
//   TouchableOpacity,
//   StatusBar, 
//   Platform,
//   Linking,
//   ActivityIndicator
// } from 'react-native';
// import { useSocket } from '../context/SocketContext';
// import { useAuth } from '../auth/AuthProvider';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Constants from 'expo-constants';
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
// import * as Application from 'expo-application';
// import Clipboard from '@react-native-clipboard/clipboard';

// const FinalPushTest = () => {
//   const socket = useSocket();
//   const auth = useAuth();
//   const [testResults, setTestResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState({});
//   const [appInfo, setAppInfo] = useState({});
//   const [isExpoGo, setIsExpoGo] = useState(Constants.appOwnership === 'expo');
//   const [detailedLogs, setDetailedLogs] = useState([]);
  
//   // Load initial status
//   useEffect(() => {
//     refreshStatus();
//     loadAppInfo();
//     checkBuildType();
//   }, []);
  
//   const checkBuildType = () => {
//     const isExpo = Constants.appOwnership === 'expo';
//     setIsExpoGo(isExpo);
//     addResult(`📱 Build Type: ${isExpo ? 'Expo Go (Development)' : 'Standalone (Production)'}`, 'info');
    
//     if (!isExpo) {
//       addResult('🏗️ Production Build Detected', 'success');
//       addResult('🔧 FCM should be configured', 'info');
//     } else {
//       addResult('⚠️ Development Build (Expo Go)', 'warning');
//       addResult('📝 Android push notifications limited in Expo Go', 'warning');
//     }
//   };
  
//   const loadAppInfo = async () => {
//     try {
//       const info = {
//         appOwnership: Constants.appOwnership,
//         expoVersion: Constants.expoVersion,
//         deviceName: Device.deviceName,
//         deviceModel: Device.model,
//         platform: Platform.OS,
//         platformVersion: Platform.Version,
//         isDevice: Device.isDevice,
//         applicationId: await Application.getApplicationIdAsync(),
//         nativeApplicationVersion: await Application.getNativeApplicationVersion(),
//         nativeBuildVersion: await Application.getNativeBuildVersion(),
//         projectId: Constants.expoConfig?.extra?.eas?.projectId,
//         appVersion: Constants.expoConfig?.version,
//         runtimeVersion: Constants.expoConfig?.runtimeVersion,
//         hasGoogleServices: !!Constants.expoConfig?.android?.googleServicesFile,
//         buildProfile: Constants.expoConfig?.extra?.eas?.buildProfile || 'unknown'
//       };
//       setAppInfo(info);
//       addResult(`📦 App Version: ${info.nativeApplicationVersion} (Build ${info.nativeBuildVersion})`, 'info');
//       addResult(`🔑 Project ID: ${info.projectId || 'MISSING'}`, info.projectId ? 'success' : 'error');
//     } catch (error) {
//       console.error('Error loading app info:', error);
//       addResult(`❌ Error loading app info: ${error.message}`, 'error');
//     }
//   };
  
//   const addResult = (message, type = 'info') => {
//     const timestamp = new Date().toLocaleTimeString();
//     const result = `${timestamp}: ${message}`;
//     console.log(`🧪 ${result}`);
//     setTestResults(prev => [...prev.slice(-19), { message: result, type }]);
//     setDetailedLogs(prev => [...prev, { timestamp, message, type }]);
//   };
  
//   const addDetailedLog = (message, type = 'debug') => {
//     const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
//     setDetailedLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
//   };
  
//   const refreshStatus = () => {
//     const currentStatus = socket.getPushTokenStatus();
//     setStatus(currentStatus);
//     return currentStatus;
//   };
  
//   const comprehensiveProductionTest = async () => {
//     setLoading(true);
//     addResult('🚀 STARTING PRODUCTION COMPREHENSIVE TEST', 'test');
    
//     // Step 1: System Check
//     addResult('🔍 SYSTEM CHECK:', 'test');
//     addResult(`• Platform: ${Platform.OS} ${Platform.Version}`, 'info');
//     addResult(`• Device: ${Device.deviceName || Device.model}`, 'info');
//     addResult(`• Is Device: ${Device.isDevice}`, 'info');
//     addResult(`• App Type: ${isExpoGo ? 'Expo Go' : 'Standalone'}`, 'info');
    
//     // Step 2: Build Configuration
//     addResult('⚙️ BUILD CONFIGURATION:', 'test');
//     addResult(`• Project ID: ${appInfo.projectId || '❌ MISSING'}`, 
//               appInfo.projectId ? 'success' : 'error');
//     addResult(`• Build Profile: ${appInfo.buildProfile}`, 'info');
//     addResult(`• Google Services: ${appInfo.hasGoogleServices ? '✅ Present' : '❌ Missing'}`, 
//               appInfo.hasGoogleServices ? 'success' : 'error');
    
//     if (!isExpoGo && Platform.OS === 'android' && !appInfo.hasGoogleServices) {
//       addResult('⚠️ WARNING: Standalone Android build missing google-services.json', 'warning');
//     }
    
//     // Step 3: Permissions
//     addResult('🔔 NOTIFICATION PERMISSIONS:', 'test');
//     try {
//       const { status: permissionStatus } = await Notifications.getPermissionsAsync();
//       addResult(`• Current: ${permissionStatus}`, 
//                 permissionStatus === 'granted' ? 'success' : permissionStatus === 'denied' ? 'error' : 'warning');
      
//       if (permissionStatus !== 'granted') {
//         addResult('• Requesting permissions...', 'info');
//         const { status: newStatus } = await Notifications.requestPermissionsAsync();
//         addResult(`• New Status: ${newStatus}`, 
//                   newStatus === 'granted' ? 'success' : 'error');
//       }
//     } catch (error) {
//       addResult(`❌ Permission Error: ${error.message}`, 'error');
//     }
    
//     // Step 4: Firebase/FCM Check (for standalone builds)
//     if (!isExpoGo) {
//       addResult('🔥 FIREBASE/FCM CHECK:', 'test');
//       try {
//         const firebaseCheck = socket.checkFirebaseSetup();
//         addResult(`• Standalone: ${firebaseCheck.isStandalone}`, 'info');
//         addResult(`• Google Services File: ${firebaseCheck.hasGoogleServices ? '✅' : '❌'}`, 
//                   firebaseCheck.hasGoogleServices ? 'success' : 'error');
//         addResult(`• FCM Token: ${firebaseCheck.hasFcmToken ? '✅' : '❌'}`, 
//                   firebaseCheck.hasFcmToken ? 'success' : 'error');
//         addResult(`• Firebase Ready: ${firebaseCheck.firebaseReady ? '✅' : '❌'}`, 
//                   firebaseCheck.firebaseReady ? 'success' : 'error');
//       } catch (error) {
//         addResult(`❌ Firebase Check Error: ${error.message}`, 'error');
//       }
//     }
    
//     // Step 5: Push Token
//     addResult('📱 PUSH TOKEN CHECK:', 'test');
//     let currentToken = status.token;
    
//     if (!currentToken) {
//       addResult('• No token found, generating...', 'info');
//       try {
//         currentToken = await socket.getFreshPushToken();
//         if (currentToken) {
//           addResult(`✅ Generated: ${currentToken.substring(0, 40)}...`, 'success');
//           addResult(`• Token Type: ${currentToken.startsWith('ExponentPushToken') ? 'Expo' : 'FCM'}`, 'info');
//           addResult(`• Token Length: ${currentToken.length}`, 'info');
//           refreshStatus();
//         } else {
//           addResult('❌ Failed to generate token', 'error');
//         }
//       } catch (error) {
//         addResult(`❌ Token Generation Error: ${error.message}`, 'error');
//       }
//     } else {
//       addResult(`✅ Token Present: ${currentToken.substring(0, 40)}...`, 'success');
//       addResult(`• Token Type: ${currentToken.startsWith('ExponentPushToken') ? 'Expo' : 'FCM'}`, 'info');
//       addResult(`• Token Length: ${currentToken.length}`, 'info');
//     }
    
//     // Step 6: Authentication & Registration
//     addResult('🔐 AUTHENTICATION & REGISTRATION:', 'test');
//     addResult(`• User ID: ${auth.user?.id || '❌ Not logged in'}`, 
//               auth.user?.id ? 'success' : 'error');
//     addResult(`• Authenticated: ${auth.authed ? '✅ Yes' : '❌ No'}`, 
//               auth.authed ? 'success' : 'error');
//     addResult(`• Backend Registered: ${status.isRegistered ? '✅ Yes' : '❌ No'}`, 
//               status.isRegistered ? 'success' : 'error');
    
//     // Step 7: Register if needed
//     if (auth.authed && currentToken && !status.isRegistered) {
//       addResult('• Attempting registration...', 'info');
//       try {
//         const registered = await socket.triggerPushRegistrationNow(true);
//         addResult(`• Registration Result: ${registered ? '✅ Success' : '❌ Failed'}`, 
//                   registered ? 'success' : 'error');
//         refreshStatus();
//       } catch (error) {
//         addResult(`❌ Registration Error: ${error.message}`, 'error');
//       }
//     }
    
//     // Step 8: Socket Connection
//     addResult('🔌 SOCKET CONNECTION:', 'test');
//     addResult(`• Connected: ${socket.isConnected ? '✅ Yes' : '❌ No'}`, 
//               socket.isConnected ? 'success' : 'error');
    
//     if (!socket.isConnected && auth.authed) {
//       addResult('• Attempting to reconnect socket...', 'info');
//       socket.reconnect();
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       refreshStatus();
//       addResult(`• After reconnect: ${socket.isConnected ? '✅ Connected' : '❌ Still disconnected'}`, 
//                 socket.isConnected ? 'success' : 'error');
//     }
    
//     // Step 9: Test Notifications
//     addResult('📨 NOTIFICATION TESTS:', 'test');
    
//     // Test Socket Notification
//     if (socket.isConnected) {
//       addResult('• Testing Socket Notification...', 'info');
//       socket.sendTestNotification();
//       addResult('✅ Socket test notification sent', 'success');
//     } else {
//       addResult('⚠️ Cannot test socket - not connected', 'warning');
//     }
    
//     // Test Direct Push
//     if (status.isRegistered) {
//       addResult('• Testing Direct Push...', 'info');
//       try {
//         const result = await socket.testDirectPushAPI();
//         addResult(`• Direct Push: ${result.success ? '✅ Sent' : '❌ Failed'}`, 
//                   result.success ? 'success' : 'error');
//         if (result.error) {
//           addResult(`• Error: ${result.error}`, 'error');
//         }
//       } catch (error) {
//         addResult(`❌ Direct Push Error: ${error.message}`, 'error');
//       }
//     } else {
//       addResult('⚠️ Cannot test direct push - not registered', 'warning');
//     }
    
//     // Step 10: Final Status
//     addResult('📊 FINAL STATUS:', 'test');
//     const finalStatus = refreshStatus();
    
//     const allGood = finalStatus.authed && 
//                     finalStatus.isRegistered && 
//                     socket.isConnected && 
//                     finalStatus.hasToken;
    
//     if (allGood) {
//       addResult('🎉 ALL SYSTEMS OPERATIONAL!', 'success');
//       addResult('✅ Push notifications should work correctly', 'success');
//     } else {
//       addResult('⚠️ SOME ISSUES DETECTED', 'warning');
//       if (!finalStatus.authed) addResult('❌ User not authenticated', 'error');
//       if (!finalStatus.isRegistered) addResult('❌ Push token not registered', 'error');
//       if (!socket.isConnected) addResult('❌ Socket not connected', 'error');
//       if (!finalStatus.hasToken) addResult('❌ No push token', 'error');
//     }
    
//     addResult('✅ COMPREHENSIVE TEST COMPLETE', 'success');
//     setLoading(false);
//   };
  
//   const productionBuildSpecificTests = async () => {
//     if (isExpoGo) {
//       Alert.alert(
//         'Development Build',
//         'This test is for production builds only.\n\n' +
//         'Run "Production Comprehensive Test" for full testing.',
//         [{ text: 'OK' }]
//       );
//       return;
//     }
    
//     setLoading(true);
//     addResult('🏗️ PRODUCTION BUILD SPECIFIC TESTS', 'test');
    
//     // Test 1: FCM Token Generation
//     addResult('1. Testing FCM Token Generation...', 'test');
//     try {
//       const tokenData = await Notifications.getDevicePushTokenAsync();
//       addResult(`✅ Device Push Token Type: ${tokenData.type}`, 'success');
//       addResult(`✅ Token Data: ${tokenData.data.substring(0, 50)}...`, 'success');
//       addResult(`✅ FCM configured correctly`, 'success');
      
//       // Store for reference
//       await AsyncStorage.setItem('debug_fcm_token', tokenData.data);
//     } catch (error) {
//       addResult(`❌ FCM Token Error: ${error.message}`, 'error');
//       addResult('⚠️ Firebase may not be properly configured', 'warning');
//     }
    
//     // Test 2: Verify Backend Registration with FCM
//     addResult('2. Testing Backend Registration...', 'test');
//     if (auth.authed && auth.user?.token) {
//       try {
//         const testResponse = await fetch('http://3.67.144.22/backend/v1/notifications/test-endpoint', {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${auth.user.token}`,
//           },
//         });
        
//         if (testResponse.ok) {
//           addResult('✅ Backend notification endpoint accessible', 'success');
//         } else {
//           addResult(`⚠️ Backend endpoint status: ${testResponse.status}`, 'warning');
//         }
//       } catch (error) {
//         addResult(`❌ Backend test error: ${error.message}`, 'error');
//       }
//     }
    
//     // Test 3: Notification Channel (Android)
//     if (Platform.OS === 'android') {
//       addResult('3. Testing Android Notification Channel...', 'test');
//       try {
//         await Notifications.setNotificationChannelAsync('default', {
//           name: 'Default',
//           importance: Notifications.AndroidImportance.MAX,
//           vibrationPattern: [0, 250, 250, 250],
//           lightColor: '#FF231F7C',
//           sound: 'default',
//           enableVibrate: true,
//           lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
//         });
//         addResult('✅ Notification channel created/updated', 'success');
//       } catch (error) {
//         addResult(`❌ Channel error: ${error.message}`, 'error');
//       }
//     }
    
//     // Test 4: Simulate Push Receipt
//     addResult('4. Testing Push Receipt Simulation...', 'test');
//     try {
//       // This simulates what happens when a push is received
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: '📱 Production Push Test',
//           body: 'This is a local notification simulating a push',
//           data: { 
//             test: true, 
//             type: 'production_test',
//             timestamp: new Date().toISOString()
//           },
//         },
//         trigger: null, // immediate
//       });
//       addResult('✅ Local notification sent (simulates push)', 'success');
//     } catch (error) {
//       addResult(`❌ Local notification error: ${error.message}`, 'error');
//     }
    
//     setLoading(false);
//   };
  
//   const copyDebugInfo = () => {
//     const debugInfo = {
//       timestamp: new Date().toISOString(),
//       appInfo,
//       status: socket.getPushTokenStatus(),
//       testResults: detailedLogs.slice(-20),
//       auth: {
//         userId: auth.user?.id,
//         authed: auth.authed,
//         hasToken: !!auth.user?.token
//       },
//       device: {
//         name: Device.deviceName,
//         model: Device.model,
//         platform: Platform.OS,
//         version: Platform.Version
//       }
//     };
    
//     const debugString = JSON.stringify(debugInfo, null, 2);
//     Clipboard.setString(debugString);
    
//     addResult('📋 Debug info copied to clipboard', 'success');
//     Alert.alert('Copied', 'Debug information copied to clipboard');
//   };
  
//   const exportTestResults = () => {
//     const exportData = {
//       exportTimestamp: new Date().toISOString(),
//       appType: isExpoGo ? 'expo-go' : 'standalone',
//       platform: Platform.OS,
//       status: socket.getPushTokenStatus(),
//       testResults: testResults.map(r => ({
//         time: r.message.split(':')[0],
//         message: r.message.split(':').slice(1).join(':').trim(),
//         type: r.type
//       })),
//       recommendations: generateRecommendations()
//     };
    
//     const exportString = JSON.stringify(exportData, null, 2);
//     Clipboard.setString(exportString);
    
//     addResult('📤 Test results exported to clipboard', 'success');
//     Alert.alert(
//       'Exported',
//       'Test results copied to clipboard.\n\n' +
//       'You can share this with support or save for reference.',
//       [{ text: 'OK' }]
//     );
//   };
  
//   const generateRecommendations = () => {
//     const currentStatus = socket.getPushTokenStatus();
//     const recommendations = [];
    
//     if (!currentStatus.authed) {
//       recommendations.push('• Log in to the app');
//     }
    
//     if (!currentStatus.hasToken) {
//       recommendations.push('• Ensure notification permissions are granted');
//     }
    
//     if (!currentStatus.isRegistered && currentStatus.authed && currentStatus.hasToken) {
//       recommendations.push('• Run "Force Register Push Token"');
//     }
    
//     if (!socket.isConnected && currentStatus.authed) {
//       recommendations.push('• Check internet connection and backend status');
//     }
    
//     if (!isExpoGo && Platform.OS === 'android' && !appInfo.hasGoogleServices) {
//       recommendations.push('• Ensure google-services.json is properly configured');
//     }
    
//     if (recommendations.length === 0) {
//       recommendations.push('• All systems appear to be working correctly');
//     }
    
//     return recommendations;
//   };
  
//   const forceFCMReconfigure = async () => {
//     if (isExpoGo) {
//       Alert.alert('Not Available', 'FCM is only for production builds');
//       return;
//     }
    
//     Alert.alert(
//       'Force FCM Reconfiguration',
//       'This will:\n\n' +
//       '1. Clear all FCM-related data\n' +
//       '2. Force new FCM token generation\n' +
//       '3. Re-register with backend\n\n' +
//       'Use this if FCM tokens are not working.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Reconfigure FCM',
//           onPress: async () => {
//             setLoading(true);
//             addResult('🔄 FORCING FCM RECONFIGURATION', 'test');
            
//             try {
//               // Clear FCM tokens
//               await AsyncStorage.multiRemove([
//                 'yescharge_push_token',
//                 'yescharge_push_registered'
//               ]);
              
//               // Get new device push token (should be FCM)
//               const tokenData = await Notifications.getDevicePushTokenAsync();
//               addResult(`✅ New FCM Token: ${tokenData.type}`, 'success');
//               addResult(`✅ Token: ${tokenData.data.substring(0, 40)}...`, 'success');
              
//               // Store and register
//               await AsyncStorage.setItem('yescharge_push_token', tokenData.data);
//               refreshStatus();
              
//               // Force registration
//               if (auth.authed) {
//                 const registered = await socket.triggerPushRegistrationNow(true);
//                 addResult(`✅ Registration: ${registered ? 'Success' : 'Failed'}`, 
//                           registered ? 'success' : 'error');
//               }
              
//               Alert.alert(
//                 'FCM Reconfigured',
//                 'FCM has been reconfigured. Restart the app for best results.',
//                 [{ text: 'OK' }]
//               );
//             } catch (error) {
//               addResult(`❌ FCM Reconfiguration Error: ${error.message}`, 'error');
//               Alert.alert('Error', 'Failed to reconfigure FCM: ' + error.message);
//             }
            
//             setLoading(false);
//           }
//         }
//       ]
//     );
//   };
  
//   const viewFCMToken = async () => {
//     if (isExpoGo) {
//       Alert.alert('Not Available', 'FCM tokens are only for production builds');
//       return;
//     }
    
//     try {
//       const storedToken = await AsyncStorage.getItem('yescharge_push_token');
//       const fcmCheck = socket.checkFirebaseSetup();
      
//       Alert.alert(
//         'FCM Token Info',
//         `Firebase Configured: ${fcmCheck.firebaseReady ? '✅ Yes' : '❌ No'}\n` +
//         `Has FCM Token: ${fcmCheck.hasFcmToken ? '✅ Yes' : '❌ No'}\n` +
//         `Stored Token: ${storedToken ? storedToken.substring(0, 50) + '...' : 'None'}\n` +
//         `Token Length: ${storedToken ? storedToken.length : 0}\n\n` +
//         `${fcmCheck.firebaseReady ? '✅ FCM should work' : '⚠️ FCM may not work'}`,
//         [
//           { text: 'Copy Token', onPress: () => {
//             if (storedToken) {
//               Clipboard.setString(storedToken);
//               addResult('📋 FCM token copied to clipboard', 'success');
//             }
//           }},
//           { text: 'OK' }
//         ]
//       );
//     } catch (error) {
//       addResult(`❌ Error viewing FCM token: ${error.message}`, 'error');
//     }
//   };
  
//   const checkStatus = () => {
//     const currentStatus = refreshStatus();
//     const recommendations = generateRecommendations();
    
//     let statusMessage = `📱 Build: ${isExpoGo ? 'Expo Go' : 'Standalone'}\n`;
//     statusMessage += `🔧 Platform: ${Platform.OS} ${Platform.Version}\n`;
//     statusMessage += `👤 User: ${currentStatus.userId || 'Not logged in'}\n`;
//     statusMessage += `🔐 Auth: ${currentStatus.authed ? '✅ Yes' : '❌ No'}\n`;
//     statusMessage += `📱 Token: ${currentStatus.hasToken ? '✅ Present' : '❌ Missing'}\n`;
//     statusMessage += `🏷️ Registered: ${currentStatus.isRegistered ? '✅ Yes' : '❌ No'}\n`;
//     statusMessage += `🔌 Socket: ${socket.isConnected ? '✅ Connected' : '❌ Disconnected'}\n`;
//     statusMessage += `🔔 Notifications: ${currentStatus.notificationsAvailable ? '✅ Enabled' : '❌ Disabled'}\n`;
//     statusMessage += `📦 Project ID: ${currentStatus.projectId ? '✅ Set' : '❌ Missing'}\n`;
    
//     if (!isExpoGo) {
//       const firebaseCheck = socket.checkFirebaseSetup();
//       statusMessage += `🔥 Firebase: ${firebaseCheck.firebaseReady ? '✅ Ready' : '❌ Not ready'}\n`;
//       statusMessage += `📄 Google Services: ${firebaseCheck.hasGoogleServices ? '✅ Present' : '❌ Missing'}\n`;
//     }
    
//     if (recommendations.length > 0) {
//       statusMessage += `\n📋 Recommendations:\n${recommendations.join('\n')}`;
//     }
    
//     Alert.alert('Current Status', statusMessage);
//   };
  
//   const TestButton = ({ 
//     title, 
//     onPress, 
//     color = '#2196F3', 
//     disabled = false,
//     icon = '▶️' 
//   }) => (
//     <TouchableOpacity
//       style={[
//         styles.button,
//         { backgroundColor: color, opacity: disabled || loading ? 0.6 : 1 }
//       ]}
//       onPress={onPress}
//       disabled={disabled || loading}
//     >
//       <Text style={styles.buttonIcon}>{icon}</Text>
//       <Text style={styles.buttonText}>{title}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <StatusBar backgroundColor="#2e7d32" />
      
//       <View style={styles.header}>
//         <View style={styles.buildTypeBadge}>
//           <Text style={styles.buildTypeText}>
//             {isExpoGo ? '🛠️ EXPO GO' : '🏗️ PRODUCTION'}
//           </Text>
//         </View>
//         <Text style={styles.title}>🚀 Push Notification Test Suite</Text>
//         <Text style={styles.subtitle}>
//           {isExpoGo ? 'Development Testing' : 'Production Ready Testing'}
//         </Text>
//         <Text style={styles.appInfo}>
//           {Platform.OS.toUpperCase()} • v{appInfo.nativeApplicationVersion || '1.0.0'} 
//           • Build {appInfo.nativeBuildVersion || '1'}
//         </Text>
//       </View>
      
//       <View style={styles.statusCard}>
//         <View style={styles.statusHeader}>
//           <Text style={styles.statusTitle}>Current Status</Text>
//           <TouchableOpacity onPress={checkStatus} style={styles.refreshButton}>
//             <Text style={styles.refreshText}>🔄 Refresh</Text>
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.statusGrid}>
//           <View style={styles.statusItem}>
//             <Text style={styles.statusLabel}>Build Type</Text>
//             <Text style={[styles.statusValue, isExpoGo ? styles.warning : styles.success]}>
//               {isExpoGo ? 'Expo Go' : 'Standalone'}
//             </Text>
//           </View>
          
//           <View style={styles.statusItem}>
//             <Text style={styles.statusLabel}>User Auth</Text>
//             <Text style={[styles.statusValue, status.authed ? styles.success : styles.error]}>
//               {status.authed ? '✅' : '❌'}
//             </Text>
//           </View>
          
//           <View style={styles.statusItem}>
//             <Text style={styles.statusLabel}>Push Token</Text>
//             <Text style={[styles.statusValue, status.hasToken ? styles.success : styles.error]}>
//               {status.hasToken ? '✅' : '❌'}
//             </Text>
//           </View>
          
//           <View style={styles.statusItem}>
//             <Text style={styles.statusLabel}>Registered</Text>
//             <Text style={[styles.statusValue, status.isRegistered ? styles.success : styles.error]}>
//               {status.isRegistered ? '✅' : '❌'}
//             </Text>
//           </View>
          
//           <View style={styles.statusItem}>
//             <Text style={styles.statusLabel}>Socket</Text>
//             <Text style={[styles.statusValue, socket.isConnected ? styles.success : styles.error]}>
//               {socket.isConnected ? '✅' : '❌'}
//             </Text>
//           </View>
          
//           {!isExpoGo && (
//             <View style={styles.statusItem}>
//               <Text style={styles.statusLabel}>Firebase</Text>
//               <Text style={[styles.statusValue, socket.checkFirebaseSetup().firebaseReady ? styles.success : styles.error]}>
//                 {socket.checkFirebaseSetup().firebaseReady ? '✅' : '❌'}
//               </Text>
//             </View>
//           )}
//         </View>
//       </View>
      
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>🔧 Production Build Tests</Text>
//         <View style={styles.buttonGrid}>
//           <TestButton 
//             title="Run All Tests" 
//             onPress={comprehensiveProductionTest}
//             color="#4CAF50"
//             icon="🧪"
//           />
          
//           {!isExpoGo && (
//             <>
//               <TestButton 
//                 title="Production Specific" 
//                 onPress={productionBuildSpecificTests}
//                 color="#2196F3"
//                 icon="🏗️"
//               />
              
//               <TestButton 
//                 title="FCM Token Info" 
//                 onPress={viewFCMToken}
//                 color="#FF9800"
//                 icon="🔥"
//               />
              
//               <TestButton 
//                 title="Reconfigure FCM" 
//                 onPress={forceFCMReconfigure}
//                 color="#D32F2F"
//                 icon="🔄"
//               />
//             </>
//           )}
//         </View>
//       </View>
      
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
//         <View style={styles.buttonGrid}>
//           <TestButton 
//             title="Check Status" 
//             onPress={checkStatus}
//             color="#607D8B"
//             icon="📊"
//           />
          
//           <TestButton 
//             title="Force Register" 
//             onPress={() => socket.forceReRegisterPushToken()}
//             color="#9C27B0"
//             icon="🏷️"
//             disabled={!status.hasToken || !auth.authed}
//           />
          
//           <TestButton 
//             title="Test Socket" 
//             onPress={() => socket.sendTestNotification()}
//             color="#2196F3"
//             icon="🔌"
//             disabled={!socket.isConnected}
//           />
          
//           <TestButton 
//             title="Test Push" 
//             onPress={() => socket.sendTestPushNotification()}
//             color="#9C27B0"
//             icon="📨"
//             disabled={!status.isRegistered}
//           />
//         </View>
//       </View>
      
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>🛠️ Troubleshooting</Text>
//         <View style={styles.buttonGrid}>
//           <TestButton 
//             title="Clear Storage" 
//             onPress={() => socket.resetPushConfiguration()}
//             color="#FF3D00"
//             icon="🧹"
//           />
          
//           <TestButton 
//             title="Copy Debug Info" 
//             onPress={copyDebugInfo}
//             color="#795548"
//             icon="📋"
//           />
          
//           <TestButton 
//             title="Export Results" 
//             onPress={exportTestResults}
//             color="#607D8B"
//             icon="📤"
//             disabled={testResults.length === 0}
//           />
          
//           <TestButton 
//             title="Open Settings" 
//             onPress={() => Linking.openSettings()}
//             color="#795548"
//             icon="⚙️"
//           />
//         </View>
//       </View>
      
//       <View style={styles.resultsContainer}>
//         <View style={styles.resultsHeader}>
//           <Text style={styles.resultsTitle}>Test Results ({testResults.length})</Text>
//           <TouchableOpacity onPress={() => setTestResults([])}>
//             <Text style={styles.clearText}>Clear</Text>
//           </TouchableOpacity>
//         </View>
        
//         {loading && (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="small" color="#2196F3" />
//             <Text style={styles.loadingText}>Running tests...</Text>
//           </View>
//         )}
        
//         {testResults.length === 0 ? (
//           <Text style={styles.emptyResults}>
//             {loading ? 'Tests running...' : 'No tests run yet. Click "Run All Tests" to start.'}
//           </Text>
//         ) : (
//           testResults.map((result, index) => (
//             <View 
//               key={index} 
//               style={[
//                 styles.resultItem,
//                 result.type === 'success' && styles.resultSuccess,
//                 result.type === 'error' && styles.resultError,
//                 result.type === 'test' && styles.resultTest,
//                 result.type === 'warning' && styles.resultWarning,
//                 result.type === 'info' && styles.resultInfo,
//               ]}
//             >
//               <Text style={styles.resultType}>
//                 {result.type === 'success' ? '✅' : 
//                  result.type === 'error' ? '❌' : 
//                  result.type === 'warning' ? '⚠️' : 
//                  result.type === 'test' ? '🧪' : 'ℹ️'}
//               </Text>
//               <Text style={styles.resultText}>{result.message}</Text>
//             </View>
//           ))
//         )}
//       </View>
      
//       {!isExpoGo && (
//         <View style={styles.infoBox}>
//           <Text style={styles.infoTitle}>🏗️ Production Build Notes:</Text>
//           <Text style={styles.infoText}>
//             • FCM tokens are used for Android push notifications{'\n'}
//             • Project ID must be configured in EAS{'\n'}
//             • google-services.json required for Android{'\n'}
//             • iOS requires proper provisioning profiles{'\n'}
//             • Backend must handle both Expo and FCM tokens{'\n'}
//             • Token registration requires authentication
//           </Text>
//         </View>
//       )}
      
//       <View style={styles.infoBox}>
//         <Text style={styles.infoTitle}>🔧 Build Configuration:</Text>
//         <Text style={styles.infoText}>
//           Project ID: {appInfo.projectId || '❌ MISSING'}{'\n'}
//           Build Profile: {appInfo.buildProfile}{'\n'}
//           App Version: {appInfo.nativeApplicationVersion}{'\n'}
//           Build Version: {appInfo.nativeBuildVersion}{'\n'}
//           Google Services: {appInfo.hasGoogleServices ? '✅ Present' : '❌ Missing'}{'\n'}
//           Device: {appInfo.deviceName || appInfo.deviceModel}
//         </Text>
//       </View>
      
//       <View style={styles.tipsBox}>
//         <Text style={styles.tipsTitle}>💡 Testing Tips:</Text>
//         <Text style={styles.tipsText}>
//           1. Run "Production Comprehensive Test" first{'\n'}
//           2. Check Firebase configuration if on Android standalone{'\n'}
//           3. Ensure user is logged in for registration{'\n'}
//           4. Copy debug info for support requests{'\n'}
//           5. Restart app after major configuration changes{'\n'}
//           6. Test with app in background for real push
//         </Text>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   header: {
//     backgroundColor: '#2e7d32',
//     padding: 20,
//     paddingTop: 50,
//     paddingBottom: 25,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   buildTypeBadge: {
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginBottom: 10,
//   },
//   buildTypeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     textAlign: 'center',
//     marginBottom: 5,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.9)',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   appInfo: {
//     fontSize: 11,
//     color: 'rgba(255,255,255,0.7)',
//     textAlign: 'center',
//     fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
//   },
//   statusCard: {
//     backgroundColor: 'white',
//     marginHorizontal: 15,
//     padding: 15,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     marginBottom: 20,
//   },
//   statusHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   statusTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   refreshButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     backgroundColor: '#e3f2fd',
//     borderRadius: 6,
//   },
//   refreshText: {
//     fontSize: 12,
//     color: '#2196F3',
//     fontWeight: '600',
//   },
//   statusGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   statusItem: {
//     width: '48%',
//     marginBottom: 10,
//   },
//   statusLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   statusValue: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   success: {
//     color: '#2e7d32',
//   },
//   error: {
//     color: '#d32f2f',
//   },
//   warning: {
//     color: '#ff9800',
//   },
//   section: {
//     marginBottom: 20,
//     paddingHorizontal: 15,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   buttonGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   button: {
//     flex: 1,
//     minWidth: '48%',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginBottom: 5,
//   },
//   buttonIcon: {
//     marginRight: 6,
//     fontSize: 14,
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 13,
//     textAlign: 'center',
//   },
//   resultsContainer: {
//     backgroundColor: 'white',
//     marginHorizontal: 15,
//     marginBottom: 20,
//     borderRadius: 12,
//     padding: 15,
//     minHeight: 200,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   resultsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   resultsTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   clearText: {
//     fontSize: 12,
//     color: '#d32f2f',
//     fontWeight: '600',
//   },
//   emptyResults: {
//     color: '#999',
//     fontStyle: 'italic',
//     textAlign: 'center',
//     marginTop: 20,
//     fontSize: 12,
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 10,
//   },
//   loadingText: {
//     marginLeft: 10,
//     color: '#2196F3',
//     fontSize: 12,
//   },
//   resultItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     paddingVertical: 6,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f5f5f5',
//   },
//   resultType: {
//     fontSize: 12,
//     marginRight: 8,
//     marginTop: 1,
//   },
//   resultText: {
//     fontSize: 11,
//     fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
//     flex: 1,
//   },
//   resultSuccess: {
//     backgroundColor: '#E8F5E9',
//   },
//   resultError: {
//     backgroundColor: '#FFEBEE',
//   },
//   resultTest: {
//     backgroundColor: '#E3F2FD',
//   },
//   resultWarning: {
//     backgroundColor: '#FFF3E0',
//   },
//   resultInfo: {
//     backgroundColor: '#F5F5F5',
//   },
//   infoBox: {
//     backgroundColor: '#E3F2FD',
//     marginHorizontal: 15,
//     marginBottom: 10,
//     padding: 12,
//     borderRadius: 8,
//   },
//   infoTitle: {
//     fontWeight: 'bold',
//     marginBottom: 6,
//     color: '#1976d2',
//     fontSize: 13,
//   },
//   infoText: {
//     fontSize: 11,
//     lineHeight: 16,
//   },
//   tipsBox: {
//     backgroundColor: '#FFF3E0',
//     marginHorizontal: 15,
//     marginBottom: 30,
//     padding: 12,
//     borderRadius: 8,
//   },
//   tipsTitle: {
//     fontWeight: 'bold',
//     marginBottom: 6,
//     color: '#EF6C00',
//     fontSize: 13,
//   },
//   tipsText: {
//     fontSize: 11,
//     lineHeight: 16,
//   },
// });

// export default FinalPushTest;