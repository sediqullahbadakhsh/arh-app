import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getCustomerTickets, getTicketTypesC } from "../../services/ticketService";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";
import CreateTicketModal from "./CreateTicketModal";
import ViewTicketModal from "./ViewTicketModal";

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    pending: {
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      label: t('support.statusOptions.pending')
    },
    resolved: {
      color: "#059669",
      backgroundColor: "#D1FAE5",
      label: t('support.statusOptions.resolved')
    },
    rejected: {
      color: "#DC2626",
      backgroundColor: "#FEE2E2",
      label: t('support.statusOptions.rejected')
    }
  };

  const config = statusConfig[status] || {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    label: status
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

export default function SupportScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketTypes, setTicketTypes] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    ticketTypeId: "",
  });

  const fetchTickets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {
        page: 1,
        limit: 50,
        search: searchQuery,
        ...filters
      };

      const response = await getCustomerTickets(params);
      setData(response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      Alert.alert(t('error'), t('support.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const response = await getTicketTypesC();
      setTicketTypes(response || []);
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTicketTypes();
  }, [searchQuery, filters]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTickets();
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      ticketTypeId: "",
    });
    setSearchQuery("");
  };

  const isAnyFilterApplied = searchQuery || filters.status || filters.ticketTypeId;

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.ticketCard}
      onPress={() => handleViewTicket(item)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketLeft}>
          <Text style={styles.ticketType}>
            {item.ticketType?.name || t('support.unknownType')}
          </Text>
          <Text style={styles.ticketDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.ticketBody}>
        <Text style={styles.ticketDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {item.mobileNumber && (
          <View style={styles.ticketDetail}>
            <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.ticketDetailText}>{item.mobileNumber}</Text>
          </View>
        )}

        {item.txnNumber && (
          <View style={styles.ticketDetail}>
            <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.ticketDetailText}>TXN: {item.txnNumber}</Text>
          </View>
        )}

        {item.attachment && (
          <View style={styles.ticketDetail}>
            <Ionicons name="document-attach-outline" size={14} color={Colors.primary} />
            <Text style={styles.attachmentText}>{t('support.attachmentAvailable')}</Text>
          </View>
        )}
      </View>

      <View style={styles.ticketFooter}>
        <Text style={styles.ticketId}>#{item.id}</Text>
        <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>{t('support.noTicketsAvailable')}</Text>
      <Text style={styles.emptyStateSubText}>
        {searchQuery || isAnyFilterApplied
          ? t('support.noResults')
          : t('support.startCreatingTickets')
        }
      </Text>
      {!searchQuery && !isAnyFilterApplied && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Text style={styles.createButtonText}>{t('support.createTicket')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder={t('support.searchPlaceholder')}
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters Row */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{t('support.status')}</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filters.status === '' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('status', '')}
            >
              <Text style={[
                styles.filterButtonText,
                filters.status === '' && styles.filterButtonTextActive
              ]}>
                {t('support.all')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filters.status === 'pending' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('status', 'pending')}
            >
              <Text style={[
                styles.filterButtonText,
                filters.status === 'pending' && styles.filterButtonTextActive
              ]}>
                {t('support.statusOptions.pending')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filters.status === 'resolved' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('status', 'resolved')}
            >
              <Text style={[
                styles.filterButtonText,
                filters.status === 'resolved' && styles.filterButtonTextActive
              ]}>
                {t('support.statusOptions.resolved')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ticket Type Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{t('support.type')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.typeFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.typeFilterButton,
                filters.ticketTypeId === '' && styles.typeFilterButtonActive
              ]}
              onPress={() => handleFilterChange('ticketTypeId', '')}
            >
              <Text style={[
                styles.typeFilterButtonText,
                filters.ticketTypeId === '' && styles.typeFilterButtonTextActive
              ]}>
                {t('support.all')}
              </Text>
            </TouchableOpacity>
            {ticketTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeFilterButton,
                  filters.ticketTypeId === type.id.toString() && styles.typeFilterButtonActive
                ]}
                onPress={() => handleFilterChange('ticketTypeId', type.id.toString())}
              >
                <Text style={[
                  styles.typeFilterButtonText,
                  filters.ticketTypeId === type.id.toString() && styles.typeFilterButtonTextActive
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Create Ticket Button */}
      <TouchableOpacity 
        style={styles.createTicketButton}
        onPress={() => setIsCreateModalOpen(true)}
      >
        <Ionicons name="add" size={20} color={Colors.white} />
        <Text style={styles.createTicketButtonText}>{t('support.createTicket')}</Text>
      </TouchableOpacity>

      {/* Active Filters Indicator */}
      {isAnyFilterApplied && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>
            {t('support.filtersApplied')}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>
              {t('support.clearAll')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t('support.title')} 
        onBack={() => navigation.goBack()} 
      />
      
      <FlatList
        data={data}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTickets(true)}
            colors={[Colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('support.loading')}</Text>
        </View>
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        ticketTypes={ticketTypes}
      />

      {/* View Ticket Modal */}
      <ViewTicketModal
        visible={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        ticket={selectedTicket}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContainer: {
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2.1),
    paddingBottom: scale.hp(2.6),
    flexGrow: 1,
  },
  header: {
    marginBottom: scale.hp(2.1),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.55),
    marginBottom: scale.hp(2.1),
  },
  searchIcon: {
    marginRight: scale.wp(2.1),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
  },
  filtersContainer: {
    marginBottom: scale.hp(2.1),
  },
  filterGroup: {
    marginBottom: scale.hp(1.55),
  },
  filterLabel: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.05),
  },
  filterButtons: {
    flexDirection: 'row',
    gap: scale.wp(2.1),
  },
  filterButton: {
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(0.8),
    borderRadius: scale.hp(1),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  typeFilterScroll: {
    flexGrow: 0,
  },
  typeFilterButton: {
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(0.8),
    borderRadius: scale.hp(1),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    marginRight: scale.wp(2.1),
  },
  typeFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeFilterButtonText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeFilterButtonTextActive: {
    color: Colors.white,
  },
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    paddingVertical: scale.hp(1.55),
    gap: scale.wp(2),
    marginBottom: scale.hp(2.1),
  },
  createTicketButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1),
    padding: scale.hp(1.55),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: Colors.primary,
  },
  activeFiltersText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.26) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.8),
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale.hp(1.55),
  },
  ticketLeft: {
    flex: 1,
  },
  ticketType: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  ticketDate: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: scale.wp(3.1),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1),
  },
  statusText: {
    fontSize: scale.hp(1.55),
    fontWeight: '500',
  },
  ticketBody: {
    marginTop: scale.hp(1.05),
  },
  ticketDescription: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
    marginBottom: scale.hp(1.05),
  },
  ticketDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(2),
    marginBottom: scale.hp(0.5),
  },
  ticketDetailText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  attachmentText: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    fontWeight: '500',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale.hp(1.55),
    paddingTop: scale.hp(1.05),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketId: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  separator: {
    height: scale.hp(1.55),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(10.4),
  },
  emptyStateText: {
    color: '#666',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    marginTop: scale.hp(1.55),
    marginBottom: scale.hp(0.5),
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: '#999',
    fontSize: scale.hp(1.8),
    textAlign: 'center',
    marginBottom: scale.hp(2.1),
    lineHeight: scale.hp(2.35),
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(6.2),
    paddingVertical: scale.hp(1.55),
  },
  createButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: scale.hp(1.55),
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
  },
});