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
import PrimaryButton from "../components/PrimaryButton";
import DotIndicators from "../components/DotIndicators";
import InputField from "../components/InputField";
import PaymentMethodToggle from "../components/PaymentMethodToggle";
import { COUNTRIES as ALL_COUNTRIES } from "../constants/countries";
import { BUNDLE_CATEGORIES, DATA_BUNDLES } from "../constants/dataBundles";
import { USD_TO_AFN } from "../constants/rates";
import { codeToFlag } from "../utils/flag";
import { DIAL_CODES, guessOperator } from "../constants/dialing";
import { useAuth } from "../auth/AuthProvider";

const STEPS = { COUNTRY: 0, NUMBER: 1, PRODUCT: 2 };
const PAY_STEP = 3; // only used for B2C

export default function DataFlowScreen({ navigation }) {
  const { user } = useAuth?.() || { user: null };
  const isB2B = (user?.role || "").toLowerCase().includes("b2b");

  // Dots / step boundaries
  const totalSteps = isB2B ? 3 : 4;
  const lastStep = isB2B ? STEPS.PRODUCT : PAY_STEP;

  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(0);

  // Country
  const defaultAf = useMemo(
    () => ALL_COUNTRIES.find((c) => c.code === "AF") || ALL_COUNTRIES[0],
    []
  );
  const [country, setCountry] = useState(defaultAf);
  const [countryOpen, setCountryOpen] = useState(false);

  // Number (local, no leading 0)
  const [localNumber, setLocalNumber] = useState("");
  const dial = DIAL_CODES[country?.code] || "";
  const operator = guessOperator(country?.code, localNumber.replace(/\D/g, ""));

  // Products
  const allBundles = DATA_BUNDLES[country?.code] || [];
  const [category, setCategory] = useState(BUNDLE_CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState(null);

  const filtered = useMemo(() => {
    const byCat = category
      ? allBundles.filter((b) => b.category === category)
      : allBundles;
    if (!search.trim()) return byCat;
    const q = search.trim().toLowerCase();
    return byCat.filter((b) =>
      `${b.desc} ${b.usd} ${b.afn}`.toLowerCase().includes(q)
    );
  }, [allBundles, category, search]);

  // Amounts
  const usd = product?.usd || 0;
  const afn = product?.afn || Math.round(usd * USD_TO_AFN);

  // Payment (B2C only)
  const [method, setMethod] = useState("card");
  const [cardType, setCardType] = useState("Master Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [exp, setExp] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // Guards
  const canNext =
    (step === STEPS.COUNTRY && !!country) ||
    (step === STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7) ||
    (step === STEPS.PRODUCT && !!product) ||
    (!isB2B &&
      step === PAY_STEP &&
      ((method === "card" && cardNumber && cvv && exp) ||
        (method === "paypal" && paypalEmail)));

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());

  const goNext = () => {
    if (!canNext) return;

    if (step === lastStep) {
      // Inline success
      setSuccess({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        txId: "#DB" + Math.floor(100000 + Math.random() * 899999),
        date: new Date().toISOString(),
        product,
        method: isB2B ? "wallet" : method,
      });
      return;
    }
    setStep(step + 1);
  };

  const jumpTo = (i) => setStep(i);

  // Reset number/products when country changes
  useEffect(() => {
    setLocalNumber("");
    setProduct(null);
    setCategory(BUNDLE_CATEGORIES[0]);
    setSearch("");
  }, [country?.code]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Internet" onBack={goBack} />

      <View style={{ paddingTop: 6, alignItems: "center" }}>
        <DotIndicators
          total={totalSteps}
          activeIndex={
            success ? totalSteps - 1 : Math.min(step, totalSteps - 1)
          }
        />
      </View>

      {success ? (
        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: "center" }}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={56} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Bundle Sent!</Text>

          <View style={styles.kv}>
            <Text style={styles.k}>Receiver Number</Text>
            <Text style={styles.v}>{success.mobile}</Text>
          </View>
          <View style={styles.kv}>
            <Text style={styles.k}>Plan</Text>
            <Text style={styles.v}>{success.product?.desc}</Text>
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
            <Text style={styles.totalValue}>
              {usd} USD • {afn} AFN
            </Text>
          </View>

          <PrimaryButton
            label="Done"
            onPress={() => navigation.popToTop()}
            style={{ width: "100%" }}
          />
          <TouchableOpacity
            onPress={() => {
              setSuccess(null);
              setStep(0);
              setProduct(null);
              setSearch("");
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
              Send another bundle
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
            {step === STEPS.COUNTRY && (
              <StepCountry
                country={country}
                onOpen={() => setCountryOpen(true)}
              />
            )}

            {step === STEPS.NUMBER && (
              <StepNumber
                dial={dial}
                country={country}
                value={localNumber}
                onChange={setLocalNumber}
                operator={operator}
                onEditCountry={() => jumpTo(STEPS.COUNTRY)}
                openContacts={() =>
                  navigation.navigate("ContactPicker", {
                    cc: country?.code,
                    onSelect: (num) =>
                      setLocalNumber(normalizeImported(num, country?.code)),
                  })
                }
              />
            )}

            {step === STEPS.PRODUCT && (
              <StepProducts
                country={country}
                category={category}
                setCategory={setCategory}
                search={search}
                setSearch={setSearch}
                list={filtered}
                product={product}
                setProduct={setProduct}
                onEditNumber={() => jumpTo(STEPS.NUMBER)}
                summary={{ dial, localNumber, usd, afn }}
              />
            )}

            {!isB2B && step === PAY_STEP && (
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
                  plan: product?.desc,
                }}
                onEditAmount={() => jumpTo(STEPS.PRODUCT)}
              />
            )}

            <PrimaryButton
              label={
                step === lastStep
                  ? isB2B
                    ? "Send Bundle"
                    : "Pay & Send"
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
              data={ALL_COUNTRIES}
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
          onChangeText={(t) => {
            let d = t.replace(/\D/g, "");
            if (d.startsWith("0")) d = d.slice(1);
            onChange(d.slice(0, 9));
          }}
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

function StepProducts({
  country,
  category,
  setCategory,
  search,
  setSearch,
  list,
  product,
  setProduct,
  onEditNumber,
  summary,
}) {
  const renderItem = ({ item }) => {
    const active = product?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.bundleCard, active && styles.bundleCardActive]}
        onPress={() => setProduct(item)}
        activeOpacity={0.85}
      >
        <Text style={[styles.bundleDesc, active && { color: Colors.primary }]}>
          {item.desc}
        </Text>
        <Text style={[styles.bundlePrice, active && { color: Colors.primary }]}>
          {item.usd} USD • {item.afn} AFN
        </Text>
        {!!item.popular && <Text style={styles.popularTag}>★ Popular</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.editHeader}>
        <Text style={styles.sectionTitle}>Choose a Bundle</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={styles.editLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.smallLabel}>Country</Text>
      <View style={styles.countryBadge}>
        <Text style={{ fontSize: 16, marginRight: 6 }}>
          {codeToFlag(country?.code)}
        </Text>
        <Text style={{ fontWeight: "600", color: Colors.textPrimary }}>
          {country?.name}
        </Text>
      </View>

      <Text style={styles.smallLabel}>Bundle Category</Text>
      <View style={styles.tabsRow}>
        {BUNDLE_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.tabChip, category === c && styles.tabChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text
              style={[
                styles.tabChipText,
                category === c && { color: Colors.primary },
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.smallLabel}>Search</Text>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={16}
          color="#9E9E9E"
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search bundle or price…"
          placeholderTextColor="#9E9E9E"
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {product && (
        <View style={styles.summaryCard}>
          <View className="row">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Mobile Number</Text>
              <Text style={styles.summaryValue}>
                {summary.dial} {formatLocal(summary.localNumber)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Plan</Text>
              <Text style={styles.summaryValue}>{product.desc}</Text>
            </View>
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
              Total
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: Colors.primary, fontWeight: "700" },
              ]}
            >
              {summary.usd} USD • {summary.afn} AFN
            </Text>
          </View>
        </View>
      )}
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
          <Text style={styles.summaryKey}>Plan</Text>
          <Text style={styles.summaryValue}>{summary.plan}</Text>
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
            Change bundle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- utils & styles ---------- */

function normalizeImported(num, cc) {
  let d = String(num || "").replace(/[^\d]/g, "");
  const dial = String(DIAL_CODES[cc] || "").replace("+", ""); // e.g. "93"
  if (d.startsWith("00" + dial)) d = d.slice(2 + dial.length);
  else if (d.startsWith(dial)) d = d.slice(dial.length);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 9);
}

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

  // product cards
  bundleCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    padding: 12,
  },
  bundleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: hexFade(Colors.primary, 0.06),
  },
  bundleDesc: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
    fontWeight: "600",
  },
  bundlePrice: { fontSize: 13, color: Colors.textSecondary },
  popularTag: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
  },

  // tabs
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  tabChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F3F4",
    justifyContent: "center",
  },
  tabChipActive: {
    backgroundColor: "#FFE5E5",
    borderWidth: 1,
    borderColor: "#FFC7C7",
  },
  tabChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },

  // search
  searchWrap: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // summary
  summaryCard: {
    marginTop: 14,
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

  // country modal
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

  // small UI bits
  countryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
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
});
