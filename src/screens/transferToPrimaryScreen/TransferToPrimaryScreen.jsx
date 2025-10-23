import React, { useMemo, useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Easing,
  SafeAreaView,
  Dimensions
} from "react-native";
import { Colors } from "../theme/colors";
import { TextInput } from "react-native";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { useUser } from "../../context/userContext";
import { transferApiToMainWallet } from "../../services/merchantApi";
import { Ionicons } from "@expo/vector-icons";
import TopUpStyles from "./topupScreen/TopupStyle";

const { width, height } = Dimensions.get('window');


function ProgressBar({ duration = 2000, onComplete }) {
  const progress = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { width: widthInterpolated }]} />
    </View>
  );
}


const Confetti = () => {
  const confettiCount = 50;
  const confetti = Array(confettiCount).fill(0);
  
  return (
    <View style={styles.confettiContainer}>
      {confetti.map((_, index) => {
        const left = useRef(new Animated.Value(Math.random() * width)).current;
        const top = useRef(new Animated.Value(-20)).current;
        const rotation = useRef(new Animated.Value(0)).current;
        const opacity = useRef(new Animated.Value(0)).current;
        
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        
        useEffect(() => {
          const fallAnimation = Animated.parallel([
            Animated.timing(top, {
              toValue: height,
              duration: 2000 + Math.random() * 3000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(rotation, {
              toValue: 1,
              duration: 1000 + Math.random() * 2000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                delay: 1500,
                useNativeDriver: false,
              }),
            ]),
          ]);
          
          setTimeout(() => {
            fallAnimation.start();
          }, Math.random() * 500);
        }, []);
        
        const rotateInterpolate = rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                left: left,
                top: top,
                opacity: opacity,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                transform: [{ rotate: rotateInterpolate }],
                width: 8 + Math.random() * 10,
                height: 8 + Math.random() * 10,
                borderRadius: Math.random() > 0.5 ? 0 : 10,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Success Icon with Animation
const AnimatedSuccessIcon = ({ animated }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const circlePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Scale up the circle
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Show checkmark after circle animation
      setTimeout(() => {
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 300);

      // Continuous pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(circlePulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circlePulse, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const pulseScale = circlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pulseOpacity = circlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <View style={styles.successIconContainer}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      
      {/* Main success circle */}
      <Animated.View
        style={[
          styles.successCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated checkmark */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              opacity: checkmarkOpacity,
            },
          ]}
        >
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default function TransferToPrimaryScreen({ navigation, route }) {
  const { user, setUser } = useUser();
  const startBalance = route.params?.balance ?? 0;
  const [amount, setAmount] = useState(String(startBalance));
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferData, setTransferData] = useState(null);
  

  const successModalScale = useRef(new Animated.Value(0)).current;
  const successContentOpacity = useRef(new Animated.Value(0)).current;
  const detailsSlideUp = useRef(new Animated.Value(50)).current;

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

  const handleProgressComplete = () => {
    setShowProgress(false);
    setShowSuccess(true);
    animateSuccessModal();
  };

  const animateSuccessModal = () => {
   
    successModalScale.setValue(0);
    successContentOpacity.setValue(0);
    detailsSlideUp.setValue(50);


    Animated.sequence([
      Animated.spring(successModalScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(successContentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailsSlideUp, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
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
      
      setTransferData({
        amount: Number(amount),
        transactionId: res?.transactionId || `TX${Date.now()}`,
        timestamp: new Date().toISOString()
      });
      
      setShowProgress(true);
      
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

  const handleSuccessClose = () => {

    Animated.parallel([
      Animated.timing(successModalScale, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(successContentOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      navigation.replace("TransferToPrimarySuccess", {
        amount: transferData.amount,
      });
    });
  };

  const handleTryAgain = () => {
    setShowProgress(false);
    setLoading(false);
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

    
          <View style={TopUpStyles.quickAmountsContainer}>
            <Text style={TopUpStyles.quickAmountsTitle}>Quick Amounts</Text>
            <View style={TopUpStyles.quickAmountsGrid}>
              {[100, 500, 1000, 2000, 5000, 10000].map((quickAmount) => {
                if (quickAmount > startBalance) return null;
                
                return (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      TopUpStyles.quickAmountButton,
                      Number(amount) === quickAmount && TopUpStyles.quickAmountButtonSelected
                    ]}
                    onPress={() => setAmount(String(quickAmount))}
                  >
                    <Text style={[
                      TopUpStyles.quickAmountText,
                      Number(amount) === quickAmount && TopUpStyles.quickAmountTextSelected
                    ]}>
                      {quickAmount}
                    </Text>
                    <Text style={[
                      TopUpStyles.quickAmountSubtext,
                      Number(amount) === quickAmount && TopUpStyles.quickAmountSubtextSelected
                    ]}>
                      AFN
                    </Text>
                  </TouchableOpacity>
                );
              })}
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

  
          {/* <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>About This Transfer</Text>
            </View>
            <Text style={styles.infoText}>
              • Transfer funds from your API wallet to your primary wallet{"\n"}
              • Transfers are processed instantly{"\n"}
              • No transfer fees applied
            </Text>
          </View> */}
        </ScrollView>
      </KeyboardAvoidingView>

   
      <Modal
        visible={showProgress}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.progressModal}>
            <View style={styles.progressContent}>
              <Ionicons name="sync-outline" size={48} color={Colors.primary} />
              <Text style={styles.progressTitle}>Processing Transfer</Text>
              <Text style={styles.progressText}>
                Transferring {amount} AFN to your primary wallet...
              </Text>
              
              <ProgressBar 
                duration={3000} 
                onComplete={handleProgressComplete}
              />
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleTryAgain}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <Confetti />
          
          <Animated.View 
            style={[
              styles.successModal,
              {
                transform: [{ scale: successModalScale }],
                opacity: successContentOpacity,
              }
            ]}
          >
            <Animated.View 
              style={[
                styles.successContent,
                {
                  opacity: successContentOpacity,
                  transform: [{ translateY: detailsSlideUp }]
                }
              ]}
            >
      
              <AnimatedSuccessIcon animated={showSuccess} />
              
              <Text style={styles.successTitle}>Transfer Successful!</Text>
              <Text style={styles.successSubtitle}>
                Your funds have been transferred successfully
              </Text>
              
              <Animated.View 
                style={[
                  styles.successDetails,
                  {
                    transform: [{ translateY: detailsSlideUp }]
                  }
                ]}
              >
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="cash-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Amount Transferred</Text>
                    <Text style={styles.detailValue}>{transferData?.amount} AFN</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>
                      {transferData?.transactionId?.substring(0, 12)}...
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Completed At</Text>
                    <Text style={styles.detailValue}>
                      {new Date(transferData?.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <View style={styles.successActions}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => {/* Add share functionality */}}
                >
                  <Ionicons name="share-outline" size={20} color={Colors.primary} />
                  <Text style={styles.shareButtonText}>Share Receipt</Text>
                </TouchableOpacity>
                
                <PrimaryButton
                  label="Continue"
                  onPress={handleSuccessClose}
                  style={{ flex: 1, marginLeft: 12 }}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    height: 8,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 16,
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressContent: {
    alignItems: 'center',
    width: '100%',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced Success Modal Styles
  successModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
    padding: 32,
  },
  // Success Icon Styles
  successIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
  },
  checkmarkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    flex: 1,
  },
  shareButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
 
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
  },
};