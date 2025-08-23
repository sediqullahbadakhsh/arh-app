// src/screens/TopupFlowScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import ServiceHeader from "../components/ServiceHeader";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import PaymentMethodToggle from "../components/PaymentMethodToggle";
import DotIndicators from "../components/DotIndicators";
import { COUNTRIES } from "../constants/countries";
import { TOPUP_PRODUCTS } from "../constants/products";
import { USD_TO_AFN } from "../constants/rates";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { useAuth } from "../auth/AuthProvider";

const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, AMOUNT: 2, PAY: 3 };

export default function TopupFlowScreen({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const isB2B = (user?.role || "").toLowerCase().includes("b2b");
  const stepsCount = isB2B ? 3 : 4; // dots
  const lastStep = isB2B ? BASE_STEPS.AMOUNT : BASE_STEPS.PAY;

  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(null); // show inline success

  // Country
  const defaultAf = useMemo(
    () => COUNTRIES.find((c) => c.code === "AF") || COUNTRIES[0],
    []
  );
  const [country, setCountry] = useState(defaultAf);
  const [countryOpen, setCountryOpen] = useState(false);

  // Number
  const [localNumber, setLocalNumber] = useState("");
  const dial = DIAL_CODES[country?.code] || "";
  const operator = guessOperator(country?.code, localNumber.replace(/\D/g, ""));

  // Amount / product
  const [product, setProduct] = useState(null);
  const [customUsd, setCustomUsd] = useState("");

  // ✅ compute USD/AFN correctly for BOTH: product or custom
  const usd =
    (product && typeof product.usd === "number" ? product.usd : null) ??
    (customUsd ? Number(customUsd) : 0);
  const afn =
    (product && typeof product.afn === "number" ? product.afn : null) ??
    Math.round((Number(customUsd) || 0) * USD_TO_AFN);

  // Payment (B2C only)
  const [method, setMethod] = useState("card");
  const [cardType, setCardType] = useState("Master Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [exp, setExp] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // ---------- guards / canNext ----------
  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER &&
      localNumber.replace(/\D/g, "").length >= 7) ||
    (step === BASE_STEPS.AMOUNT && usd > 0) ||
    (!isB2B &&
      step === BASE_STEPS.PAY &&
      ((method === "card" && cardNumber && cvv && exp) ||
        (method === "paypal" && paypalEmail)));

  // ---------- nav helpers ----------
  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;

    // If this is the final step (B2B: AMOUNT; B2C: PAY) -> show inline success
    if (step === lastStep) {
      setSuccess({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountUsd: usd,
        txId: "#9Q87656B",
        date: new Date().toISOString(),
      });
      return;
    }
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  // reset number when country changes
  useEffect(() => {
    setLocalNumber("");
  }, [country?.code]);

  // ---------- UI ----------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Mobile Top-up" onBack={goBack} />

      {/* Dots / Stepper */}
      <View style={{ paddingTop: 6, alignItems: "center" }}>
        <DotIndicators
          total={stepsCount}
          activeIndex={success ? stepsCount - 1 : step}
        />
      </View>

      {/* Inline Success */}
      {success ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Topup Successful!</Text>

          <View style={styles.kv}>
            <Text style={styles.k}>Receiver Number</Text>
            <Text style={styles.v}>{success.mobile}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Transaction ID</Text>
            <Text style={styles.v}>{success.txId}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Date</Text>
            <Text style={styles.v}>
              {new Date(success.date).toLocaleString()}
            </Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{success.amountUsd} USD</Text>
          </View>

          <PrimaryButton
            label="Done"
            onPress={() => {
              // leave the flow
              navigation.popToTop();
            }}
            style={{ width: "100%" }}
          />
          <TouchableOpacity
            onPress={() => {
              // start again
              setSuccess(null);
              setStep(0);
              setProduct(null);
              setCustomUsd("");
              setLocalNumber("");
            }}
          >
            <Text
              style={{
                color: Colors.primary,
                marginTop: 14,
                fontWeight: "600",
              }}
            >
              Topup More
            </Text>
          </TouchableOpacity>
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
            {step === BASE_STEPS.COUNTRY && (
              <StepCountry
                country={country}
                onOpen={() => setCountryOpen(true)}
              />
            )}

            {step === BASE_STEPS.NUMBER && (
              <StepNumber
                dial={dial}
                country={country}
                value={localNumber}
                onChange={setLocalNumber}
                operator={operator}
                onEditCountry={() => jumpTo(BASE_STEPS.COUNTRY)}
                openContacts={() =>
                  navigation.navigate("ContactPicker", {
                    cc: country?.code,
                    onSelect: (num) =>
                      setLocalNumber(String(num).replace(/\D/g, "")),
                  })
                }
              />
            )}

            {step === BASE_STEPS.AMOUNT && (
              <StepAmount
                product={product}
                setProduct={setProduct}
                customUsd={customUsd}
                setCustomUsd={(v) => {
                  // typing => treat as custom, unlock product
                  setCustomUsd(v);
                  if (product && !product.custom) setProduct(null);
                }}
                usd={usd}
                afn={afn}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              />
            )}

            {!isB2B && step === BASE_STEPS.PAY && (
              <StepPay
                method={method}
                setMethod={setMethod}
                cardType={cardType}
                setCardType={setCardType}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cvv={cvv}
                setCvv={setCvv}
                exp={exp}
                setExp={setExp}
                paypalEmail={paypalEmail}
                setPaypalEmail={setPaypalEmail}
                summary={{
                  mobile: `${dial} ${formatLocal(localNumber)}`,
                  usd,
                  afn,
                }}
                onEditAmount={() => jumpTo(BASE_STEPS.AMOUNT)}
              />
            )}

            <PrimaryButton
              label={
                step === lastStep
                  ? isB2B
                    ? "Send Top-up"
                    : "Pay & Top-up"
                  : "Continue"
              }
              onPress={goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
            />
            {step > 0 && (
              <PrimaryButton
                label="Back"
                onPress={goBack}
                style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Country picker */}
      <Modal
        transparent
        visible={countryOpen}
        animationType="fade"
        onRequestClose={() => setCountryOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setCountryOpen(false)}
                style={{ padding: 6 }}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(it) => it.code}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setCountry(item);
                    setCountryOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>
                    {codeToFlag(item.code)}
                  </Text>
                  <Text
                    style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ marginRight: 6, color: "#7A7A7A" }}>
                    {DIAL_CODES[item.code] || ""}
                  </Text>
                  {item.code === country?.code && (
                    <Ionicons
                      name="checkmark-circle"
                      color={Colors.primary}
                      size={18}
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

/* ---------- Step blocks ---------- */

function StepCountry({ country, onOpen }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>Select country you want to send</Text>
      <TouchableOpacity
        style={styles.dropField}
        onPress={onOpen}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>
            {codeToFlag(country?.code || "AF")}
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: 14 }}>
            {country?.name}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#7A7A7A" />
      </TouchableOpacity>
    </View>
  );
}

function StepNumber({
  dial,
  country,
  value,
  onChange,
  operator,
  onEditCountry,
  openContacts,
}) {
  const formatted = formatLocal(value);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>Mobile Number</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={styles.editLink}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEditCountry}>
            <Text style={styles.editLink}>Change country</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.phoneRow}>
        <View style={styles.phonePrefix}>
          <Text style={{ fontSize: 18, marginRight: 6 }}>
            {codeToFlag(country?.code)}
          </Text>
          <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>
            {dial}
          </Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 9))}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#B8B8B8"
          style={styles.phoneInput}
        />
        <TouchableOpacity
          onPress={openContacts}
          style={{ paddingHorizontal: 10, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={22} color="#A9A9A9" />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10, minHeight: 24 }}>
        {operator ? (
          <View
            style={[
              styles.operatorPill,
              {
                backgroundColor: hexFade(operator.color, 0.14),
                borderColor: operator.color,
              },
            ]}
          >
            <Ionicons
              name="radio-outline"
              size={14}
              color={operator.color}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{ color: operator.color, fontWeight: "600", fontSize: 12 }}
            >
              {operator.name}
            </Text>
          </View>
        ) : (
          <Text style={{ color: "#9E9E9E", fontSize: 12 }}>
            We’ll detect the operator automatically
          </Text>
        )}
      </View>
    </View>
  );
}

function StepAmount({
  product,
  setProduct,
  customUsd,
  setCustomUsd,
  usd,
  afn,
  onEditNumber,
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>How much do you want Top-up?</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={styles.editLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.smallLabel}>Amount</Text>
      <View style={styles.customRow}>
        <Text style={styles.currencyTag}>USD</Text>
        <TextInput
          value={customUsd}
          onChangeText={setCustomUsd}
          placeholder="0.00"
          keyboardType="decimal-pad"
          style={styles.customInput}
          // product is automatically cleared in parent when typing
        />
        <TouchableOpacity
          style={[styles.clearBtn, { opacity: customUsd ? 1 : 0.5 }]}
          disabled={!customUsd}
          onPress={() => {
            setCustomUsd("");
            setProduct(null);
          }}
        >
          <Ionicons name="close-circle" size={18} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
      <Text style={styles.equivText}>{afn || 0} AFN (est.)</Text>

      <View style={{ height: 10 }} />

      <View style={{ rowGap: 12 }}>
        {TOPUP_PRODUCTS.filter((p) => !p.custom).map((p) => {
          const active = product?.id === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.amountCell, active && styles.amountCellActive]}
              activeOpacity={0.85}
              onPress={() => {
                setProduct(p);
                setCustomUsd(String(p.usd)); // sync input
              }}
            >
              <Text
                style={[styles.afnLeft, active && { color: Colors.primary }]}
              >
                {p.afn} AFN
              </Text>
              <Text
                style={[styles.usdRight, active && { color: Colors.primary }]}
              >
                {p.usd} USD {p.popular ? "★" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function StepPay({
  method,
  setMethod,
  cardType,
  setCardType,
  cardNumber,
  setCardNumber,
  cvv,
  setCvv,
  exp,
  setExp,
  paypalEmail,
  setPaypalEmail,
  summary,
  onEditAmount,
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <PaymentMethodToggle
        methods={[
          { key: "card", label: "Card", icon: "card-outline" },
          { key: "paypal", label: "PayPal", icon: "logo-paypal" },
        ]}
        selected={method}
        onSelect={setMethod}
      />

      {method === "card" ? (
        <>
          <Text style={styles.smallLabel}>Card</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.85}
            onPress={() => {}}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="card-outline"
                size={18}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text>{cardType}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#000" />
          </TouchableOpacity>

          <Text style={styles.smallLabel}>Card Number</Text>
          <InputField
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="1234–5678–9101–1121"
            keyboardType="number-pad"
          />

          <Text style={styles.smallLabel}>CVV/CVC</Text>
          <InputField
            value={cvv}
            onChangeText={setCvv}
            placeholder="***"
            keyboardType="number-pad"
          />

          <Text style={styles.smallLabel}>Expiration Date</Text>
          <InputField
            value={exp}
            onChangeText={setExp}
            placeholder="04/25"
            keyboardType="number-pad"
          />
        </>
      ) : (
        <>
          <Text style={styles.smallLabel}>PayPal Email</Text>
          <InputField
            value={paypalEmail}
            onChangeText={setPaypalEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
        </>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Mobile Number</Text>
          <Text style={styles.summaryValue}>{summary.mobile}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Your sending</Text>
          <Text style={styles.summaryValue}>{summary.afn} AFN</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Fee</Text>
          <Text style={styles.summaryValue}>0.2 USD</Text>
        </View>
        <View
          style={[
            styles.summaryRow,
            {
              borderTopWidth: 1,
              borderTopColor: "#F2F2F2",
              paddingTop: 8,
              marginTop: 6,
            },
          ]}
        >
          <Text style={[styles.summaryKey, { fontWeight: "700" }]}>
            Total Amount
          </Text>
          <Text
            style={[
              styles.summaryValue,
              { color: Colors.primary, fontWeight: "700" },
            ]}
          >
            {(summary.usd + 0.2).toFixed(2)} USD
          </Text>
        </View>
        <TouchableOpacity onPress={onEditAmount} style={{ marginTop: 8 }}>
          <Text style={[styles.editLink, { alignSelf: "flex-end" }]}>
            Change amount
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- utils & styles ---------- */

function formatLocal(s) {
  const d = s.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}`;
}
function hexFade(hex, op) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  smallLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },

  dropField: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  editLink: { color: Colors.primary, fontSize: 13, fontWeight: "600" },

  phoneRow: {
    flexDirection: "row",
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#fff",
  },
  phonePrefix: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#EEE",
    backgroundColor: "#FAFAFA",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  operatorPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 48,
  },
  currencyTag: { fontWeight: "700", marginRight: 8, color: Colors.textPrimary },
  customInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  clearBtn: { padding: 6 },
  equivText: { fontSize: 12, color: "#9E9E9E", marginTop: 6 },

  amountCell: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF7F4",
    borderWidth: 1,
    borderColor: "#F7E7E5",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountCellActive: { backgroundColor: "#FFECE8", borderColor: Colors.primary },
  afnLeft: { fontSize: 15, color: Colors.textPrimary, fontWeight: "600" },
  usdRight: { fontSize: 14, color: Colors.textSecondary },

  dropdown: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },

  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#F2DAD7",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryKey: { color: Colors.textSecondary, fontSize: 13 },
  summaryValue: { color: Colors.textPrimary, fontSize: 13 },

  // success UI
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
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  kv: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  k: { color: Colors.textSecondary, fontSize: 13 },
  v: { color: Colors.textPrimary, fontSize: 13 },
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
