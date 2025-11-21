import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

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

export default function ViewTicketModal({ visible, onClose, ticket }) {
  const { t } = useTranslation();

  if (!ticket) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('support.ticketDetails')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('support.basicInformation')}</Text>
              
              <DetailRow 
                label={t('support.ticketId')} 
                value={`#${ticket.id}`}
              />
              
              <DetailRow 
                label={t('support.ticketType')} 
                value={ticket.ticketType?.name || t('support.unknownType')}
              />
              
              <DetailRow 
                label={t('support.status')} 
                value={<StatusBadge status={ticket.status} />}
              />
              
              <DetailRow 
                label={t('support.createdDate')} 
                value={new Date(ticket.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />
            </View>

            {/* Ticket Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('support.ticketDetails')}</Text>
              
              <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>{t('support.description')}:</Text>
                <Text style={styles.descriptionText}>{ticket.description}</Text>
              </View>

              {ticket.mobileNumber && (
                <DetailRow 
                  label={t('support.mobileNumber')} 
                  value={ticket.mobileNumber}
                />
              )}

              {ticket.txnNumber && (
                <DetailRow 
                  label={t('support.transactionNumber')} 
                  value={ticket.txnNumber}
                />
              )}
            </View>

            {/* Attachment */}
            {ticket.attachment && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('support.attachment')}</Text>
                <TouchableOpacity style={styles.attachmentContainer}>
                  <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentText}>{t('support.viewAttachment')}</Text>
                    <Text style={styles.attachmentSubtext}>{t('support.clickToView')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Response (if available) */}
            {ticket.response && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('support.adminResponse')}</Text>
                <View style={styles.responseContainer}>
                  <Text style={styles.responseText}>{ticket.response}</Text>
                  {ticket.respondedAt && (
                    <Text style={styles.responseDate}>
                      {new Date(ticket.respondedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={styles.detailValueContainer}>
        {typeof value === 'string' ? (
          <Text style={styles.detailValue}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scale.hp(2.6),
    borderTopRightRadius: scale.hp(2.6),
    maxHeight: '90%',
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
  modalContent: {
    padding: scale.hp(2.6),
  },
  section: {
    marginBottom: scale.hp(2.6),
  },
  sectionTitle: {
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
    flex: 1,
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
  descriptionContainer: {
    paddingVertical: scale.hp(1.05),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  descriptionText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
    marginTop: scale.hp(0.5),
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale.hp(1.55),
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1.3),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: scale.wp(2.1),
  },
  attachmentText: {
    fontSize: scale.hp(1.8),
    color: Colors.primary,
    fontWeight: '500',
  },
  attachmentSubtext: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(0.25),
  },
  responseContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: Colors.primary,
  },
  responseText: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    lineHeight: scale.hp(2.35),
  },
  responseDate: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    marginTop: scale.hp(1.05),
    fontStyle: 'italic',
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
  modalFooter: {
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.3),
    padding: scale.hp(1.55),
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: scale.hp(1.8),
    fontWeight: '600',
  },
});