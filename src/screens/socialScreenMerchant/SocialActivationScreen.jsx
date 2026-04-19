import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import ServiceHeader from "../../components/ServiceHeader";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";
import { 
  activateSocialBundleByAgent,
 getOrderStatus 
} from "../../services/merchantApi";
import { validatePromoCode } from "../../services/promoCodeApi";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get('window');

const ORDER_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export default function SocialActivationMerchantScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { product, customer } = route?.params || {};
  
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [receiver, setReceiver] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const successLottieRef = useRef(null);
  const errorLottieRef = useRef(null);
  const pollingRef = useRef(null);
  
  const baseUsdAmount = parseFloat(product?.totalAmountInProductCurrency || product?.price || 0);
  const totalAmount = parseFloat(baseUsdAmount).toFixed(2);

  useEffect(() => {
    const newFinalAmount = Math.max(0, baseUsdAmount - discountAmount);
    setFinalAmount(parseFloat(newFinalAmount.toFixed(2)));
  }, [discountAmount, baseUsdAmount]);

  useEffect(() => {
    if (orderStatus === ORDER_STATUS.SUCCEEDED && successLottieRef.current) {
      successLottieRef.current.play();
    }
    if (orderStatus === ORDER_STATUS.FAILED && errorLottieRef.current) {
      errorLottieRef.current.play();
    }
  }, [orderStatus]);

  // Clean up on unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [])
  );

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError(t('promoCode.enterCode'));
      return;
    }

    setValidatingPromo(true);
    setPromoError("");

    try {
      const response = await validatePromoCode({
        code: promoCode.trim(),
        orderAmount: parseFloat(product?.price || 0)
      });

      if (response.status) {
        let discount = 0;
        
        if (response.discount_type === 'percentage') {
          discount = (baseUsdAmount * response.discount_value) / 100;
        } else {
          discount = response.discount_value;
        }

        if (response.max_discount && discount > response.max_discount) {
          discount = response.max_discount;
        }

        setDiscountAmount(discount);
        setAppliedPromoCode({
          code: promoCode.trim(),
          discount_type: response.discount_type,
          discount_value: response.discount_value,
          discount_amount: discount
        });
        
        setPromoModalVisible(false);
        Alert.alert(t('success'), t('promoCode.appliedSuccessfully'));
      } else {
        setPromoError(response.error || t('promoCode.invalidCode'));
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError(t('promoCode.validationError'));
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setPromoCode("");
    setPromoError("");
  };

  const startPollingOrderStatus = async (orderId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60;

    pollingRef.current = setInterval(async () => {
      try {
        pollCount++;
        const statusResponse = await getOrderStatus (orderId);
        const currentStatus = statusResponse.data?.status;
        
        console.log(`Poll ${pollCount}: Order status:`, currentStatus);
        

        setOrderStatus(currentStatus);
        setOrderDetails(prev => ({
          ...prev,
          ...statusResponse.data,
          _updatedAt: Date.now() // Force update
        }));

        console.log('Updated order status:', currentStatus);
        console.log('Order details:', statusResponse.data);

        if (
          currentStatus === ORDER_STATUS.SUCCEEDED || 
          currentStatus === ORDER_STATUS.FAILED || 
          currentStatus === ORDER_STATUS.CANCELLED ||
          pollCount >= maxPolls
        ) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          
          if (pollCount >= maxPolls) {
            console.log("Max polling attempts reached");
            setOrderStatus(ORDER_STATUS.FAILED);
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 3000);
  };

  const validateReceiver = () => {
    if (!receiver.trim()) {
      Alert.alert(t('error'), t('enterSocialId'));
      return false;
    }
    
    if (receiver.length < 3) {
      Alert.alert(t('error'), t('invalidSocialId'));
      return false;
    }
    
    return true;
  };

  const activateSocialProduct = async () => {
    if (!validateReceiver()) return;
    
    setLoading(true);
    
    try {
      const payload = {
        productId: product.id,
        receiver: receiver.trim(),
        promoCode: appliedPromoCode?.code || null,
        finalDiscountAmount: finalAmount,
        promoDiscountAmount: discountAmount,
      };

      console.log("Sending social activation payload:", payload);

      const response = await activateSocialBundleByAgent(payload);
      
      console.log("Social activation response:", response);
      
      if (response.success === true) {
        const orderData = {
          orderId: response.orderId,
          txnNumber: response.txnNumber,
          playerId: receiver,
          amount: totalAmount,
          finalAmount: finalAmount,
          discountAmount: discountAmount,
          promoCode: appliedPromoCode?.code,
          date: new Date().toISOString(),
          productName: product?.productName || product?.name,
          productImage: product?.image,
        };

        setOrderStatus(ORDER_STATUS.PENDING);
        setOrderDetails(orderData);
        
        if (response.orderId) {
          await startPollingOrderStatus(response.orderId);
        }
        
        Alert.alert(
          t('success'),
          response.message || t('socialActivationInitiated'),
          [{ text: 'OK', onPress: () => {} }]
        );
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error(t('activationFailed'));
      }

    } catch (error) {
      console.log("Activation error: ", error);
      const message = error.response?.data?.error || error.message || t('activationFailed');
      
      setOrderStatus(ORDER_STATUS.FAILED);
      setOrderDetails(prev => ({
        ...prev,
        error: message,
      }));
      
      Alert.alert(t('error'), message);
    }
    setLoading(false);
  };

  const resetFlow = () => {
    setOrderStatus(null);
    setOrderDetails(null);
    setReceiver("");
    setAppliedPromoCode(null);
    setDiscountAmount(0);
    setFinalAmount(baseUsdAmount);
    setPromoCode("");
    setPromoError("");
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case ORDER_STATUS.PENDING:
        return "Your social activation request has been submitted. Amount will be deducted from your wallet and processed shortly.";
      case ORDER_STATUS.SUCCEEDED:
        return "Social product activated successfully!";
      case ORDER_STATUS.FAILED:
        return orderDetails?.error || "Social activation failed. Please contact support if this continues.";
      case ORDER_STATUS.CANCELLED:
        return "Social activation was cancelled.";
      default:
        return "Processing your request...";
    }
  };

  const getStatusTitle = () => {
    switch (orderStatus) {
      case ORDER_STATUS.PENDING:
        return "Request Submitted";
      case ORDER_STATUS.SUCCEEDED:
        return "Activation Successful!";
      case ORDER_STATUS.FAILED:
        return "Activation Failed";
      case ORDER_STATUS.CANCELLED:
        return "Activation Cancelled";
      default:
        return "Processing";
    }
  };

  const getStatusColor = () => {
    switch (orderStatus) {
      case ORDER_STATUS.PENDING:
        return "#FFA500";
      case ORDER_STATUS.SUCCEEDED:
        return "#28A745";
      case ORDER_STATUS.FAILED:
        return "#DC3545";
      case ORDER_STATUS.CANCELLED:
        return "#6C757D";
      default:
        return "#6C757D";
    }
  };

  const getImageUrl = () => {
    if (product?.image) {
      if (product.image.startsWith('http')) {
        return product.image;
      } else {
        const encodedImage = encodeURIComponent(product.image);
        return `http://3.67.144.22/backend/uploads/product_images/${encodedImage}`;
      }
    }
    return null;
  };

  const OrderStatusScreen = () => {
    console.log('Rendering OrderStatusScreen with status:', orderStatus);
    
    return (
      <ScrollView
        contentContainerStyle={styles.statusContainer}
      >
        <View style={styles.statusHeader}>
          {orderStatus === ORDER_STATUS.SUCCEEDED ? (
            <LottieView
              ref={successLottieRef}
              source={require('../../../assets/lotties/succcess.json')}
              autoPlay={true}
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={() => {
                console.log('Success animation finished');
              }}
            />
          ) : orderStatus === ORDER_STATUS.FAILED ? (
            <LottieView
              ref={errorLottieRef}
              source={require('../../../assets/lotties/error.json')} 
              autoPlay={true}
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={() => {
                console.log('Error animation finished');
              }}
            />
          ) : (
            <View style={[styles.statusIcon, { 
              backgroundColor: orderStatus === ORDER_STATUS.PENDING ? '#FFF3CD' : '#E2E3E5',
              borderColor: orderStatus === ORDER_STATUS.PENDING ? '#FFEAA7' : '#D6D8DB'
            }]}>
              <Ionicons 
                name={orderStatus === ORDER_STATUS.PENDING ? "time-outline" : "help-circle"} 
                size={36} 
                color={orderStatus === ORDER_STATUS.PENDING ? "#FFA500" : "#6C757D"} 
              />
            </View>
          )}
          
          <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
            {getStatusTitle()}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Social ID</Text>
            <Text style={styles.detailValue}>{orderDetails?.playerId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Social Product</Text>
            <Text style={styles.detailValue}>
              {orderDetails?.productName || product?.productName || product?.name}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{orderDetails?.txnNumber}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {orderDetails?.date ? new Date(orderDetails.date).toLocaleString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <View>
              <Text style={styles.amountValue}>{finalAmount.toFixed(2)} AFN</Text>
              {appliedPromoCode && (
                <Text style={[styles.detailValue, { fontSize: 14, textAlign: 'center', color: '#10B981' }]}>
                  Saved: {discountAmount.toFixed(2)} AFN
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.statusMessageContainer}>
          <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        </View>

        {orderStatus === ORDER_STATUS.PENDING && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: '60%',
                    backgroundColor: getStatusColor()
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Processing your request...
            </Text>
          </View>
        )}

        {(orderStatus === ORDER_STATUS.SUCCEEDED || 
          orderStatus === ORDER_STATUS.FAILED || 
          orderStatus === ORDER_STATUS.CANCELLED) && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
              }
              navigation.popToTop();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={resetFlow} style={styles.moreButton}>
          <Text style={styles.moreButtonText}>
            {orderStatus === ORDER_STATUS.FAILED || orderStatus === ORDER_STATUS.CANCELLED 
              ? "Try Again" 
              : "Activate More"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Show status screen when orderStatus is not null
  if (orderStatus !== null) {
    console.log('Showing status screen with orderStatus:', orderStatus);
    return (
      <SafeAreaView style={styles.container}>
        <ServiceHeader 
          title={t("socialActivation") || "Social Activation"} 
          onBack={resetFlow}
        />
        <OrderStatusScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t("socialActivation") || "Social Activation"} 
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
     
      

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {t("socialId") || "Social ID/Username"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("enterSocialId") || "Enter social ID or username"}
            placeholderTextColor={Colors.textSecondary}
            value={receiver}
            onChangeText={setReceiver}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

 
        <View style={styles.promoSection}>
          {appliedPromoCode ? (
            <View style={styles.appliedPromoContainer}>
              <View style={styles.appliedPromoInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.appliedPromoText}>
                  {t('promoCode.applied') || "Promo Applied"}: {appliedPromoCode.code}
                </Text>
                <Text style={styles.discountText}>
                  -{appliedPromoCode.discount_amount?.toFixed(2) || discountAmount.toFixed(2)} AFN
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemovePromoCode} style={styles.removePromoButton}>
                <Text style={styles.removePromoText}>{t('promoCode.remove') || "Remove"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.promoButton} 
              onPress={() => setPromoModalVisible(true)}
            >
              <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              <Text style={styles.promoButtonText}>{t('promoCode.havePromoCode') || "Have a promo code?"}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {t("orderSummary") || "Order Summary"}
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{t("product") || "Product"}</Text>
            <Text style={styles.summaryValue}>{product?.productName || product?.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{t("socialId") || "Social ID"}</Text>
            <Text style={styles.summaryValue}>{receiver || t("notSet") || "Not set"}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{t("baseAmount") || "Base Amount"}</Text>
            <Text style={styles.summaryValue}>{totalAmount} AFN</Text>
          </View>
          
          {appliedPromoCode && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>{t("promoCode.discount") || "Discount"}</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                -{appliedPromoCode.discount_amount?.toFixed(2) || discountAmount.toFixed(2)} AFN
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>
              {t("totalAmount") || "Total Amount"}
            </Text>
            <Text style={styles.totalValue}>
              {finalAmount.toFixed(2)} AFN
            </Text>
          </View>
        </View>
      </ScrollView>


      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.activateButton,
            (!receiver.trim() || loading) && styles.activateButtonDisabled
          ]}
          onPress={activateSocialProduct}
          disabled={!receiver.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.activateButtonText}>
              {t("activateNow") || "Activate Now"} - {finalAmount.toFixed(2)} AFN
            </Text>
          )}
        </TouchableOpacity>
      </View>

    
      <Modal
        visible={promoModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setPromoModalVisible(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>{t('promoCode.applyPromo') || "Apply Promo Code"}</Text>
              <TouchableOpacity 
                onPress={() => setPromoModalVisible(false)} 
                style={modalStyles.closeButton}
              >
                <Text style={modalStyles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.promoInputContainer}>
              <TextInput
                style={modalStyles.promoInput}
                placeholder={t('promoCode.enterCodePlaceholder') || "Enter promo code"}
                value={promoCode}
                onChangeText={setPromoCode}
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoFocus={true}
              />
            </View>

            {promoError ? (
              <View style={modalStyles.errorContainer}>
                <Text style={modalStyles.errorText}>{promoError}</Text>
              </View>
            ) : null}

            <View style={modalStyles.modalButtons}>
              <TouchableOpacity 
                style={[modalStyles.modalButton, modalStyles.cancelButton]} 
                onPress={() => setPromoModalVisible(false)}
                disabled={validatingPromo}
              >
                <Text style={modalStyles.cancelButtonText}>{t('cancel') || "Cancel"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  modalStyles.modalButton, 
                  modalStyles.applyButton, 
                  (!promoCode.trim() || validatingPromo) && modalStyles.disabledButton
                ]} 
                onPress={handleApplyPromoCode}
                disabled={!promoCode.trim() || validatingPromo}
              >
                {validatingPromo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.applyButtonText}>{t('promoCode.apply') || "Apply"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginBottom: 110,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale.wp(4),
    paddingBottom: scale.hp(16),
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: scale.wp(3),
    padding: scale.wp(4),
    marginTop: scale.hp(2),
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: scale.wp(40),
    height: scale.wp(40),
    borderRadius: scale.wp(2),
    marginBottom: scale.hp(2),
  },
  productImagePlaceholder: {
    width: scale.wp(40),
    height: scale.wp(40),
    borderRadius: scale.wp(2),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  productName: {
    fontSize: scale.hp(2.2),
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: scale.hp(1),
  },
  productDescription: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale.hp(2),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: Colors.primary,
  },
  inputSection: {
    marginTop: scale.hp(3),
  },
  sectionTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale.wp(2),
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1.5),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
  inputHelp: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
  },
  paymentInfoSection: {
    marginTop: scale.hp(3),
  },
  walletInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: scale.wp(4),
    borderRadius: scale.wp(2),
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  walletInfoText: {
    fontSize: scale.hp(1.6),
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: scale.wp(2),
    flex: 1,
  },
  promoSection: {
    marginTop: scale.hp(3),
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(4),
    borderRadius: scale.wp(2),
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  promoButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.6),
    fontWeight: '600',
    marginLeft: scale.wp(2),
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale.hp(1.5),
    borderRadius: scale.wp(2),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoText: {
    color: '#065F46',
    fontSize: scale.hp(1.6),
    fontWeight: '600',
    marginLeft: scale.wp(2),
    marginRight: scale.wp(2),
  },
  discountText: {
    color: '#10B981',
    fontSize: scale.hp(1.6),
    fontWeight: '700',
  },
  removePromoButton: {
    padding: scale.hp(0.5),
  },
  removePromoText: {
    color: '#EF4444',
    fontSize: scale.hp(1.4),
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: scale.wp(3),
    padding: scale.wp(4),
    marginTop: scale.hp(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryKey: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: scale.hp(1.6),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.5),
    marginTop: scale.hp(1),
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalKey: {
    fontSize: scale.hp(1.8),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: scale.hp(2),
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(2),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: scale.hp(2),
  },
  activateButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.wp(2),
    paddingVertical: scale.hp(1.8),
    alignItems: 'center',
  },
  activateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  activateButtonText: {
    color: '#fff',
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  // Status Screen Styles
  statusContainer: {
    paddingHorizontal: scale.wp(4),
    paddingTop: scale.hp(4),
    paddingBottom: scale.hp(16),
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: scale.hp(4),
  },
  statusIcon: {
    width: scale.wp(20),
    height: scale.wp(20),
    borderRadius: scale.wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: scale.hp(2),
  },
  lottieAnimation: {
    width: scale.wp(40),
    height: scale.wp(40),
    marginBottom: scale.hp(2),
  },
  statusTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: scale.wp(3),
    padding: scale.wp(4),
    marginBottom: scale.hp(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: scale.hp(1.6),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: scale.hp(2),
    paddingTop: scale.hp(2),
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  amountLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(1),
  },
  amountValue: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: Colors.primary,
  },
  statusMessageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: scale.wp(3),
    padding: scale.wp(4),
    marginBottom: scale.hp(3),
  },
  statusMessage: {
    fontSize: scale.hp(1.6),
    lineHeight: scale.hp(2.2),
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: scale.hp(3),
  },
  progressBar: {
    width: '100%',
    height: scale.hp(0.8),
    backgroundColor: '#E5E7EB',
    borderRadius: scale.wp(1),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale.wp(1),
  },
  progressText: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    marginTop: scale.hp(1),
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.wp(2),
    paddingVertical: scale.hp(1.8),
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  doneButtonText: {
    color: '#fff',
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  moreButton: {
    paddingVertical: scale.hp(1.5),
    alignItems: 'center',
  },
  moreButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.6),
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2),
    padding: scale.hp(2.5),
    width: '100%',
    maxWidth: scale.wp(90),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2),
    paddingBottom: scale.hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  closeButtonText: {
    fontSize: scale.hp(2.5),
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  promoInputContainer: {
    marginBottom: scale.hp(2),
  },
  promoInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale.hp(1),
    padding: scale.hp(1.5),
    fontSize: scale.hp(1.75),
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: scale.hp(1),
    borderRadius: scale.hp(0.75),
    marginBottom: scale.hp(2),
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: scale.hp(1.5),
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scale.wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scale.hp(1.5),
    borderRadius: scale.hp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: scale.hp(1.75),
    fontWeight: '600',
  },
});