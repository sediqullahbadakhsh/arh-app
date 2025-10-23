import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  Animated,
  Easing,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/colors";
import ServiceButton from "../../components/ServiceButton";
import { useUser } from "../../context/userContext";
import { getRecentOrdersOfAgent, getStockInOut } from "../../services/merchantApi";
import { formatDateTime } from "../../utils/formatDate";
import { capitalizeFirstLetter } from "../../utils/capitalizeFirstLetter";
import HeaderBackgroundSVG from "../../../assets/top";
import TopupIcon from '../../../assets/icons/topup.png';
import BundleIcon from '../../../assets/icons/Data bundle.png';
import GamesIcon from '../../../assets/icons/game.png';
import StockTransferIcon from '../../../assets/icons/stock.png';
import { useTranslation } from "react-i18next";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Receipt Modal Component (Same as Consumer Screen)
const ReceiptModal = ({ visible, onClose, transaction, transactionType }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [downloading, setDownloading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return t('status.succeeded');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return status;
    }
  };

  const getServiceName = (type, transactionType) => {
    if (transactionType === 'stock') {
      return type === "IN" ? t('services.stockIn') : t('services.stockOut');
    }
    
    switch (type) {
      case 'recharge':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };

  const getServiceIcon = (type, transactionType) => {
    if (transactionType === 'stock') {
      return type === "IN" ? "arrow-down" : "arrow-up";
    }
    
    switch (type) {
      case 'recharge':
        return 'phone-portrait-outline';
      case 'data_bundle':
        return 'wifi-outline';
      case 'game_coins':
        return 'game-controller-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shareReceipt = async () => {
    try {
      const serviceName = getServiceName(
        transactionType === 'stock' ? transaction.type : transaction.source || transaction.type,
        transactionType
      );
      
      const statusText = getStatusText(transaction.status);
      const amount = transactionType === 'stock' ? 
        Math.abs(transaction.amount) : 
        transaction.amount;
      
      const currency = transactionType === 'stock' ? 'AF' : transaction.currency || 'AFN';
      
      const receiptText = `
🎫 Transaction Receipt

Service: ${serviceName}
Amount: ${Number(amount).toFixed(2)} ${currency}
${transactionType === 'stock' ? 
  `Type: ${transaction.type === "IN" ? "Stock In" : "Stock Out"}` : 
  `Receiver: ${transaction.receiver || 'N/A'}`}
Status: ${statusText}
Date: ${formatDate(transaction.createdAt)}
Transaction ID: ${transaction.txnNumber || transaction.id}

Thank you for your business!
      `.trim();

      await Sharing.share({
        message: receiptText,
        title: 'Transaction Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const generatePDFHtml = () => {
    const statusColor = getStatusColor(transaction.status);
    const statusText = getStatusText(transaction.status);
    const serviceName = getServiceName(
      transactionType === 'stock' ? transaction.type : transaction.source || transaction.type,
      transactionType
    );
    
    const amount = transactionType === 'stock' ? 
      Math.abs(transaction.amount) : 
      transaction.amount;
    
    const currency = transactionType === 'stock' ? 'AF' : transaction.currency || 'AFN';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transaction Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #C40C02;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #C40C02;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 18px;
            color: #666;
          }
          .status-section {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: ${statusColor}15;
            border-radius: 10px;
            border-left: 4px solid ${statusColor};
          }
          .status-text {
            font-size: 16px;
            font-weight: bold;
            color: ${statusColor};
          }
          .amount-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
          }
          .amount-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 32px;
            font-weight: bold;
            color: #C40C02;
          }
          .details-grid {
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-label {
            font-weight: bold;
            color: #666;
          }
          .detail-value {
            color: #333;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .thank-you {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #C40C02;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">ARH MobileTopup</div>
          <div class="receipt-title">Transaction Receipt</div>
        </div>

        <div class="status-section">
          <div class="status-text">${statusText.toUpperCase()}</div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Total Amount</div>
          <div class="amount-value">${Number(amount).toFixed(2)} ${currency}</div>
        </div>

        <div class="details-grid">
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${transaction.txnNumber || transaction.id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date & Time:</span>
            <span class="detail-value">${formatDate(transaction.createdAt)}</span>
          </div>
          ${transactionType === 'stock' ? `
          <div class="detail-row">
            <span class="detail-label">Transaction Type:</span>
            <span class="detail-value">${transaction.type === "IN" ? "Stock In" : "Stock Out"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${transaction.type === "IN" ? "From" : "To"}:</span>
            <span class="detail-value">${transaction.type === "IN" ? transaction.from_wallet_id : transaction.to_wallet_id || "Activate Bundle"}</span>
          </div>
          ` : `
          <div class="detail-row">
            <span class="detail-label">Receiver:</span>
            <span class="detail-value">${transaction.receiver || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${serviceName}</span>
          </div>
          `}
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
          </div>
        </div>

        <div class="footer">
          <div class="thank-you">Thank you for your business!</div>
          <div>This is an automated receipt. Please keep it for your records.</div>
          <div>For support, contact: support@arh.com</div>
          <div>Generated on: ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadPDF = async () => {
    if (!transaction) return;
    
    try {
      setDownloading(true);
      
     
      const html = generatePDFHtml();
      const { uri } = await Print.printToFileAsync({ html });
 
      const fileName = `Receipt_${transaction.txnNumber || transaction.id}_${new Date().getTime()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });
      
      if (Platform.OS === 'ios') {

        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Receipt as PDF',
        });
      } else {
   
        const permission = await MediaLibrary.requestPermissionsAsync();
        
        if (permission.granted) {
          const asset = await MediaLibrary.createAssetAsync(newPath);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          Alert.alert('Success', 'Receipt saved to Downloads folder');
        } else {
   
          await Sharing.shareAsync(newPath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Receipt as PDF',
          });
        }
      }
      
   
      try {
        await FileSystem.deleteAsync(newPath);
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!transaction) return null;

  const serviceName = getServiceName(
    transactionType === 'stock' ? transaction.type : transaction.source || transaction.type,
    transactionType
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.receiptModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.receiptHeader}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.receiptTitle}>Receipt</Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={shareReceipt} 
                style={styles.headerActionButton}
                disabled={downloading}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={downloadPDF} 
                style={styles.headerActionButton}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.receiptContent}>
            <View style={styles.statusSection}>
              <View style={[
                styles.statusIconContainer,
                { backgroundColor: `${getStatusColor(transaction.status)}15` }
              ]}>
                <Ionicons 
                  name={getStatusIcon(transaction.status)} 
                  size={80} 
                  color={getStatusColor(transaction.status)} 
                />
              </View>
            </View>

            <View style={styles.topSection}>
              <Text style={styles.amountValueTop}>
                {transaction.status === 'succeeded' || transaction.status === 'completed' ? 
                  'Transaction Success' : 
                 transaction.status === 'failed' ? 'Transaction Failed' : 
                 'Processing Transaction'}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                  {transaction.txnNumber || transaction.id}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
              
              {transactionType === 'stock' ? (
                <>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Transaction Type</Text>
                    <Text style={styles.detailValue}>
                      {transaction.type === "IN" ? "Stock In" : "Stock Out"}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      {transaction.type === "IN" ? "From" : "To"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {transaction.type === "IN" ? 
                        transaction.from_wallet_id : 
                        transaction.to_wallet_id || "Activate Bundle"}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Receiver</Text>
                    <Text style={styles.detailValue}>
                      {transaction.receiver || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue}>
                      {serviceName}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>
                {transactionType === 'stock' ? 
                  `${transaction.type === "OUT" ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)} AF` :
                  `${Number(transaction.amount).toFixed(2)} ${transaction.currency || 'AFN'}`
                }
              </Text>
            </View>

            <View style={styles.additionalInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {transaction.status === 'succeeded' || transaction.status === 'completed' 
                    ? 'Your transaction was completed successfully.' 
                    : transaction.status === 'failed'
                    ? 'Your transaction failed. Please try again.'
                    : 'Your transaction is being processed.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.receiptActions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onClose}
              disabled={downloading}
            >
              <Text style={styles.primaryButtonText}>
                {downloading ? 'Generating PDF...' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function HomeMerchantScreen({ navigation }) {
  const { user, setUser } = useUser();
  const { t, i18n } = useTranslation();
  
  const [recentTransaction, setRecentTransactions] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]); 
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(user?.username || t('merchant'));
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      await getRecentTransactions();
      await getStockTransactions();
    };

    fetchData();
  }, []);

  const getRecentTransactions = async () => {
    const res = await getRecentOrdersOfAgent();
    console.log(res, "recent Transactions");
    setRecentTransactions(res?.data || []);
  };

  const getStockTransactions = async () => {
    const res = await getStockInOut();
    console.log(res, "stock transactions");
    setStockTransactions(res?.data || []);
  };

  useEffect(() => {
    if (user?.profileImg) {
      const fullImageUrl = user.profileImg.startsWith('http') 
        ? user.profileImg 
        : `http://3.67.144.22/backend/uploads/merchant_pictures/${user.profileImg}`;
      setProfileImage(fullImageUrl);
    }
  }, [user]);

  const services = useMemo(
    () => [
      {
        key: "StockTransfer",
        label: t('services.stockTransfer'),
        icon: <Image source={StockTransferIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("StockTransfer"),
      },
      {
        key: "MobileTopup",
        label: t('services.mobileTopup'),
        icon: <Image source={TopupIcon} style={{ width: 100, height: 100 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("Topup"),
      },
      { 
        key: "DataBundle", 
        label: t('services.dataBundle'), 
        icon: <Image source={BundleIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("DataMerchant"),
      },
      {
        key: "GameCoins",
        label: t('services.gameCoins'),
        icon: <Image source={GamesIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation, t]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getRecentTransactions(), getStockTransactions()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToProfile = () => navigation.navigate("MerchantProfile");

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return t('status.completed');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return capitalizeFirstLetter(status || 'pending');
    }
  };

  const getServiceName = (type) => {
    switch (type) {
      case 'recharge':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };


  const formatAF = (n) =>
    Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });


  const handleTransactionPress = (transaction, transactionType) => {
    setSelectedTransaction(transaction);
    setSelectedTransactionType(transactionType);
    setReceiptModalVisible(true);
  };


  const OrderTransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => handleTransactionPress(item, 'order')}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={item.type === 'recharge' ? 'phone-portrait-outline' : 'wifi-outline'} 
            size={20} 
            color={item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'} 
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {getServiceName(item?.type)}
          </Text>
          <Text style={styles.txSub}>{formatDateTime(item?.createdAt)}</Text>
          <Text style={styles.txPhone}>{item.receiver ? `(+93) ${item.receiver}` : 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[
          styles.txAmount,
          { color: item.status === 'succeeded' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item?.amount || 0).toFixed(2)} {item?.currency || 'USD'}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107' }
          ]}>
            {getStatusText(item?.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  const StockTransactionRow = ({ item }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => handleTransactionPress(item, 'stock')}
      activeOpacity={0.85}
    >
      <View style={styles.txLeft}>
        <View style={[
          styles.txIconWrap,
          item.type === "IN" ? styles.txInIcon : styles.txOutIcon,
        ]}>
          <Ionicons
            name={item.type === "IN" ? "arrow-down" : "arrow-up"}
            size={18}
            color={item.type === "IN" ? "#0BA360" : Colors.primary}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txTitle}>
            {item.type === "IN" ? "Stock In" : "Stock Out"}
          </Text>
          <Text style={styles.txSub}>
            {formatDateTime(item.createdAt)}
          </Text>
          <Text style={styles.txPhone}>
            {item.type === "IN" 
              ? `From ${item.from_wallet_id}` 
              : `To ${item.to_wallet_id || "Activate Bundle"}`}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: item.type === "IN" ? "#0BA360" : Colors.primary },
          ]}
        >
          {item.type === "OUT" ? "-" : "+"}
          {formatAF(Math.abs(item.amount))} AF
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.type === "IN" ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.type === "IN" ? '#0BA360' : Colors.primary }
          ]}>
            {item.type === "IN" ? "Received" : "Sent"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Combine and sort transactions by date (newest first)
  const allTransactions = useMemo(() => {
    const orders = recentTransaction.map(tx => ({ ...tx, transactionType: 'order' }));
    const stocks = stockTransactions.map(tx => ({ ...tx, transactionType: 'stock' }));
    
    return [...orders, ...stocks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10); // Show only latest 10 transactions
  }, [recentTransaction, stockTransactions]);

  const hasTransactions = allTransactions.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.svgContainer}>
          <HeaderBackgroundSVG width="100%" height="100%" />
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.userInfo} 
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatarImage}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                    setProfileImage(null);
                  }}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.greeting}>{t('greeting.hi')},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNotifications} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={s.onPress}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.promoBanner}
          onPress={() => navigation.navigate("MerchantAnalytics")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#C40C02', '#E48D08']}
            style={styles.promoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>{t('analytics.businessAnalytics')}</Text>
                <Text style={styles.promoSubtitle}>
                  {t('analytics.viewPerformance')}
                </Text>
              </View>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>{t('analytics.viewDashboard')}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
            <View style={styles.promoIcon}>
              <Ionicons name="bar-chart-outline" size={40} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{t('transactions.recent')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllTransactions")}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {!hasTransactions ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>{t('transactions.noTransactions')}</Text>
            </View>
          ) : (
            allTransactions.map((tx, index) => (
              tx.transactionType === 'order' ? 
                <OrderTransactionRow key={`order-${tx.id}-${index}`} item={tx} /> :
                <StockTransactionRow key={`stock-${tx.id}-${index}`} item={tx} />
            ))
          )}
        </View>
      </ScrollView>

      <ReceiptModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedTransaction}
        transactionType={selectedTransactionType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  header: {
    height: 150,
    position: 'relative', 
  },
  svgContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerContent: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    transform: [{ translateY: -24 }], 
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  promoBanner: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  promoGradient: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  promoContent: {
    flex: 1,
  },
  promoTextContainer: {
    marginBottom: 15,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 5,
  },
  promoIcon: {
    marginLeft: 10,
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    marginTop: 30,
    justifyContent: "space-between", 
    marginBottom: 10,
  },

  recentContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "#F3F3F3",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: { 
    color: Colors.textPrimary, 
    fontSize: 18, 
    fontWeight: "500" 
  },
  seeAll: { 
    color: Colors.primary, 
    fontSize: 14, 
    fontWeight: "600" 
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  txLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  txIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInIcon: {
    backgroundColor: "rgba(11, 163, 96, 0.1)",
  },
  txOutIcon: {
    backgroundColor: "rgba(215, 0, 0, 0.1)",
  },
  txInfo: {
    flex: 1,
  },
  txTitle: { 
    color: Colors.textPrimary, 
    fontSize: 16, 
    fontWeight: "600",
    textTransform: 'capitalize'
  },
  txSub: { 
    color: "#9E9E9E", 
    fontSize: 12, 
    marginTop: 2 
  },
  txPhone: { 
    color: "#9E9E9E", 
    fontSize: 12, 
    marginTop: 2 
  },
  txRight: { 
    alignItems: "flex-end" 
  },
  txAmount: { 
    fontSize: 16, 
    fontWeight: "700",
    marginBottom: 4
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'capitalize'
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#9E9E9E',
    fontSize: 14,
    marginTop: 8,
  },

  // Receipt Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptModalContainer: {
    width: '90%',
    maxWidth: 400,
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  receiptContent: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
  },
  amountValueTop: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.textPrimary,
  },
  detailsGrid: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  receiptActions: {
    padding: 20,
    paddingTop: 0,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});