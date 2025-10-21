import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { useUser } from "../../context/userContext";
import { getChildUsers, deleteDownlineAgent } from "../../services/merchantApi";

const FILTERS = ["All", "Active", "Inactive", "Suspended"];

export default function AgentListScreen({ navigation }) {
  const { user } = useUser();
  console.log(user, 'this is user of agent')
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [childUsers, setChildUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAgentList = async () => {
    try {
      setRefreshing(true);
      await loadAgents();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const filterParams = {};

      if (filter !== "All") {
        filterParams.status = filter.toLowerCase();
      }

      if (searchQuery) {
        filterParams.search = searchQuery;
      }

      const res = await getChildUsers(user?.id, filterParams);
      setChildUsers(res?.data || []);
    } catch (error) {
      console.error("Load agents error:", error);
      Alert.alert("Error", "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [filter, searchQuery]);

  const handleDeleteAgent = (agent) => {
    Alert.alert(
      "Delete Agent",
      `Are you sure you want to delete ${agent.user?.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(agent.user.id),
        },
      ]
    );
  };

  const confirmDelete = async (agentId) => {
    try {
      await deleteDownlineAgent(agentId);
      Alert.alert("Success", "Agent deleted successfully");
      refreshAgentList();
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete agent");
    }
  };

  const handleAssignSlab = (agent) => {
    navigation.navigate("AssignSlab", { agent, refreshAgentList });
  };

  const filteredData = useMemo(() => {
    return childUsers.filter(agent => {
      const matchesSearch = searchQuery ? 
        agent.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.user?.mobileNumber?.includes(searchQuery)
        : true;
      
      const matchesFilter = filter === "All" || 
        agent.user?.status?.toLowerCase() === filter.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }, [childUsers, searchQuery, filter]);

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.agentInfo}>
            <Text style={styles.name}>{item?.user?.username}</Text>
            <Text style={styles.email}>{item?.user?.email}</Text>
            <Text style={styles.phone}>{item?.user?.mobileNumber}</Text>
          </View>
          <StatusPill status={item?.user?.status} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commission:</Text>
            <Text style={styles.detailValue}>
              {item?.commissionRateDetails?.percentage 
                ? `${item.commissionRateDetails.percentage}%` 
                : "Not set"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Slab:</Text>
            <Text style={styles.detailValue}>
              {item?.commissionRateDetails?.slabTypeDetails?.title || "Not assigned"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item?.address || "Not set"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => navigation.navigate("AgentView", { agent: item, refreshAgentList })}
          >
            <Ionicons name="eye-outline" size={16} color={Colors.primary} />
            <Text style={[styles.actionText, styles.viewText]}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("AgentEdit", { agent: item, refreshAgentList })}
          >
            <Ionicons name="create-outline" size={16} color="#16A34A" />
            <Text style={[styles.actionText, styles.editText]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.slabBtn]}
            onPress={() => handleAssignSlab(item)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#8B5CF6" />
            <Text style={[styles.actionText, styles.slabText]}>Slab</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteAgent(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Manage Agents" />

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
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, email or phone..."
              placeholderTextColor="#9E9E9E"
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#9E9E9E" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AgentCreate", { refreshAgentList })}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Agent</Text>
          </TouchableOpacity>
        </View>

        {/* Results count */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredData.length} agent{filteredData.length !== 1 ? 's' : ''} found
            {searchQuery ? ` for "${searchQuery}"` : ''}
            {filter !== 'All' ? ` (${filter})` : ''}
          </Text>
        </View>

        {/* Agents List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text>Loading agents...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshAgentList}
                colors={[Colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9E9E9E" />
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? `No agents found for "${searchQuery}"`
                    : "No agents found"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first agent"}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StatusPill({ status }) {
  const statusConfig = {
    active: { color: "#16A34A", label: "Active" },
    inactive: { color: "#6B7280", label: "Inactive" },
    suspended: { color: "#DC2626", label: "Suspended" },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <View
      style={[
        styles.statusPill,
        {
          borderColor: config.color,
          backgroundColor: `${config.color}15`,
        },
      ]}
    >
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
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
    flexDirection: "row",
    gap: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  resultsInfo: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  card: {
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  agentInfo: {
    flex: 1,
  },
  name: { fontSize: 16, color: Colors.textPrimary, fontWeight: "700" },
  email: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  statusPill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardBody: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  viewBtn: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  editBtn: {
    borderColor: "#16A34A",
    backgroundColor: "#16A34A15",
  },
  slabBtn: {
    borderColor: "#8B5CF6",
    backgroundColor: "#8B5CF615",
  },
  deleteBtn: {
    borderColor: "#DC2626",
    backgroundColor: "#DC262615",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewText: { color: Colors.primary },
  editText: { color: "#16A34A" },
  slabText: { color: "#8B5CF6" },
  deleteText: { color: "#DC2626" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});