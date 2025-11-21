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
  Dimensions,
  StyleSheet 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import { getDownlineAgents, createReverseStockByMerchant } from "../../services/reverseStockApi";
import { useAuth } from "../../auth/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import { scale } from "../../utils/normalizeSize";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const STEPS = { FORM: 0, CONFIRM: 1, DONE: 2 };

export default function ReverseStockScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(STEPS.FORM);
  const [loading, setLoading] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const insets = useSafeAreaInsets();

  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const successIconScale = useRef(new Animated.Value(0)).current;
  const successIconRotate = useRef(new Animated.Value(0)).current;
  const contentStaggerAnim = useRef(new Animated.Value(0)).current;

  const [agentPickerAnim] = useState(new Animated.Value(screenHeight));

  const [agent, setAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [amountText, setAmountText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDownlineAgents = async () => {
      try {
        const res = await getDownlineAgents(user?.id);
        setAgents(res?.data || []);
      } catch (error) {
        console.error("Error fetching downline agents:", error);
        Alert.alert("Error", "Failed to load agents");
      }
    };
    fetchDownlineAgents();
  }, [user?.id]);

  useEffect(() => {
    if (agentPickerOpen) {
      Animated.timing(agentPickerAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(agentPickerAnim, {
        toValue: screenHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [agentPickerOpen]);

  // Modal handlers
  const showCustomSuccessModal = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showCustomErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
    setStep(STEPS.FORM);
    resetForm();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // parsed & computed
  const amount = useMemo(
    () => Math.max(0, parseNumber(amountText)),
    [amountText]
  );

  const canContinue = !!agent && amount > 0;
  const txId = useMemo(
    () => "#" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    [step === STEPS.DONE]
  );

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const resetForm = () => {
    setAgent(null);
    setAmountText("");
    setCommentText("");
  };

  const submitReverseStock = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("reversedFrom", agent.id);
      formData.append("amount", amountText);
      formData.append("comment", commentText);
      formData.append("type", "downline");

      const response = await createReverseStockByMerchant(formData);
      
      showCustomSuccessModal(`Reverse stock request of ${fmtAFN(amount)} from ${agent?.user?.username} was submitted successfully!`);
      setStep(STEPS.DONE);
      
    } catch (error) {
      console.log("Reverse stock error: ", error);
      const message = error.response?.data?.error || error.message || "Failed to submit reverse stock request";
      showCustomErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  const modalTransform = {
    transform: [
      { translateY: modalSlideAnim },
      { scale: modalScaleAnim }
    ]
  };

  const agentPickerTransform = {
    transform: [
      { translateY: agentPickerAnim }
    ]
  };

  const filteredAgents = searchQuery
    ? agents.filter(item =>
        item.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user?.mobileNumber?.includes(searchQuery) ||
        item.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : agents;

  const AgentPickerModal = () => (
    <Modal
      visible={agentPickerOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={() => setAgentPickerOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAgentPickerOpen(false)}
        />
        <Animated.View 
          style={[
            styles.modalCard,
            agentPickerTransform,
            { 
              height: '70%',
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Agent</Text>
            <TouchableOpacity 
              onPress={() => setAgentPickerOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              placeholder="Search agents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={filteredAgents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.agentItem}
                onPress={() => {
                  setAgent(item);
                  setAgentPickerOpen(false);
                  setSearchQuery("");
                }}
                activeOpacity={0.7}
              >
                <View style={styles.agentAvatar}>
                  <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{item.user?.username}</Text>
                  <Text style={styles.agentPhone}>{item.user?.mobileNumber}</Text>
                  <Text style={styles.agentCommission}>
                    Commission: {item.commissionRateDetails?.percentage || item.commission_rate || 0}%
                  </Text>
                </View>
                {item.id === agent?.id && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.agentSeparator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#9E9E9E" />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No agents found" : "No agents available"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "No downline agents found"}
                </Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: 100 }}>
      <ServiceHeader title="Reverse Stock" onBack={goBack} />

      {step === STEPS.DONE ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Reverse Stock Request Submitted!</Text>

          <View style={styles.successDetails}>
            <DetailRow label="Agent:" value={`${agent?.user?.username} (${agent?.user?.mobileNumber})`} />
            <DetailRow label="Date:" value={new Date().toLocaleString()} />
            <DetailRow label="Request ID:" value={txId} />
            <DetailRow label="Amount:" value={fmtAFN(amount)} />
            {commentText && (
              <DetailRow label="Comment:" value={commentText} />
            )}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Amount to be Reversed</Text>
            <Text style={styles.totalValue}>{fmtAFN(amount)}</Text>
          </View>

          <PrimaryButton
            label="Done"
            onPress={handleSuccessClose}
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
                {/* Agent Selection */}
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.editHeader}>
                    <Text style={styles.label}>Select Agent</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.dropdown,
                      {
                        borderColor: agentPickerOpen ? Colors.primary : '#E4E7EC',
                        backgroundColor: '#FFFFFF',
                        shadowColor: Colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: agentPickerOpen ? 0.15 : 0,
                        shadowRadius: agentPickerOpen ? 10 : 0,
                        elevation: agentPickerOpen ? 3 : 0,
                      }
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setAgentPickerOpen(true)}
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
                            <Text style={styles.dropdownCommission}>
                              Commission: {agent.commissionRateDetails?.percentage || agent.commission_rate || 0}%
                            </Text>
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
                  <Text style={styles.label}>Reverse Amount</Text>
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

                {/* Comment Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>Comment (Optional)</Text>
                  <TextInput
                    style={[styles.textArea, { 
                      borderColor: Colors.primary, 
                      backgroundColor: '#FFFFFF',
                    }]}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add any comments about this reverse stock request..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor="#9E9E9E"
                  />
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
                <Text style={styles.sectionTitle}>Confirm Reverse Stock Request</Text>
                <Text style={styles.confirmSubtitle}>
                  Please review the reverse stock details before confirming
                </Text>

                <View style={styles.confirmCard}>
                  <DetailRow label="Agent" value={`${agent?.user?.username}`} />
                  <DetailRow label="Phone" value={agent?.user?.mobileNumber} />
                  <DetailRow label="Reverse Amount" value={fmtAFN(amount)} />
                  {commentText && (
                    <DetailRow label="Comment" value={commentText} />
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount to Reverse</Text>
                    <Text style={styles.totalValue}>{fmtAFN(amount)}</Text>
                  </View>
                </View>

                <PrimaryButton
                  label="Submit Request"
                  onPress={submitReverseStock}
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

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Request Submitted!"
        message={successMessage}
        buttonText="Continue"
        autoHideDuration={3000}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title="Request Failed"
        message={errorMessage}
        buttonText="Try Again"
        showRetryButton={true}
      />

      <AgentPickerModal />
    </SafeAreaView>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, bold && styles.boldText]}>{label}</Text>
      <Text style={[styles.detailValue, bold && styles.boldText]}>{value}</Text>
    </View>
  );
}

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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(3.2),
    borderTopRightRadius: scale.hp(3.2),
    padding: scale.hp(2.1),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -scale.hp(0.26) },
    shadowOpacity: 0.25,
    shadowRadius: scale.hp(0.5),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(2.1),
    paddingBottom: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: scale.hp(1.3),
    paddingHorizontal: scale.wp(3.1),
    marginBottom: scale.hp(2.1),
    height: scale.hp(5.7),
  },
  searchIcon: {
    marginRight: scale.wp(2.1),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingBottom: scale.hp(2.6),
  },
  sectionTitle: {
    fontSize: scale.hp(2.6),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
    marginTop: scale.hp(2.1),
  },
  label: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(1.05),
  },
  dropdown: {
    height: scale.hp(9.8),
    borderRadius: scale.hp(2.1),
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale.wp(4.2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: scale.hp(2.1),
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dropdownSubtext: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.26),
  },
  dropdownCommission: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    marginTop: scale.hp(0.26),
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale.hp(2.1),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale.wp(4.2),
    height: scale.hp(8.5),
  },
  currencyTag: {
    fontWeight: '700',
    marginRight: scale.wp(3.1),
    color: Colors.textPrimary,
    fontSize: scale.hp(2.1),
  },
  input: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale.hp(2.1),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(2.1),
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    minHeight: scale.hp(12),
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
  },
  clearBtn: {
    padding: scale.hp(0.8),
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2.6),
    padding: scale.hp(2.6),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.5) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(1.55),
    elevation: 4,
    marginTop: scale.hp(2.1),
  },
  confirmSubtitle: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.6),
    lineHeight: scale.hp(2.9),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(2.1),
    marginTop: scale.hp(1.05),
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
  },
  boldText: {
    fontWeight: '700',
  },
  successCircle: {
    width: scale.wp(24.8),
    height: scale.wp(24.8),
    borderRadius: scale.wp(12.4),
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: scale.hp(0.26),
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: scale.hp(1.55),
  },
  title: {
    fontSize: scale.hp(3.1),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale.hp(3.1),
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(2.1),
    padding: scale.hp(2.6),
    marginBottom: scale.hp(3.1),
  },
  totalBox: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(2.6),
    paddingVertical: scale.hp(3.1),
    alignItems: 'center',
    marginVertical: scale.hp(2.6),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    marginBottom: scale.hp(1.05),
  },
  totalValue: {
    color: Colors.primary,
    fontSize: scale.hp(3.65),
    fontWeight: '800',
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    paddingHorizontal: scale.wp(2.1),
    borderRadius: scale.hp(1.05),
  },
  agentAvatar: {
    width: scale.wp(10.4),
    height: scale.wp(10.4),
    borderRadius: scale.wp(5.2),
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(3.1),
  },
  agentAvatarSmall: {
    width: scale.wp(9.4),
    height: scale.wp(9.4),
    borderRadius: scale.wp(4.7),
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(3.1),
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  agentPhone: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.26),
  },
  agentCommission: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    marginTop: scale.hp(0.26),
    fontWeight: '500',
  },
  agentSeparator: {
    height: scale.hp(0.13),
    backgroundColor: '#F0F0F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(5.2),
  },
  emptyText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.55),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
    textAlign: 'center',
  },
});