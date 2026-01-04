import React, { useMemo, useState, useRef, useEffect } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share
} from "react-native";
import { Colors } from "../theme/colors";
import { TextInput } from "react-native";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useUser } from "../context/userContext";
import { transferApiToMainWallet } from "../services/merchantApi";
import { Ionicons } from "@expo/vector-icons";
import TopUpStyles from "./topupScreen/TopupStyle";
import { useModal } from "../hooks/useModal";
import ProgressModal from "../components/modals/ProgressModal";
import SuccessModal from "../components/modals/SuccessModal";
import { scale } from "../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function TransferToPrimaryScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const startBalance = route.params?.balance ?? 0;
  const [amount, setAmount] = useState(String(startBalance));
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [transferData, setTransferData] = useState(null);
  
  const {
    isProgressVisible,
    isSuccessVisible,
    showProgress,
    hideProgress,
    showSuccess,
    hideSuccess,
    autoProgressToSuccess,
    modalData
  } = useModal();

  const valid = useMemo(() => {
    const n = Number(amount.replace(/,/g, ""));
    return !Number.isNaN(n) && n > 0 && n <= startBalance;
  }, [amount, startBalance]);

  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  const handleAmountChange = (value) => {
    const formatted = formatAmount(value);
    setAmount(formatted);
  };

  const setMaxAmount = () => {
    setAmount(String(startBalance));
  };

  const transferApi = async () => {
    if (!valid) return;
    
    setLoading(true);
    try {
      const payload = {
        available_amount: false,
        amount: Number(amount)
      };

      const res = await transferApiToMainWallet(payload, user?.id);
      
      const transferDetails = {
        amount: Number(amount),
        transactionId: res?.transactionId || `TX${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromWallet: t('wallet.commissionWallet'),
        toWallet: t('wallet.primaryWallet'),
        user: user?.username || t('common.user')
      };
      
      setTransferData(transferDetails);
      
      autoProgressToSuccess(
        {
          title: t('transferToPrimary.processingTransfer'),
          message: t('transferToPrimary.transferringAmount', { amount: amount }),
          onCancel: handleTransferCancel
        },
        {
          title: t('transferToPrimary.transferSuccessful'),
          subtitle: t('transferToPrimary.transferSuccessMessage'),
          details: [
            {
              type: "amount",
              label: t('transferToPrimary.amountTransferred'),
              value: `${transferDetails.amount} AFN`
            },
            {
              type: "transaction",
              label: t('receipt.transactionId'),
              value: transferDetails.transactionId
            },
            {
              type: "time",
              label: t('transferToPrimary.completedAt'),
              value: new Date(transferDetails.timestamp).toLocaleTimeString()
            },
            {
              type: "from",
              label: t('transferToPrimary.from'),
              value: transferDetails.fromWallet
            },
            {
              type: "to",
              label: t('transferToPrimary.to'),
              value: transferDetails.toWallet
            }
          ],
          onShare: handleShareReceipt,
          onClose: handleSuccessClose
        },
        3000
      );
      
    } catch (error) {
      console.log("Transfer API error: ", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        t('transferToPrimary.transferFailed');
      
      Alert.alert(t('transferToPrimary.transferFailed'), message);
      setLoading(false);
    }
  };

  const handleTransferCancel = () => {
    hideProgress();
    setLoading(false);
  };

  const handleShareReceipt = async () => {
    try {
      if (!transferData) {
        Alert.alert(t('common.error'), t('transferToPrimary.noTransferData'));
        return;
      }

      const shareMessage = generateShareMessage(transferData);
      
      const result = await Share.share({
        message: shareMessage,
        title: t('transferToPrimary.transferReceipt')
      });

      if (result.action === Share.sharedAction) {
        console.log('Share was successful');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share was dismissed');
      }
    } catch (error) {
      console.log('Error sharing receipt:', error);
      Alert.alert(t('transferToPrimary.shareError'), t('transferToPrimary.shareFailed'));
    }
  };

  const generateShareMessage = (data) => {
    const { t } = useTranslation();
    const date = new Date(data.timestamp).toLocaleDateString();
    const time = new Date(data.timestamp).toLocaleTimeString();
    
    return `💰 ${t('transferToPrimary.transferReceipt')}

✅ ${t('transferToPrimary.transferSuccessful')}!

${t('amount')}: ${data.amount} AFN
${t('transferToPrimary.from')}: ${data.fromWallet}
${t('transferToPrimary.to')}: ${data.toWallet}
${t('receipt.transactionId')}: ${data.transactionId}
${t('receipt.date')}: ${date}
${t('receipt.time')}: ${time}
${t('transferToPrimary.user')}: ${data.user}

${t('transferToPrimary.thankYouMessage')} 🎉`;
  };

  const handleSuccessClose = () => {
    hideSuccess();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title={t('wallet.transferToPrimary')}
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ 
            paddingHorizontal: 24, 
            paddingTop: 16,
            paddingBottom: 30 
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
   
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('transferToPrimary.availableBalance')}</Text>
            <Text style={styles.balanceAmount}>{Number(startBalance).toFixed(2)} AFN</Text>
          </View>

     
          <View style={{ marginTop: 24 }}>
            <View style={TopUpStyles.editHeader}>
              <Text style={TopUpStyles.sectionTitle}>{t('transferToPrimary.transferAmount')}</Text>
              <TouchableOpacity onPress={setMaxAmount}>
                <Text style={TopUpStyles.editLink}>{t('transferToPrimary.max')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[
              TopUpStyles.customRow,
              {
                borderColor: isFocused ? Colors.primary : '#2e2e2eff',
                backgroundColor: '#FFFFFF',
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isFocused ? 0.15 : 0,
                shadowRadius: isFocused ? 10 : 0,
                elevation: isFocused ? 3 : 0,
              }
            ]}>
              <Text style={TopUpStyles.currencyTag}>AFN</Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                keyboardType="decimal-pad"
                style={TopUpStyles.customInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              
              {amount && (
                <TouchableOpacity
                  style={[TopUpStyles.clearBtn, { opacity: amount ? 1 : 0.5 }]}
                  disabled={!amount}
                  onPress={() => setAmount("")}
                >
                  <Ionicons name="close-circle" size={18} color="#A3A3A3" />
                </TouchableOpacity>
              )}
            </View>

            {/* Error Messages */}
            <View style={{ marginTop: 8, minHeight: 20 }}>
              {amount && Number(amount) > startBalance && (
                <Text style={styles.errorText}>
                  {t('transferToPrimary.exceedsBalance')}
                </Text>
              )}
              {amount && Number(amount) <= 0 && (
                <Text style={styles.errorText}>
                  {t('enterValidAmountGreaterThanZero')}
                </Text>
              )}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>{t('transferToPrimary.importantInfo')}</Text>
            </View>
            <Text style={styles.infoText}>
              {t('transferToPrimary.transferNote')}
            </Text>
          </View>

          {/* Transfer Button */}
          <PrimaryButton
            label={t('wallet.transferToPrimary')}
            onPress={transferApi}
            style={{ 
              marginTop: 32, 
              opacity: valid ? 1 : 0.5 
            }}
            loading={loading}
            disabled={!valid || loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>

  
      <ProgressModal
        visible={isProgressVisible}
        onCancel={handleTransferCancel}
        title={t('transferToPrimary.processingTransfer')}
        message={t('transferToPrimary.transferringAmount', { amount: amount })}
        duration={3000}
        onComplete={() => {}}
      />

      <SuccessModal
        visible={isSuccessVisible}
        onClose={handleSuccessClose}
        onShare={handleShareReceipt}
        title={t('transferToPrimary.transferSuccessful')}
        subtitle={t('transferToPrimary.transferSuccessMessage')}
        details={modalData?.details || []}
        primaryButtonText={t('common.continue')}
        shareButtonText={t('transferToPrimary.shareReceipt')}
        showConfetti={true}
        showAnimation={true}
        animationSize={120}
      />
    </SafeAreaView>
  );
}

const styles = {
  balanceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: scale.hp(1.05),
  },
  balanceLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(1.05),
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: scale.hp(3.65),
    fontWeight: '700',
    color: Colors.primary,
  },
  errorText: {
    fontSize: scale.hp(1.7),
    color: '#DC2626',
    fontWeight: '500',
  },
  infoCard: {
    marginTop: scale.hp(4.2),
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1.6),
    padding: scale.hp(2.1),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(1.05),
  },
  infoTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: scale.wp(2.1),
  },
  infoText: {
    fontSize: scale.hp(1.7),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.6),
  },
};