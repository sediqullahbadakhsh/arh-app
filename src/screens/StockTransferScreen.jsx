import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import { getAgentDownlineAgents, transferStockToDownlineAgent } from "../services/merchantApi";
import { useUser } from "../context/userContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const STEPS = { FORM: 0, CONFIRM: 1, DONE: 2 };

// Progress Bar Component
function ProgressBar({ duration = 2000, onComplete }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(progress, {
      toValue: 100,
      duration,
      easing: Easing.out(Easing.cubic),
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
    <View style={styles.progressContainer}>
      <Animated.View 
        style={[
          styles.progressBackground,
          {
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill,
              { 
                width: widthInterpolated,
                backgroundColor: Colors.primary,
              }
            ]}
          >
            <View style={styles.progressShine} />
          </Animated.View>
        </View>
        <View style={styles.progressDots}>
          {[0, 25, 50, 75, 100].map((dot) => (
            <View 
              key={dot} 
              style={[
                styles.progressDot,
                { 
                  left: `${dot}%`,
                  backgroundColor: dot === 0 ? Colors.primary : '#E5E7EB'
                }
              ]} 
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function StockTransferScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.FORM);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, setUser } = useUser();
  const insets = useSafeAreaInsets();

  // Animation values
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const successIconScale = useRef(new Animated.Value(0)).current;
  const successIconRotate = useRef(new Animated.Value(0)).current;
  const contentStaggerAnim = useRef(new Animated.Value(0)).current;

  // form state
  const [agent, setAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [amountText, setAmountText] = useState("");
  const [rateText, setRateText] = useState("");
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isRateFocused, setIsRateFocused] = useState(false);

  useEffect(() => {
    const getAgentChildUsers = async() => {
      const res = await getAgentDownlineAgents(user?.id);
      setAgents(res?.data);
    }
    getAgentChildUsers();
  }, []);

  // parsed & computed
  const amount = useMemo(
    () => Math.max(0, parseNumber(amountText)),
    [amountText]
  );
  const rate = useMemo(() => clamp(parseNumber(rateText), 0, 100), [rateText]);
  const commission = useMemo(() => (amount * rate) / 100, [amount, rate]);
  const total = useMemo(() => amount + commission, [amount, commission]);

  const canContinue = !!agent && amount > 0;
  const txId = useMemo(
    () => "#" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    [step === STEPS.DONE]
  );

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const animateSuccessModalIn = () => {
    modalSlideAnim.setValue(screenHeight);
    modalScaleAnim.setValue(0.8);
    modalOpacityAnim.setValue(0);
    successIconScale.setValue(0);
    successIconRotate.setValue(0);
    contentStaggerAnim.setValue(0);

    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.spring(successIconScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(successIconRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentStaggerAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const handleProgressComplete = () => {
    setShowProgress(false);
    setShowSuccess(true);
    setTimeout(animateSuccessModalIn, 100);
  };

  const transferStock = async () => {
    try {
      setLoading(true);
      const payload = {
        agentId: agent?.user?.id,
        amount: Number(amountText),
        total_amount: total
      };

      const res = await transferStockToDownlineAgent(payload);
      setShowProgress(true);
      
    } catch (error) {
      console.log("Transfer stock error: ", error);
      const message = error.response?.data?.error || error.message || "Failed to Transfer Stock";
      Alert.alert("Transfer Failed", message);
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      navigation.popToTop();
    });
  };

  const modalTransform = {
    transform: [
      { translateY: modalSlideAnim },
      { scale: modalScaleAnim }
    ]
  };

  const successIconTransform = {
    transform: [
      { 
        scale: successIconScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        }) 
      },
      {
        rotate: successIconRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['-180deg', '0deg']
        })
      }
    ]
  };

  const contentOpacity = contentStaggerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const contentTransform = {
    transform: [
      {
        translateY: contentStaggerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      }
    ]
  };

  const AgentPickerModal = () => (
    <Modal
      visible={pickerOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setPickerOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            { 
              height: '70%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Agent</Text>
            <TouchableOpacity 
              onPress={() => setPickerOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Search agents..."
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={agents}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.agentItem}
                onPress={() => {
                  setAgent(item);
                  setRateText(item?.commission_rate || "0");
                  setPickerOpen(false);
                }}
              >
                <View style={styles.agentAvatar}>
                  <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{item.user?.username}</Text>
                  <Text style={styles.agentPhone}>{item.user?.mobileNumber}</Text>
                  {item.commission_rate && (
                    <Text style={styles.agentCommission}>
                      Commission: {item.commission_rate}%
                    </Text>
                  )}
                </View>
                {item.id === agent?.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.agentSeparator} />}
          />
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Stock Transfer" onBack={goBack} />

      {step === STEPS.DONE ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Stock Transfer Successful!</Text>

          <View style={styles.successDetails}>
            <DetailRow label="Agent:" value={`${agent?.user?.username} (${agent?.user?.mobileNumber})`} />
            <DetailRow label="Date:" value={new Date().toLocaleString()} />
            <DetailRow label="Transaction ID:" value={txId} />
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount Transferred</Text>
            <Text style={styles.totalValue}>{fmtAFN(total)}</Text>
          </View>

          <PrimaryButton
            label="Done"
            onPress={() => navigation.popToTop()}
            style={{ width: "100%" }}
          />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === STEPS.FORM && (
              <>
    
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.editHeader}>
                    <Text style={styles.label}>Select Agent</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      {
                        borderColor: pickerOpen ? Colors.primary : '#E4E7EC',
                        backgroundColor: '#FFFFFF',
                        shadowColor: Colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: pickerOpen ? 0.15 : 0,
                        shadowRadius: pickerOpen ? 10 : 0,
                        elevation: pickerOpen ? 3 : 0,
                      }
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setPickerOpen(true)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      {agent ? (
                        <>
                          <View style={styles.agentAvatarSmall}>
                            <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownText}>{agent.user?.username}</Text>
                            <Text style={styles.dropdownSubtext}>{agent.user?.mobileNumber}</Text>
                          </View>
                        </>
                      ) : (
                        <Text style={[styles.dropdownText, { color: '#9E9E9E' }]}>
                          Choose agent
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
                  </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>Transfer Amount</Text>
                  <View style={[
                    styles.inputContainer,
                    {
                      borderColor: isAmountFocused ? Colors.primary : '#2e2e2eff',
                      backgroundColor: '#FFFFFF',
                      shadowColor: Colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isAmountFocused ? 0.15 : 0,
                      shadowRadius: isAmountFocused ? 10 : 0,
                      elevation: isAmountFocused ? 3 : 0,
                    }
                  ]}>
                    <Text style={styles.currencyTag}>AFN</Text>
                    <TextInput
                      value={amountText}
                      onChangeText={(t) => setAmountText(sanitizeNumeric(t))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9E9E9E"
                      style={styles.input}
                      onFocus={() => setIsAmountFocused(true)}
                      onBlur={() => setIsAmountFocused(false)}
                    />
                    {amountText && (
                      <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => setAmountText("")}
                      >
                        <Ionicons name="close-circle" size={18} color="#A3A3A3" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

         
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>Commission Rate</Text>
                  <View style={[
                    styles.inputContainer,
                    {
                      borderColor: isRateFocused ? Colors.primary : '#2e2e2eff',
                      backgroundColor: '#F8F9FA',
                    }
                  ]}>
                    <Text style={styles.currencyTag}>%</Text>
                    <TextInput
                      value={String(rateText)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9E9E9E"
                      style={[styles.input, { color: Colors.textSecondary }]}
                      onFocus={() => setIsRateFocused(true)}
                      onBlur={() => setIsRateFocused(false)}
                      editable={false}
                    />
                  </View>
                </View>

    
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>Total Amount</Text>
                  <View style={[styles.inputContainer, styles.inputDisabled]}>
                    <Text style={styles.currencyTag}>AFN</Text>
                    <Text style={[styles.input, { color: Colors.textPrimary, paddingVertical: 15 }]}>
                      {fmtAFN(total)}
                    </Text>
                  </View>
                </View>

          
       

                <PrimaryButton
                  label="Continue"
                  onPress={() => setStep(STEPS.CONFIRM)}
                  style={{ marginTop: 24, opacity: canContinue ? 1 : 0.5 }}
                  disabled={!canContinue}
                />
              </>
            )}

            {step === STEPS.CONFIRM && (
              <>
                <Text style={styles.sectionTitle}>Confirm Transfer</Text>
                <Text style={styles.confirmSubtitle}>
                  Please review the transfer details before confirming
                </Text>

                <View style={styles.confirmCard}>
                  <DetailRow label="Agent" value={`${agent?.user?.username}`} />
                  <DetailRow label="Phone" value={agent?.user?.mobileNumber} />
                  <DetailRow label="Transfer Amount" value={fmtAFN(amount)} />
                  <DetailRow label="Commission Rate" value={`${stripTrailingZeros(agent?.commission_rate || 0)}%`} />
                  <DetailRow label="Commission Amount" value={fmtAFN(commission)} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>{fmtAFN(total)}</Text>
                  </View>
                </View>

                <PrimaryButton
                  label="Confirm Transfer"
                  onPress={transferStock}
                  style={{ marginTop: 32 }}
                  loading={loading}
                />
                <PrimaryButton
                  label="Back"
                  onPress={goBack}
                  style={{ marginTop: 12, backgroundColor: "#6B7280" }}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}


      {/* Fixed Progress Modal */}
      <Modal
        visible={showProgress}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.progressModalOverlay}>
          <View style={styles.progressModal}>
            <View style={styles.progressContent}>
              <View style={styles.processingIconContainer}>
                <Ionicons name="swap-horizontal-outline" size={48} color={Colors.primary} />
                <View style={styles.processingPulse} />
              </View>
              <Text style={styles.progressTitle}>Processing Transfer</Text>
              <Text style={styles.progressText}>
                Transferring {amountText} AFN to {agent?.user?.username}...
              </Text>
              
              <ProgressBar 
                duration={2500} 
                onComplete={handleProgressComplete}
              />
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowProgress(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.successModalOverlay}>
          <Animated.View 
            style={[
              styles.successModal,
              modalTransform,
              { opacity: modalOpacityAnim }
            ]}
          >
            <Animated.View style={styles.successContent}>
              {/* Success Icon with Animation */}
              <Animated.View 
                style={[
                  styles.successIconContainer,
                  successIconTransform
                ]}
              >
                <View style={styles.successIconBackground} />
                <Ionicons name="checkmark" size={42} color="#FFFFFF" />
                <View style={styles.successIconRipple} />
                <View style={[styles.successIconRipple, styles.successIconRipple2]} />
              </Animated.View>

              {/* Success Content with Stagger Animation */}
              <Animated.View 
                style={[
                  styles.successTextContent,
                  { 
                    opacity: contentOpacity,
                    ...contentTransform 
                  }
                ]}
              >
                <Text style={styles.successTitle}>Transfer Successful!</Text>
                <Text style={styles.successSubtitle}>
                  Stock has been transferred to {agent?.user?.username}
                </Text>

                <View style={styles.successDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="person-outline" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.detailLabel}>Agent:</Text>
                    <Text style={styles.detailValue}>{agent?.user?.username}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="cash-outline" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>{fmtAFN(amount)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="time-outline" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                </View>

                <PrimaryButton
                  label="Continue"
                  onPress={handleSuccessClose}
                  style={styles.successButton}
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <AgentPickerModal />
    </SafeAreaView>
  );
}

/* ---------- Helper Components ---------- */

function DetailRow({ label, value, bold }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, bold && styles.boldText]}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.boldText]}>{value}</Text>
    </View>
  );
}

/* ---------- Utility Functions ---------- */

function parseNumber(s = "") {
  const cleaned = String(s).replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) parts.splice(2);
  return parseFloat(parts.join(".")) || 0;
}

function sanitizeNumeric(s = "") {
  return s.replace(/[^\d.]/g, "");
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, isNaN(n) ? 0 : n));
}

const nf = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtAFN(n) {
  return `${nf.format(n)} AFN`;
}

function stripTrailingZeros(n) {
  const s = String(n);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/* ---------- Styles ---------- */

const styles = {
  // Modal Overlay Styles - FIXED
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  progressContainer: {
    marginVertical: 20,
  },
  progressBackground: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  progressDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },


  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },


  dropdown: {
    height: 65,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dropdownSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },


  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 65,
  },
  currencyTag: {
    fontWeight: '700',
    marginRight: 12,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
  },
  clearBtn: {
    padding: 6,
  },


  quickAmountsContainer: {
    marginTop: 20,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    minWidth: 70,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },

  // Confirm Card
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 16,
  },
  confirmSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
  },
  boldText: {
    fontWeight: '700',
  },

  // Success Styles
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  totalBox: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Agent List Styles
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  agentAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  agentPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  agentCommission: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  agentSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Progress Modal Styles - FIXED
  progressModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    width: Math.min(screenWidth * 0.9, 400),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  progressContent: {
    alignItems: 'center',
    width: '100%',
  },
  processingIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  processingPulse: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.3,
    transform: [{ scale: 1.2 }],
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginTop: 8,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Success Modal Styles - FIXED
  successModal: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 0,
    width: Math.min(screenWidth * 0.9, 400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
    position: 'relative',
  },
  successIconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 50,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconRipple: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.2,
  },
  successIconRipple2: {
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.1,
  },
  successTextContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    width: '100%',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  successButton: {
    width: '100%',
    marginTop: 8,
    borderRadius: 16,
    height: 56,
  },
};