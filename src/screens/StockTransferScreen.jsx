import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import PrimaryButton from "../components/PrimaryButton";
import DotIndicators from "../components/DotIndicators";
import { AGENTS } from "../constants/agents";

const STEPS = { FORM: 0, CONFIRM: 1, DONE: 2 };

export default function StockTransferScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.FORM);
  const [pickerOpen, setPickerOpen] = useState(false);

  // form state
  const [agent, setAgent] = useState();
  const [amountText, setAmountText] = useState(""); // AFN (no suffix)
  const [rateText, setRateText] = useState("1"); // percent

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
  const goNext = () => {
    if (step === STEPS.FORM && canContinue) setStep(STEPS.CONFIRM);
    else if (step === STEPS.CONFIRM) setStep(STEPS.DONE);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Stock Transfer" onBack={goBack} />

      <View style={{ paddingTop: 6, alignItems: "center" }}>
        <DotIndicators total={3} activeIndex={step} />
      </View>

      {step === STEPS.DONE ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Stock Transfer Successful!</Text>

          <Row k="Agent" v={`${agent.name} (${agent.phone})`} />
          <Row k="Transaction ID" v={txId} />
          <Row k="Date" v={new Date().toLocaleString()} />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount</Text>
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
                <Text style={styles.label}>Select Agent</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  activeOpacity={0.85}
                  onPress={() => setPickerOpen(true)}
                >
                  <Text style={styles.dropdownText}>
                    {agent ? `${agent.name} (${agent.phone})` : "Choose agent"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#000" />
                </TouchableOpacity>

                <Text style={styles.label}>Enter Amount</Text>
                <TextInput
                  value={amountText}
                  onChangeText={(t) => setAmountText(sanitizeNumeric(t))}
                  keyboardType="numeric"
                  placeholder="100,000.00"
                  placeholderTextColor="#9E9E9E"
                  style={styles.input}
                />

                <Text style={styles.label}>Commission Rate</Text>
                <TextInput
                  value={rateText}
                  onChangeText={(t) => setRateText(sanitizeNumeric(t))}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor="#9E9E9E"
                  style={styles.input}
                />

                <Text style={styles.label}>Total Amount</Text>
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={{ color: Colors.textPrimary }}>
                    {fmtAFN(total)}
                  </Text>
                </View>

                <PrimaryButton
                  label="Continue"
                  onPress={goNext}
                  style={{ marginTop: 24, opacity: canContinue ? 1 : 0.5 }}
                />
                <PrimaryButton
                  label="Back"
                  onPress={goBack}
                  style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
                />
              </>
            )}

            {step === STEPS.CONFIRM && (
              <>
                <Text style={[styles.label, { marginBottom: 10 }]}>
                  Are you sure you want to confirm this transfer?
                </Text>
                <View style={styles.card}>
                  <Row k="Agent" v={`${agent.name} (${agent.phone})`} />
                  <Row k="Amount" v={fmtAFN(amount)} />
                  <Row k="Commission Rate" v={`${stripTrailingZeros(rate)}%`} />
                  <Row k="Total Amount" v={fmtAFN(total)} boldTop />
                </View>

                <PrimaryButton
                  label="Confirm"
                  onPress={goNext}
                  style={{ marginTop: 24 }}
                />
                <PrimaryButton
                  label="Back"
                  onPress={goBack}
                  style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Agent picker */}
      <Modal
        transparent
        visible={pickerOpen}
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agent</Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={AGENTS}
              keyExtractor={(it) => it.id}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setAgent(item);
                    setPickerOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="#777"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ flex: 1, color: Colors.textPrimary }}>
                    {item.name} ({item.phone})
                  </Text>
                  {item.id === agent?.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- little pieces ---------- */

function Row({ k, v, boldTop }) {
  return (
    <View style={[styles.row, boldTop && styles.rowTopBorder]}>
      <Text style={[styles.k, boldTop && { fontWeight: "700" }]}>{k}</Text>
      <Text
        style={[
          styles.v,
          boldTop && { fontWeight: "700", color: Colors.primary },
        ]}
      >
        {v}
      </Text>
    </View>
  );
}

function parseNumber(s = "") {
  const cleaned = String(s).replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) parts.splice(2); // keep one decimal point
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
  return `${nf.format(n)} AF`;
}
function stripTrailingZeros(n) {
  const s = String(n);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 16,
  },

  dropdown: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { color: Colors.textPrimary },

  input: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    color: Colors.textPrimary,
  },
  inputDisabled: { backgroundColor: "#F7F7F7" },

  card: {
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowTopBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F2F2F2",
    marginTop: 6,
    paddingTop: 12,
  },
  k: { color: Colors.textSecondary, fontSize: 13 },
  v: { color: Colors.textPrimary, fontSize: 13 },

  // success
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
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  totalBox: {
    width: "100%",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 18,
  },
  totalLabel: { color: Colors.textSecondary, fontSize: 12 },
  totalValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700" },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "70%",
    elevation: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});
