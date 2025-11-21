import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Alert,
  Share,
  StyleSheet,
  Image,
  Platform,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from "../../theme/colors";
import { useTranslation } from 'react-i18next';
import { scale } from '../../utils/normalizeSize';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const ReceiptModal1 = ({ visible, onClose, transaction }) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const { t } = useTranslation();
  const lottieRef = useRef(null);
  const receiptCaptureRef = useRef(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
      
      if (lottieRef.current) {
        lottieRef.current.play();
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(status === 'granted');
    })();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#6B7280';
    }
  };

  const getStatusAnimation = () => {
    if (!transaction) return null;

    switch (transaction.status) {
      case 'succeeded':
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/succcess.json')}
            autoPlay={true}
            loop={false}
            style={styles.successAnimation}
          />
        );
      case 'failed':
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/error.json')}
            autoPlay={true}
            loop={false}
            style={styles.errorAnimation}
          />
        );
      case 'pending':
        return (
          <LottieView
            ref={lottieRef}
            source={require('../../../assets/lotties/loading.json')}
            autoPlay={true}
            loop={true}
            style={styles.pendingAnimation}
          />
        );
      default:
        return (
          <View style={[
            styles.receiptStatusIconContainer,
            { backgroundColor: `${getStatusColor(transaction.status)}15` }
          ]}>
            <Ionicons 
              name="help-circle" 
              size={80} 
              color={getStatusColor(transaction.status)} 
            />
          </View>
        );
    }
  };

  const getStatusTitle = () => {
    if (!transaction) return '';
    
    switch (transaction.status) {
      case 'succeeded':
        return t('receipt.topupSuccessful');
      case 'failed':
        return t('receipt.topupFailed');
      case 'pending':
        return t('receipt.processingTopup');
      default:
        return t('receipt.transactionDetails');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded':
        return t('status.succeeded');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return status;
    }
  };

  const getServiceName = (source) => {
    switch (source) {
      case 'stripe_card':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
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

  const captureReceipt = async () => {
    try {
      setIsCapturing(true);
      
      // Wait a bit for the component to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (receiptCaptureRef.current) {
        console.log('Capturing receipt...');
        const uri = await captureRef(receiptCaptureRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        
        console.log('Receipt captured successfully:', uri);
        return uri;
      } else {
        console.error('Receipt content ref is not available');
        throw new Error('Receipt capture ref not available');
      }
    } catch (error) {
      console.error('Error capturing receipt:', error);
      throw error;
    } finally {
      setIsCapturing(false);
    }
  };

  const shareReceipt = async () => {
    try {
      if (isCapturing) {
        Alert.alert(t('receipt.pleaseWait'), t('receipt.preparingReceipt'));
        return;
      }

      console.log('Starting receipt capture for sharing...');
      const receiptUri = await captureReceipt();
      
      if (receiptUri) {
        console.log('Sharing receipt URI:', receiptUri);
        
        // Try direct sharing first without file copying
        if (await Sharing.isAvailableAsync()) {
          console.log('Using expo-sharing directly...');
          await Sharing.shareAsync(receiptUri, {
            mimeType: 'image/png',
            dialogTitle: t('receipt.shareReceipt'),
            UTI: 'public.png'
          });
        } else {
          // Fallback to React Native Share API with proper URI formatting
          console.log('expo-sharing not available, using React Native Share...');
          
          // For Android, we need to use content:// URI or file:// URI
          let shareUri = receiptUri;
          if (Platform.OS === 'android') {
            // On Android, try both formats
            if (!receiptUri.startsWith('file://') && !receiptUri.startsWith('content://')) {
              shareUri = `file://${receiptUri}`;
            }
          } else {
            // On iOS, ensure file:// prefix
            if (!receiptUri.startsWith('file://')) {
              shareUri = `file://${receiptUri}`;
            }
          }

          const shareOptions = {
            url: shareUri,
            type: 'image/png',
            title: t('receipt.shareReceipt')
          };

          await Share.share(shareOptions);
        }
        
      } else {
        throw new Error('Failed to capture receipt');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      
  
      console.log('Image sharing failed, falling back to text sharing');
      const receiptText = `
🎫 ${t('receipt.transactionReceipt')}
${t('receipt.totalAmount')}: ${Number(transaction.amount).toFixed(2)} ${transaction.currency}
${t('receipt.receiver')}: ${transaction.receiver}
${t('receipt.status')}: ${getStatusText(transaction.status)}
${t('receipt.dateTime')}: ${formatDate(transaction.createdAt)}
${t('receipt.transactionId')}: ${transaction.txnNumber}

${t('receipt.thankYou')}
      `.trim();

      await Share.share({
        message: receiptText,
        title: t('receipt.transactionReceipt'),
      });
    }
  };

  const downloadReceipt = async () => {
    try {
      if (isCapturing) {
        Alert.alert(t('receipt.pleaseWait'), t('receipt.preparingReceipt'));
        return;
      }

      if (!hasMediaPermission) {
        Alert.alert(
          t('receipt.permissionRequired'),
          t('receipt.grantPermission'),
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('Starting receipt capture for download...');
      const receiptUri = await captureReceipt();
      
      if (receiptUri) {
        console.log('Downloading receipt:', receiptUri);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Receipt-${transaction.txnNumber}-${timestamp}.png`;
        
        const asset = await MediaLibrary.createAssetAsync(receiptUri);
        const album = await MediaLibrary.getAlbumAsync('Receipts');
        
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Receipts', asset, false);
        }
        
        Alert.alert(
          t('receipt.downloadSuccess'),
          t('receipt.downloadSuccessMessage'),
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to capture receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert(
        t('receipt.downloadError'),
        t('receipt.downloadErrorMessage'),
        [{ text: 'OK' }]
      );
    }
  };

  const ReceiptContent = React.forwardRef((props, ref) => (
    <ImageBackground 
      source={require('../../../assets/Receipt.png')}
      style={styles.receiptCaptureContainer}
      resizeMode="cover"
      imageStyle={styles.captureBackgroundImage}
    >
      <View ref={ref} style={styles.receiptCaptureContent}>
        <View style={styles.captureHeader}>
          <Image
            source={require('../../../assets/logoV.png')} 
            style={styles.captureLogo}
            resizeMode="contain"
          />
          <Text style={styles.captureTitle}>{t('receipt.transactionReceipt').toUpperCase()}</Text>
        </View>

        <View style={styles.captureStatusSection}>
          <Text style={styles.captureStatusTitle}>
            {getStatusTitle()}
          </Text>
        </View>

        <View style={styles.captureDetails}>
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>{t('receipt.transactionId')}:</Text>
            <Text style={styles.captureDetailValue}>{transaction.txnNumber}</Text>
          </View>
          
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>{t('receipt.dateTime')}:</Text>
            <Text style={styles.captureDetailValue}>{formatDate(transaction.createdAt)}</Text>
          </View>
          
          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>{t('receipt.receiver')}:</Text>
            <Text style={styles.captureDetailValue}>{transaction.receiver}</Text>
          </View>

          <View style={styles.captureDetailRow}>
            <Text style={styles.captureDetailLabel}>{t('receipt.status')}:</Text>
            <Text style={[styles.captureDetailValue, { color: getStatusColor(transaction.status) }]}>
              {getStatusText(transaction.status)}
            </Text>
          </View>
        </View>

        <View style={styles.captureAmountSection}>
          <Text style={styles.captureAmountLabel}>{t('receipt.totalAmount').toUpperCase()}</Text>
          <Text style={styles.captureAmountValue}>
            {Number(transaction.amount).toFixed(2)} {transaction.currency}
          </Text>
        </View>

        <View style={styles.captureFooter}>
          <Text style={styles.captureFooterText}>{t('receipt.thankYou')}</Text>
        </View>
      </View>
    </ImageBackground>
  ));

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.receiptModalOverlay}>
        <TouchableOpacity 
          style={styles.receiptModalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.receiptModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >

          <ImageBackground 
            source={require('../../../assets/Receipt.png')} 
            style={styles.modalBackground}
            resizeMode="cover"
            imageStyle={styles.modalBackgroundImage}
          >
            <View style={styles.hiddenCaptureView}>
              <ReceiptContent ref={receiptCaptureRef} />
            </View>

            <View style={styles.receiptHeader}>
              <View style={styles.receiptHeaderLeft}>
                <TouchableOpacity onPress={onClose} style={styles.receiptCloseButton}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.receiptHeaderCenter}>
                <Text style={styles.receiptTitle}>{t('receipt.title')}</Text>
              </View>
              
              <View style={styles.receiptHeaderRight}>
                <TouchableOpacity 
                  onPress={shareReceipt} 
                  style={styles.receiptHeaderActionButton}
                  disabled={isCapturing}
                >
                  <Ionicons name="share-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={downloadReceipt} 
                  style={styles.receiptHeaderActionButton}
                  disabled={isCapturing}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.receiptContent} showsVerticalScrollIndicator={false}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/logoV.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View> 
              
              <View style={styles.receiptStatusSection}>
                {getStatusAnimation()}
                <Text style={styles.receiptAmountValueTop}>
                  {getStatusTitle()}
                </Text>
              </View>

              <View style={styles.receiptDetailsGrid}>
                <View style={styles.receiptDetailItem}>
                  <Text style={styles.receiptDetailLabel}>{t('receipt.transactionId')}</Text>
                  <Text style={styles.receiptDetailValue} numberOfLines={1} ellipsizeMode="middle">
                    {transaction.txnNumber}
                  </Text>
                </View>
                
                <View style={styles.receiptDetailItem}>
                  <Text style={styles.receiptDetailLabel}>{t('receipt.dateTime')}</Text>
                  <Text style={styles.receiptDetailValue}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                
                <View style={styles.receiptDetailItem}>
                  <Text style={styles.receiptDetailLabel}>{t('receipt.receiver')}</Text>
                  <Text style={styles.receiptDetailValue}>
                    {transaction.receiver}
                  </Text>
                </View>

                <View style={styles.receiptAmountSection}>
                  <Text style={styles.receiptAmountLabel}>{t('receipt.totalAmount')}</Text>
                  <Text style={styles.receiptAmountValue}>
                    {Number(transaction.amount).toFixed(2)} {transaction.currency}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.receiptActions}>
              <TouchableOpacity 
                style={[
                  styles.receiptPrimaryButton,
                  isCapturing && styles.receiptButtonDisabled
                ]}
                onPress={onClose}
                disabled={isCapturing}
              >
                <Text style={styles.receiptPrimaryButtonText}>
                  {isCapturing ? t('receipt.processing') : t('receipt.done')}
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  receiptModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptModalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(1.25),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2.5),
    elevation: 10,
  },
  modalBackground: {
    flex: 1,
    width: '100%',
  },
  modalBackgroundImage: {
    opacity: 0.03,
  },
  hiddenCaptureView: {
    position: 'absolute',
    left: scale.wp(5),
    top: -scale.hp(125),
    width: scale.wp(90),
    opacity: 1,
  },
  receiptCaptureContainer: {
    width: scale.wp(90),
    backgroundColor: 'transparent',
    padding: scale.hp(3),
    borderRadius: scale.hp(1.5),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(1),
    elevation: 5,
    overflow: 'hidden',
  },
  receiptCaptureContent: {
    // Content container
  },
  captureBackgroundImage: {
    opacity: 0.05, 
    borderRadius: scale.hp(1.5),
  },
  captureHeader: {
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: scale.hp(2),
  },
  captureLogo: {
    width: scale.wp(50),
    height: scale.hp(6.25),
    marginBottom: scale.hp(1.25),
  },
  captureTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  captureStatusSection: {
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
  },
  captureStatusTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  captureDetails: {
    marginBottom: scale.hp(2.5),
  },
  captureDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.25),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  captureDetailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  captureDetailValue: {
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  captureAmountSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: scale.hp(1),
    padding: scale.hp(2.5),
    marginBottom: scale.hp(2.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  captureAmountLabel: {
    fontSize: scale.hp(2),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: scale.hp(1),
  },
  captureAmountValue: {
    fontSize: scale.hp(3),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  captureFooter: {
    alignItems: 'center',
    paddingTop: scale.hp(2),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  captureFooterText: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: scale.hp(0.625),
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(3.75),
    paddingBottom: scale.hp(1.75),
    backgroundColor: Colors.primary,
    borderTopLeftRadius: scale.hp(3),
    borderTopRightRadius: scale.hp(3),
  },
  receiptHeaderLeft: {
    flex: 1,
  },
  receiptHeaderCenter: {
    flex: 2,
    alignItems: 'center',
  },
  receiptHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  receiptCloseButton: {
    width: scale.wp(8),
    height: scale.wp(8),
    borderRadius: scale.wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptHeaderActionButton: {
    width: scale.wp(9),
    height: scale.wp(9),
    borderRadius: scale.wp(4.5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale.wp(2),
  },
  receiptTitle: {
    fontSize: scale.hp(2.25),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  receiptContent: {
    flex: 1,
    padding: scale.hp(2.5),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
  },
  logoImage: {
    width: scale.wp(75),
    height: scale.hp(8.75),
  },
  receiptStatusSection: {
    alignItems: 'center',
  },
  receiptStatusIconContainer: {
    width: scale.wp(25),
    height: scale.wp(25),
    borderRadius: scale.wp(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  successAnimation: {
    width: scale.wp(50),
    height: scale.wp(50),
  },
  errorAnimation: {
    width: scale.wp(50),
    height: scale.wp(50),
  },
  pendingAnimation: {
    width: scale.wp(50),
    height: scale.wp(50),
  },
  receiptAmountValueTop: {
    fontSize: scale.hp(3),
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: scale.hp(3),
    color: Colors.textPrimary,
  },
  receiptDetailsGrid: {
    marginBottom: scale.hp(3),
  },
  receiptDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptDetailLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    flex: 1,
  },
  receiptDetailValue: {
    fontSize: scale.hp(1.75),
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  receiptAmountSection: {
    alignItems: 'center',
    marginTop: scale.hp(1.875),
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: scale.hp(1.5),
    padding: scale.hp(2),
  },
  receiptAmountLabel: {
    fontSize: scale.hp(1.75),
    color: '#6B7280',
    marginBottom: scale.hp(0.5),
  },
  receiptAmountValue: {
    fontSize: scale.hp(3),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  receiptActions: {
    padding: scale.hp(2.5),
    paddingTop: 0,
  },
  receiptPrimaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: scale.hp(1.75),
    borderRadius: scale.hp(12.5),
    width: '100%',
    marginBottom: scale.hp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  receiptPrimaryButtonText: {
    color: '#fff',
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
});

export default ReceiptModal1;