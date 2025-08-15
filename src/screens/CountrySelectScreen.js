import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { COUNTRIES } from "../constants/countries";
import { codeToFlag } from "../utils/flag";

export default function CountrySelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [booting, setBooting] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const cc = await AsyncStorage.getItem("countryCode");
        if (cc) {
          navigation.replace("Onboarding");
          return;
        }
      } catch {}
      setBooting(false);
    })();
  }, [navigation]);

  const onContinue = useCallback(async () => {
    if (!selected) return;
    await AsyncStorage.setItem("countryCode", selected.code);
    navigation.replace("Onboarding");
  }, [selected, navigation]);

  const data = useMemo(() => COUNTRIES, []);

  const renderItem = useCallback(
    ({ item, index }) => {
      const active = selected?.code === item.code;
      return (
        <TouchableOpacity
          onPress={() => setSelected(item)}
          activeOpacity={0.9}
          style={[
            styles.row,
            index === 0 && styles.rowFirst,
            index === data.length - 1 && styles.rowLast,
          ]}
        >
          <Text style={styles.flag}>{codeToFlag(item.code)}</Text>
          <Text style={styles.country}>{item.name}</Text>
          {active && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selected, data.length]
  );

  if (booting) {
    return (
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.full}
      >
        <ActivityIndicator color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.full}
      >
        {/* Centered column with fixed side padding */}
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 132,
              paddingBottom: 22,
              paddingHorizontal: 20,
            },
          ]}
        >
          <Text style={styles.title}>Welcome</Text>

          {/* Faux dropdown (full width of the column) */}
          <View style={styles.selectBox}>
            <Text style={styles.selectLabel}>
              {selected ? selected.name : "Select your country"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#fff" />
          </View>

          {/* White card list (aligned exactly under the dropdown) */}
          <View style={styles.card}>
            <FlatList
              data={data}
              keyExtractor={(it) => it.code}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.hairline} />}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Gold gradient pill CTA */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 18, paddingHorizontal: 20 },
          ]}
        >
          <TouchableOpacity
            disabled={!selected}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, !selected && { opacity: 0.5 }]}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const GRADIENT = ["#D70000", "#E52421", "#F0533F"];
const CTA_GRADIENT = ["#F6B12A", "#E59A12"];
const CARD_RADIUS = 12;

const styles = StyleSheet.create({
  full: { flex: 1 },

  content: {
    alignItems: "center", // centers the column
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 46, // space between title and dropdown
  },

  selectBox: {
    alignSelf: "stretch",
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 10,
  },
  selectLabel: { color: "#fff", fontSize: 14, fontWeight: "500" },

  card: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  rowFirst: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  rowLast: {
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: "#EFEFEF" },

  flag: { fontSize: 20, marginRight: 12 },
  country: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  footer: { paddingTop: 14 },
  cta: {
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
