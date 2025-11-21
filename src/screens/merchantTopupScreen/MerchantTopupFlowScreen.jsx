import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import PrimaryButton from "../../components/PrimaryButton";
import DotIndicators from "../../components/DotIndicators";
import { DIAL_CODES } from "../../constants/dialing";
import { useAuth } from "../../auth/AuthProvider";
import { getCountries, makeRechargeAgent } from "../../services/merchantApi";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import StepCountry from "./StepCountry";
import StepNumber from "../topupScreen/StepNumber";
import StepPay from "./StepPay";
import SuccessScreen from "./SuccessScreen";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";

const BASE_STEPS = { COUNTRY: 0, NUMBER: 1, PAY: 2 };

export default function MerchantTopupFlow({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth?.() || { user: null };
  const stepsCount = 3;
  const lastStep = BASE_STEPS.PAY;
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const defaultAf = useMemo(
    () => countries.find((c) => c.countryCode === "AF") || countries[0],
    [countries]
  );
  const [country, setCountry] = useState(defaultAf);
  const [localNumber, setLocalNumber] = useState("");
  const [amountAfn, setAmountAfn] = useState("");

  useEffect(() => {
    const getAllCountries = async () => {
      const res = await getCountries();
      console.log(res, "this is countries response💖💖😢💖💖");
      setCountries(res?.data);
      const afgCountry = res.data.find((c) => c.countryCode === "AF");
      setCountry(afgCountry);
    };

    getAllCountries();
  }, []);

  const dial = DIAL_CODES[country?.countryCode] || "";


  const canNext =
    (step === BASE_STEPS.COUNTRY && !!country) ||
    (step === BASE_STEPS.NUMBER && localNumber.replace(/\D/g, "").length >= 7 && amountAfn > 0) ||
    (step === BASE_STEPS.PAY);

  const goBack = () => (step > 0 ? setStep(step - 1) : navigation.goBack());
  const goNext = () => canNext && setStep(step + 1);
  const jumpTo = (i) => setStep(i);


  useEffect(() => {
    setLocalNumber("");
  }, [country?.countryCode]);

  const recharge = async () => {
    try {
      const operatorId = getSetaraganMnoId(localNumber);

      if (!operatorId) {
        Alert.alert(t('invalidNumber'), t('invalidMobileNetwork'));
        return;
      }
      
      const payload = {
        amount: amountAfn,
        companyId: "",
        countryId: country?.id,
        currency: "AFN",
        operator: operatorId,
        productId: 2,
        receiver: localNumber,
        source: "agent_stock"
      };

      const res = await makeRechargeAgent(payload);
      setSuccess({
        mobile: `${dial} ${formatLocal(localNumber)}`,
        amountUsd: amountAfn,
        txId: res?.txnNumber,
        date: new Date().toISOString(),
      });
      goNext();
      
    } catch (error) {
      console.log("this is Recharge error: ", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        t('failedToRecharge');
    
      console.log("this is recharge error:", message);
      Alert.alert(t('rechargeFailed'), message);
    }
  };

  const handleTopupMore = () => {
    setSuccess(null);
    setStep(0);
    setLocalNumber("");
    setAmountAfn("");
  };

  const handleContactSelect = (num) => {
    setLocalNumber(String(num).replace(/\D/g, ""));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title={t('mobileTopup')} onBack={goBack} />

      <View style={styles.stepper}>
        <DotIndicators
          total={stepsCount}
          activeIndex={success ? stepsCount - 1 : step}
        />
      </View>

      {success ? (
        <SuccessScreen
          success={success}
          onDone={() => navigation.popToTop()}
          onTopupMore={handleTopupMore}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
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
                amountAfn={amountAfn}
                onAmountChange={setAmountAfn}
                onEditCountry={() => jumpTo(BASE_STEPS.COUNTRY)}
                openContacts={() =>
                  navigation.navigate("ContactPicker", {
                    cc: country?.countryCode,
                    onSelect: handleContactSelect,
                  })
                }
              />
            )}

            {step === BASE_STEPS.PAY && (
              <StepPay
                summary={{
                  mobile: `${dial} ${formatLocal(localNumber)}`,
                  amount: amountAfn,
                }}
                onEditNumber={() => jumpTo(BASE_STEPS.NUMBER)}
              />
            )}

            <PrimaryButton
              label={step === lastStep ? t('sendTopup') : t('continue')}
              onPress={step === lastStep ? recharge : goNext}
              style={{ marginTop: 24, opacity: canNext ? 1 : 0.5 }}
            />
            {step > 0 && (
              <PrimaryButton
                label={t('back')}
                onPress={goBack}
                style={{ marginTop: 12, backgroundColor: "#4A4A4A" }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <CountryModal
        visible={countryOpen}
        countries={countries}
        selectedCountry={country}
        onSelect={setCountry}
        onClose={() => setCountryOpen(false)}
      />
    </SafeAreaView>
  );
}

function CountryModal({ visible, countries, selectedCountry, onSelect, onClose }) {
  const { t } = useTranslation();
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={countries}
            keyExtractor={(it) => it.countryCode}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <CountryModalItem
                item={item}
                isSelected={item.countryCode === selectedCountry?.countryCode}
                onSelect={onSelect}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function CountryModalItem({ item, isSelected, onSelect }) {
  return (
    <TouchableOpacity
      style={styles.modalRow}
      onPress={() => onSelect(item)}
      activeOpacity={0.85}
    >
      <Text style={{ fontSize: 18, marginRight: 8 }}>
        {codeToFlag(item.countryCode)}
      </Text>
      <Text style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }}>
        {item.countryName}
      </Text>
      <Text style={{ marginRight: 6, color: "#7A7A7A" }}>
        {DIAL_CODES[item.countryCode] || ""}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" color={Colors.primary} size={18} />
      )}
    </TouchableOpacity>
  );
}

function formatLocal(s) {
  const d = s.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  stepper: {
    paddingTop: scale.hp(0.8),
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: scale.wp(5.8),
    paddingBottom: scale.hp(3.9),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: scale.hp(3.1),
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.8),
    padding: scale.hp(1.8),
    maxHeight: "70%",
    elevation: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scale.hp(1.05),
  },
  modalTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale.hp(1.3),
    paddingHorizontal: scale.wp(1.5),
    borderRadius: scale.hp(1.05),
    backgroundColor: "#fff",
  },
});