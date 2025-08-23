import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { DUMMY_AGENTS } from "../../constants/agents";
import ServiceHeader from "../../components/ServiceHeader";

const FILTERS = ["All", "Active", "Inactive"];

export default function AgentListScreen({ navigation }) {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  const data = useMemo(() => {
    const base =
      filter === "All"
        ? DUMMY_AGENTS
        : DUMMY_AGENTS.filter((a) => a.status === filter.toLowerCase());
    if (!q.trim()) return base;
    const s = q.trim().toLowerCase();
    return base.filter(
      (a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(s) ||
        a.phone.toLowerCase().includes(s) ||
        a.code.toLowerCase().includes(s)
    );
  }, [filter, q]);

  const renderItem = ({ item }) => {
    const name = `${item.firstName} ${item.lastName}`;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{item.location}</Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
          >
            <StatusPill status={item.status} />
            <Text style={styles.code}>{item.code}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate("AgentView", { agent: item })}
        >
          <Text style={styles.viewBtnText}>View Agent</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Agent" />

      <View style={styles.container}>
        {/* Filter pills */}
        <View style={styles.pillsRow}>
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search + Add Agent */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Search Contacts"
              placeholderTextColor="#9E9E9E"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AgentCreate")}
          >
            <Text style={styles.addBtnText}>Add Agent</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

function StatusPill({ status }) {
  const good = status === "active";
  return (
    <View
      style={[
        styles.statusPill,
        {
          borderColor: good ? "#16A34A" : "#D14343",
          backgroundColor: "transparent",
        },
      ]}
    >
      <Text
        style={{
          color: good ? "#16A34A" : "#D14343",
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {good ? "Active" : "Inactive"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  pillsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { color: Colors.textSecondary, fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  searchRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchInput: { marginLeft: 8, flex: 1, color: Colors.textPrimary },
  addBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700" },

  card: {
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 15, color: Colors.textPrimary, fontWeight: "700" },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  statusPill: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  code: { fontSize: 12, color: Colors.textSecondary },
  viewBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  viewBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
});
