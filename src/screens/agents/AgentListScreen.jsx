import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { useUser } from "../../context/userContext";
import { getChildUsers, deleteDownlineAgent } from "../../services/merchantApi";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const FILTERS = ["All", "Active", "Inactive"];

export default function AgentListScreen({ navigation }) {
  const { user } = useUser();
  const { t } = useTranslation();
  console.log(user, 'this is user of agent');
  
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [childUsers, setChildUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, [filter, searchQuery]);

  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteDownlineAgent(agentToDelete.user.id);
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      refreshAgentList();
    } catch (error) {
      console.error("Delete error:", error);
      setShowDeleteModal(false);
      setShowErrorModal(true);
    } finally {
      setDeleteLoading(false);
      setAgentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAgentToDelete(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return t('active');
      case 'inactive': return t('inactive');
      default: return status;
    }
  };

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
            <Text style={styles.detailLabel}>{t('commission')}:</Text>
            <Text style={styles.detailValue}>
              {item?.commissionRateDetails?.percentage 
                ? `${item.commissionRateDetails.percentage}%` 
                : t('notSet')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('currentSlab')}:</Text>
            <Text style={styles.detailValue}>
              {item?.commissionRateDetails?.slabTypeDetails?.title || t('notAssigned')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('address')}:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item?.address || t('notSet')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('created')}:</Text>
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
            <Text style={[styles.actionText, styles.viewText]}>{t('view')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("AgentEdit", { agent: item, refreshAgentList })}
          >
            <Ionicons name="create-outline" size={16} color="#16A34A" />
            <Text style={[styles.actionText, styles.editText]}>{t('edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.slabBtn]}
            onPress={() => handleAssignSlab(item)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#8B5CF6" />
            <Text style={[styles.actionText, styles.slabText]}>{t('slab')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteAgent(item)}
            disabled={deleteLoading}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={[styles.actionText, styles.deleteText]}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: 100 }}>
      <ServiceHeader title={t('manageAgents')} />

      <View style={styles.container}>
        <View style={styles.pillsRow}>
          {FILTERS.map((f) => {
            const active = f === filter;
            let btnStyle, textStyle;
            
            if (f === "All") {
              btnStyle = active ? styles.allBtnActive : styles.allBtn;
              textStyle = active ? styles.allTextActive : styles.allText;
            } else if (f === "Active") {
              btnStyle = active ? styles.activeBtnActive : styles.activeBtn;
              textStyle = active ? styles.activeTextActive : styles.activeText;
            } else {
              btnStyle = active ? styles.inactiveBtnActive : styles.inactiveBtn;
              textStyle = active ? styles.inactiveTextActive : styles.inactiveText;
            }

            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterPill, btnStyle]}
              >
                <Text style={[styles.filterPillText, textStyle]}>
                  {t(f.toLowerCase())}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchPlaceholder')}
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
            <Text style={styles.addBtnText}>{t('addAgent')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredData.length} {t('agentFound', { count: filteredData.length })}
            {searchQuery ? ` ${t('for')} "${searchQuery}"` : ''}
            {filter !== 'All' ? ` (${t(filter.toLowerCase())})` : ''}
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text>{t('loadingAgents')}</Text>
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
                    ? t('noAgentsFoundForSearch', { query: searchQuery })
                    : t('noAgentsFound')}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? t('tryAdjustingSearch')
                    : t('getStartedByCreatingAgent')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title={t('deleteAgent')}
        message={t('deleteAgentConfirmation')}
        itemName={agentToDelete?.user?.username}
        isLoading={deleteLoading}
        confirmText={t('deleteAgent')}
        cancelText={t('cancel')}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('agentDeletedSuccessfully')}
        message={t('agentPermanentlyRemoved')}
        buttonText={t('continue')}
        autoHideDuration={0}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('failedToDeleteAgent')}
        message={t('deleteAgentError')}
        buttonText={t('tryAgain')}
        showRetryButton={true}
      />

      {deleteLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>{t('deletingAgent')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatusPill({ status }) {
  const { t } = useTranslation();
  
  const statusConfig = {
    active: { color: "#16A34A", label: t('active') },
    inactive: { color: "#6B7280", label: t('inactive') },
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
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(5.8),
    paddingTop: scale.hp(1.3),
  },
  pillsRow: {
    flexDirection: "row",
    gap: scale.wp(2.4),
    marginBottom: scale.hp(1.55),
    justifyContent: "space-between",
  },
  filterPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale.wp(1),
    paddingVertical: scale.hp(1),
    borderRadius: scale.hp(0.8),
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: scale.hp(1.55),
    fontWeight: "600",
  },
  allBtn: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  allBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  allText: {
    color: Colors.primary,
  },
  allTextActive: {
    color: "#fff",
  },
  activeBtn: {
    borderColor: "#16A34A",
    backgroundColor: "#16A34A15",
  },
  activeBtnActive: {
    borderColor: "#16A34A",
    backgroundColor: "#16A34A",
  },
  activeText: {
    color: "#16A34A",
  },
  activeTextActive: {
    color: "#fff",
  },
  inactiveBtn: {
    borderColor: "#6B7280",
    backgroundColor: "#6B728015",
  },
  inactiveBtnActive: {
    borderColor: "#6B7280",
    backgroundColor: "#6B7280",
  },
  inactiveText: {
    color: "#6B7280",
  },
  inactiveTextActive: {
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    gap: scale.wp(2.4),
    marginBottom: scale.hp(1.55),
  },
  searchBox: {
    flex: 1,
    height: scale.hp(5.7),
    borderRadius: scale.hp(1.3),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: scale.wp(2.4),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchInput: {
    marginLeft: scale.wp(2),
    flex: 1,
    color: Colors.textPrimary,
  },
  addBtn: {
    height: scale.hp(5.7),
    paddingHorizontal: scale.wp(3.4),
    borderRadius: scale.hp(1.3),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: scale.wp(1.5),
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  resultsInfo: {
    marginBottom: scale.hp(1.55),
  },
  resultsText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  card: {
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    gap: scale.hp(1.55),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  agentInfo: {
    flex: 1,
  },
  name: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  email: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  phone: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.15),
  },
  statusPill: {
    paddingHorizontal: scale.wp(2.4),
    height: scale.hp(3.1),
    borderRadius: scale.hp(1.55),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: scale.hp(1.3),
    fontWeight: "700",
  },
  cardBody: {
    gap: scale.hp(0.8),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: scale.hp(1.55),
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: scale.wp(2),
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale.wp(2),
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale.wp(1),
    paddingVertical: scale.hp(1),
    borderRadius: scale.hp(0.8),
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
    fontSize: scale.hp(1.55),
    fontWeight: "600",
  },
  viewText: {
    color: Colors.primary,
  },
  editText: {
    color: "#16A34A",
  },
  slabText: {
    color: "#8B5CF6",
  },
  deleteText: {
    color: "#DC2626",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale.hp(6.2),
  },
  emptyText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.55),
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});