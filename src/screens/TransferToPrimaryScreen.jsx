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


export default function TransferToPrimaryScreen({ navigation, route }) {
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
        timestamp: new Date().toISOString()
      };
      
      setTransferData(transferDetails);
      
   
      autoProgressToSuccess(
 
        {
          title: "Processing Transfer",
          message: `Transferring ${amount} AFN to your primary wallet...`,
          onCancel: handleTransferCancel
        },
        {
          title: "Transfer Successful!",
          subtitle: "Your funds have been transferred successfully",
          details: [
            {
              type: "amount",
              label: "Amount Transferred",
              value: `${transferDetails.amount} AFN`
            },
            {
              type: "transaction",
              label: "Transaction ID",
              value: transferDetails.transactionId.substring(0, 12) + '...'
            },
            {
              type: "time",
              label: "Completed At",
              value: new Date(transferDetails.timestamp).toLocaleTimeString()
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
        "Failed to transfer to main wallet";
      
      Alert.alert("Transfer Failed", message);
      setLoading(false);
    }
  };

  const handleTransferCancel = () => {
    hideProgress();
    setLoading(false);
  };

  const handleShareReceipt = () => {
    // Add your share functionality here
    console.log("Share receipt:", transferData);
    // You can use Share API or any other sharing method
    // Share.share({ message: `Transfer receipt: ${transferData.amount} AFN` });
  };

  const handleSuccessClose = () => {
    hideSuccess();
    navigation.replace("TransferToPrimarySuccess", {
      amount: transferData?.amount,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader
        title="Transfer To Primary Wallet"
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
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{startBalance} AFN</Text>
          </View>

    
          <View style={{ marginTop: 24 }}>
            <View style={TopUpStyles.editHeader}>
              <Text style={TopUpStyles.sectionTitle}>Transfer Amount</Text>
              <TouchableOpacity onPress={setMaxAmount}>
                <Text style={TopUpStyles.editLink}>Max</Text>
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

        
            <View style={{ marginTop: 8, minHeight: 20 }}>
              {amount && Number(amount) > startBalance && (
                <Text style={styles.errorText}>
                  Amount exceeds available balance
                </Text>
              )}
              {amount && Number(amount) <= 0 && (
                <Text style={styles.errorText}>
                  Amount must be greater than 0
                </Text>
              )}
            </View>
          </View>

    


    
          <PrimaryButton
            label="Transfer to Primary Wallet"
            onPress={transferApi}
            style={{ 
              marginTop: 32, 
              opacity: valid ? 1 : 0.5 
            }}
            loading={loading}
            disabled={!valid || loading}
          />

  
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>About This Transfer</Text>
            </View>
            <Text style={styles.infoText}>
              • Transfer funds from your API wallet to your primary wallet{"\n"}
              • Transfers are processed instantly{"\n"}
              • No transfer fees applied
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

  
      <ProgressModal
        visible={isProgressVisible}
        onCancel={handleTransferCancel}
        title="Processing Transfer"
        message={`Transferring ${amount} AFN to your primary wallet...`}
        duration={3000}
        onComplete={() => {}} 
      />


      <SuccessModal
        visible={isSuccessVisible}
        onClose={handleSuccessClose}
        onShare={handleShareReceipt}
        title="Transfer Successful!"
        subtitle="Your funds have been transferred successfully"
        details={modalData?.details || []}
        primaryButtonText="Continue"
        shareButtonText="Share Receipt"
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  infoCard: {
    marginTop: 32,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginBottom: 100,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
};