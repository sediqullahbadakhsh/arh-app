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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { getMerchantTickets, getTicketTypes } from "../../services/ticketService";
import { useTranslation } from "react-i18next";
import { scale } from "../../utils/normalizeSize";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  
  const statusConfig = {
    pending: {
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      label: t('tickets.status.pending')
    },
    resolved: {
      color: "#059669",
      backgroundColor: "#D1FAE5",
      label: t('tickets.status.resolved')
    },
    rejected: {
      color: "#DC2626",
      backgroundColor: "#FEE2E2",
      label: t('tickets.status.rejected')
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

export default function TicketsReportScreen({ navigation }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    ticketTypeId: "",
    page: 1,
    limit: 20,
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

 
  const { 
    data: ticketsData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["merchantTickets", filters],
    queryFn: () => getMerchantTickets(filters),
  });


  const { data: ticketTypes = [] } = useQuery({
    queryKey: ["ticketTypes"],
    queryFn: getTicketTypes,
  });

  const tickets = ticketsData?.data || [];
  const meta = ticketsData?.meta || {};

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
    setFilterModalVisible(false);
  };

  const handleTypeFilter = (ticketTypeId) => {
    setFilters(prev => ({ ...prev, ticketTypeId, page: 1 }));
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      ticketTypeId: "",
      page: 1,
      limit: 20,
    });
  };

  const showTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setDetailModalVisible(true);
  };

  const loadMore = () => {
    if (meta.page < meta.pages) {
      setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const isFilterActive = filters.status || filters.ticketTypeId;

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => showTicketDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={styles.ticketId}>#{item.id}</Text>
          <Text style={styles.ticketType}>
            {item.ticketType?.name || "Unknown Type"}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.itemBody}>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {format(new Date(item.createdAt), "MMM dd, yyyy")}
            </Text>
          </View>
          
          {item.mobileNumber && (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.mobileNumber}</Text>
            </View>
          )}
        </View>

        {item.attachment && (
          <View style={styles.attachmentRow}>
            <Ionicons name="image-outline" size={14} color={Colors.primary} />
            <Text style={styles.attachmentText}>Attachment</Text>
          </View>
        )}
      </View>

      <View style={styles.itemFooter}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => showTicketDetails(item)}
        >
          <Text style={styles.viewButtonText}>{t('tickets.viewDetails')}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder={t('tickets.searchPlaceholder')}
          value={filters.search}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        {filters.search ? (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons 
            name="filter" 
            size={16} 
            color={isFilterActive ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.filterButtonText,
            isFilterActive && styles.filterButtonTextActive
          ]}>
            {t('tickets.filters')}
          </Text>
          {isFilterActive && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>

        {isFilterActive && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFilterText}>{t('tickets.clearAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{meta.total || 0}</Text>
          <Text style={styles.statLabel}>{t('tickets.total')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {tickets.filter(item => item.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>{t('tickets.status.pending')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {tickets.filter(item => item.status === 'resolved').length}
          </Text>
          <Text style={styles.statLabel}>{t('tickets.status.resolved')}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>
        {filters.search || isFilterActive 
          ? t('tickets.noResults')
          : t('tickets.noTickets')
        }
      </Text>
      <Text style={styles.emptyStateSubText}>
        {filters.search || isFilterActive 
          ? t('tickets.tryAdjustingSearch')
          : t('tickets.createFirstTicket')
        }
      </Text>
      {(filters.search || isFilterActive) && (
        <TouchableOpacity 
          style={styles.clearSearchButton}
          onPress={clearFilters}
        >
          <Text style={styles.clearSearchText}>{t('tickets.clearFilters')}</Text>
        </TouchableOpacity>
      )}
      {!filters.search && !isFilterActive && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateTicket")}
        >
          <Text style={styles.createButtonText}>{t('tickets.createTicket')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('tickets.filters')}</Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('tickets.status.title')}</Text>
              <View style={styles.filterOptions}>
                {['', 'pending', 'resolved', 'rejected'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.filterOptionSelected
                    ]}
                    onPress={() => handleStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status && styles.filterOptionTextSelected
                    ]}>
                      {status ? t(`tickets.status.${status}`) : t('tickets.allStatuses')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>{t('tickets.type')}</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !filters.ticketTypeId && styles.filterOptionSelected
                  ]}
                  onPress={() => handleTypeFilter("")}
                >
                  <Text style={[
                    styles.filterOptionText,
                    !filters.ticketTypeId && styles.filterOptionTextSelected
                  ]}>
                    {t('tickets.allTypes')}
                  </Text>
                </TouchableOpacity>
                {ticketTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.filterOption,
                      filters.ticketTypeId === type.id.toString() && styles.filterOptionSelected
                    ]}
                    onPress={() => handleTypeFilter(type.id.toString())}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.ticketTypeId === type.id.toString() && styles.filterOptionTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>{t('tickets.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const TicketDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('tickets.ticketDetails')}</Text>
            <TouchableOpacity 
              onPress={() => setDetailModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedTicket && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>{t('tickets.basicInfo')}</Text>
                  <DetailRow label={t('tickets.ticketId')} value={`#${selectedTicket.id}`} />
                  <DetailRow label={t('tickets.type')} value={selectedTicket.ticketType?.name} />
                  <DetailRow 
                    label={t('tickets.status')} 
                    value={<StatusBadge status={selectedTicket.status} />} 
                  />
                  <DetailRow 
                    label={t('tickets.createdAt')} 
                    value={format(new Date(selectedTicket.createdAt), "MMM dd, yyyy HH:mm")} 
                  />
                </View>

                {selectedTicket.mobileNumber && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>{t('tickets.contactInfo')}</Text>
                    <DetailRow label={t('tickets.mobileNumber')} value={selectedTicket.mobileNumber} />
                    {selectedTicket.txnNumber && (
                      <DetailRow label={t('tickets.transactionNumber')} value={selectedTicket.txnNumber} />
                    )}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>{t('tickets.description')}</Text>
                  <Text style={styles.descriptionDetail}>{selectedTicket.description}</Text>
                </View>

                {selectedTicket.comment && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>{t('tickets.adminComment')}</Text>
                    <Text style={styles.commentDetail}>{selectedTicket.comment}</Text>
                  </View>
                )}

                {selectedTicket.attachment && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>{t('tickets.attachment')}</Text>
                    <Image 
                      source={{ 
                        uri: `https://your-api-domain.com/uploads/ticket_images/${selectedTicket.attachment}` 
                      }}
                      style={styles.attachmentDetailImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{t('tickets.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t('tickets.myTickets')} 
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity 
            style={styles.createHeaderButton}
            onPress={() => navigation.navigate("CreateTicket")}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading && renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('tickets.loading')}</Text>
        </View>
      )}

      <FilterModal />
      <TicketDetailModal />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={styles.detailValueContainer}>
        {React.isValidElement(value) ? value : <Text style={styles.detailValue}>{value}</Text>}
      </View>
    </View>
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale.hp(2.1),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.wp(3.1),
    paddingVertical: scale.hp(1.05),
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    backgroundColor: Colors.white,
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F9FF',
  },
  filterButtonText: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginLeft: scale.wp(1.55),
  },
  filterButtonTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  filterIndicator: {
    width: scale.wp(1.55),
    height: scale.wp(1.55),
    borderRadius: scale.wp(0.78),
    backgroundColor: Colors.primary,
    marginLeft: scale.wp(1.55),
  },
  clearFilterButton: {
    paddingHorizontal: scale.wp(3.1),
    paddingVertical: scale.hp(1.05),
  },
  clearFilterText: {
    fontSize: scale.hp(1.8),
    color: Colors.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: scale.hp(2.6),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.5),
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scale.hp(1.55),
  },
  itemLeft: {
    flex: 1,
  },
  ticketId: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  ticketType: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: scale.wp(2.6),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1),
  },
  statusText: {
    fontSize: scale.hp(1.55),
    fontWeight: '500',
  },
  itemBody: {
    marginBottom: scale.hp(1.55),
  },
  description: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
    marginBottom: scale.hp(1.05),
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: scale.wp(3.1),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(1.55),
  },
  detailText: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(1.55),
    marginTop: scale.hp(1.05),
  },
  attachmentText: {
    fontSize: scale.hp(1.55),
    color: Colors.primary,
    fontWeight: '500',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: scale.hp(1.55),
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale.wp(1.55),
  },
  viewButtonText: {
    color: Colors.primary,
    fontSize: scale.hp(1.8),
    fontWeight: '500',
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
  clearSearchButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    paddingHorizontal: scale.wp(4.2),
    paddingVertical: scale.hp(1.05),
  },
  clearSearchText: {
    color: Colors.primary,
    fontSize: scale.hp(1.8),
    fontWeight: '500',
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
  createHeaderButton: {
    padding: scale.hp(0.5),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5),
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.6),
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(2.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  modalContent: {
    padding: scale.hp(2.6),
  },
  modalFooter: {
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  // Filter Modal Styles
  filterSection: {
    marginBottom: scale.hp(2.6),
  },
  filterSectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale.wp(2.1),
  },
  filterOption: {
    paddingHorizontal: scale.wp(3.1),
    paddingVertical: scale.hp(1.05),
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: scale.hp(1.3),
    backgroundColor: Colors.white,
  },
  filterOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F9FF',
  },
  filterOptionText: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
  // Detail Modal Styles
  detailSection: {
    marginBottom: scale.hp(2.6),
  },
  detailSectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.05),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  descriptionDetail: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
  },
  commentDetail: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.35),
    fontStyle: 'italic',
  },
  attachmentDetailImage: {
    width: '100%',
    height: scale.hp(20),
    borderRadius: scale.hp(1.3),
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
});