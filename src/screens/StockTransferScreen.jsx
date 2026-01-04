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
import SuccessModal from "../components/modals/SuccessModal";
import ErrorModal from "../components/modals/ErrorModal";
import { scale } from "../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const STEPS = { FORM: 0, CONFIRM: 1, DONE: 2 };

export default function StockTransferScreen({ navigation }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(STEPS.FORM);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user, setUser } = useUser();
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
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const getAgentChildUsers = async() => {
      const res = await getAgentDownlineAgents(user?.id);
      setAgents(res?.data);
    }
    getAgentChildUsers();
  }, []);

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
    navigation.popToTop();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const agentCommissionRate = useMemo(() => {
    return agent?.commissionRateDetails?.percentage || agent?.commission_rate || 0;
  }, [agent]);

  const amount = useMemo(
    () => Math.max(0, parseNumber(amountText)),
    [amountText]
  );
  const rate = useMemo(() => agentCommissionRate, [agentCommissionRate]);
  const commission = useMemo(() => (amount * rate) / 100, [amount, rate]);
  const total = useMemo(() => amount + commission, [amount, commission]);

  const canContinue = !!agent && amount > 0 && agentCommissionRate > 0;
  const txId = useMemo(
    () => "#" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    [step === STEPS.DONE]
  );

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const transferStock = async () => {
    try {
      setLoading(true);
      const payload = {
        agentId: agent?.user?.id,
        amount: Number(amountText),
        total_amount: total
      };

      const res = await transferStockToDownlineAgent(payload);
      
      showCustomSuccessModal(t('transactions.stockSent'));
      setStep(STEPS.FORM); 
      setAgent(null);
      setAmountText("");
      
    } catch (error) {
      console.log("Transfer stock error: ", error);
      const message = error.response?.data?.error || error.message || t('common.error');
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
            <Text style={styles.modalTitle}>{t('stockTransfer.selectAgent')}</Text>
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
              placeholder={t('stockTransfer.searchAgents')}
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
                    {t('stockTransfer.commission')}: {item.commissionRateDetails?.percentage || item.commission_rate || 0}%
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
                  {searchQuery ? t('stockTransfer.noAgentsFound') : t('stockTransfer.noAgentsAvailable')}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? t('stockTransfer.adjustSearch') : t('stockTransfer.noDownlineAgents')}
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
      <ServiceHeader title={t('services.stockTransfer')} onBack={goBack} />

      {step === STEPS.DONE ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.title}>{t('stockTransfer.transferSuccessful')}</Text>

          <View style={styles.successDetails}>
            <DetailRow label={`${t('stockTransfer.agent')}:`} value={`${agent?.user?.username} (${agent?.user?.mobileNumber})`} />
            <DetailRow label={`${t('receipt.dateTime')}:`} value={new Date().toLocaleString()} />
            <DetailRow label={`${t('receipt.transactionId')}:`} value={txId} />
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>{t('stockTransfer.totalAmountTransferred')}</Text>
            <Text style={styles.totalValue}>{fmtAFN(total)}</Text>
          </View>

          <PrimaryButton
            label={t('common.done')}
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
                    <Text style={styles.label}>{t('stockTransfer.selectAgent')}</Text>
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
                              {t('stockTransfer.commission')}: {agentCommissionRate}%
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={[styles.dropdownText, { color: '#9E9E9E' }]}>
                          {t('stockTransfer.chooseAgent')}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#7A7A7A" />
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>{t('stockTransfer.transferAmount')}</Text>
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
                  <Text style={styles.label}>{t('stockTransfer.commissionRate')}</Text>
                  <View style={[styles.inputContainer, styles.inputDisabled]}>
                    <Text style={styles.currencyTag}>%</Text>
                    <Text style={[styles.input, { color: Colors.textPrimary, paddingVertical: 15 }]}>
                      {agentCommissionRate}%
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>{t('stockTransfer.commissionAmount')}</Text>
                  <View style={[styles.inputContainer, styles.inputDisabled]}>
                    <Text style={styles.currencyTag}>AFN</Text>
                    <Text style={[styles.input, { color: Colors.textPrimary, paddingVertical: 15 }]}>
                      {fmtAFN(commission)}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.label}>{t('stockTransfer.totalAmount')}</Text>
                  <View style={[styles.inputContainer, styles.inputDisabled]}>
                    <Text style={styles.currencyTag}>AFN</Text>
                    <Text style={[styles.input, { color: Colors.textPrimary, paddingVertical: 15 }]}>
                      {fmtAFN(total)}
                    </Text>
                  </View>
                </View>

                <PrimaryButton
                  label={t('common.continue')}
                  onPress={() => setStep(STEPS.CONFIRM)}
                  style={{ marginTop: 24, opacity: canContinue ? 1 : 0.5 }}
                  disabled={!canContinue}
                />
              </>
            )}

            {step === STEPS.CONFIRM && (
              <>
                <Text style={styles.sectionTitle}>{t('stockTransfer.confirmTransfer')}</Text>
                <Text style={styles.confirmSubtitle}>
                  {t('stockTransfer.reviewDetails')}
                </Text>

                <View style={styles.confirmCard}>
                  <DetailRow label={t('stockTransfer.agent')} value={`${agent?.user?.username}`} />
                  <DetailRow label={t('mobileNumber')} value={agent?.user?.mobileNumber} />
                  <DetailRow label={t('stockTransfer.transferAmount')} value={fmtAFN(amount)} />
                  <DetailRow label={t('stockTransfer.commissionRate')} value={`${agentCommissionRate}%`} />
                  <DetailRow label={t('stockTransfer.commissionAmount')} value={fmtAFN(commission)} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('stockTransfer.totalAmount')}</Text>
                    <Text style={styles.totalValue}>{fmtAFN(total)}</Text>
                  </View>
                </View>

                <PrimaryButton
                  label={t('stockTransfer.confirmTransferButton')}
                  onPress={transferStock}
                  style={{ marginTop: 32 }}
                  loading={loading}
                />
                <PrimaryButton
                  label={t('common.back')}
                  onPress={goBack}
                  style={{ marginTop: 12, backgroundColor: "#6B7280" }}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('receipt.stockSent')}
        message={successMessage}
        buttonText={t('common.continue')}
        autoHideDuration={3000}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('common.error')}
        message={errorMessage}
        buttonText={t('common.tryAgain')}
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

const styles = {
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
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
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdown: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dropdownSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dropdownCommission: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    height: 60,
  },
  currencyTag: {
    fontWeight: '700',
    marginRight: 15,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
  },
  clearBtn: {
    padding: 6,
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 25,
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
  totalLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  boldText: {
    fontWeight: '700',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 2,
    borderColor: "rgba(76,175,80,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
  title: {
    fontSize: 28,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  agentAvatarSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
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
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  agentSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
};