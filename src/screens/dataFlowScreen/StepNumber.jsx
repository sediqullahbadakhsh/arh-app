import { useState } from "react";
import formatLocal from "../../utils/formatLocal";
import DataStyles from "./DataStyles";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "../../theme/colors";
import { codeToFlag } from "../../utils/flag";
import { Ionicons } from "@expo/vector-icons";

function StepNumber({
  dial,
  country,
  value,
  onChange,
  localNumber,
  operator,
  onEditCountry,
  openContacts,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const formatted = formatLocal(value);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={DataStyles.editHeader}>
        <Text style={DataStyles.sectionTitle}>Mobile Number</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <TouchableOpacity onPress={openContacts}>
            <Text style={DataStyles.editLink}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEditCountry}>
            <Text style={DataStyles.editLink}>Change country</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[
        DataStyles.phoneRow,
        {
          borderColor: isFocused ? Colors.primary : '#E4E7EC',
          backgroundColor: '#FFFFFF',
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: isFocused ? 10 : 0,
          elevation: isFocused ? 3 : 0,
          transform: [{ scale: isFocused ? 1.005 : 1 }]
        }
      ]}>
        <View style={DataStyles.phonePrefix}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>
            {codeToFlag(country?.countryCode)}
          </Text>
          <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>
            {dial}
          </Text>
        </View>
        <TextInput
          value={formatted}
          onChangeText={(t) => {
            const trimmed = t.trim();
            if (t.startsWith("0") && trimmed.length === 0) {
              Alert.alert(
                "Invalid Number",
                "Please start your phone number with 7 instead of 0, as the 0 is already included in your country code."
              );
              const numeric = trimmed.replace(/^0+/, "");
              onChange(numeric);
              return;
            }
            onChange(t.replace(/\D/g, "").slice(0, 9));
          }}
          keyboardType="number-pad"
          placeholder="700-000-000"
          placeholderTextColor="#9E9E9E"
          style={DataStyles.phoneInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <TouchableOpacity
          onPress={openContacts}
          style={{ paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10, minHeight: 24 }}>
        {operator ? (
          <View
            style={[
              DataStyles.operatorPill,
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
          value.length > 0 && (
            <Text style={{ color: "#9E9E9E", fontSize: 12 }}>
              We'll detect the operator automatically
            </Text>
          )
        )}
      </View>
    </View>
  );
}

function hexFade(hex, op) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${op})`;
}

export default StepNumber;