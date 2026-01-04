import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";
import moment from "moment";

const DateRangePicker = ({ 
  visible, 
  onClose, 
  onApply
}) => {
  const { t } = useTranslation();
  
  const [selectedRange, setSelectedRange] = useState(null);

  const predefinedRanges = [
    {
      id: 'today',
      label: t('datePicker.today'),
      getRange: () => {
        const today = moment().format('YYYY-MM-DD');
        return {
          start: today,
          end: today,
          display: t('datePicker.today'),
        };
      }
    },
    {
      id: 'yesterday',
      label: t('datePicker.yesterday'),
      getRange: () => {
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
        return {
          start: yesterday,
          end: yesterday,
          display: t('datePicker.yesterday'),
        };
      }
    },
    {
      id: 'thisWeek',
      label: t('datePicker.thisWeek'),
      getRange: () => {
        const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
        const today = moment().format('YYYY-MM-DD');
        return {
          start: startOfWeek,
          end: today,
          display: t('datePicker.thisWeek'),
        };
      }
    },
    {
      id: 'lastWeek',
      label: t('datePicker.lastWeek'),
      getRange: () => {
        const startOfLastWeek = moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');
        const endOfLastWeek = moment().subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD');
        return {
          start: startOfLastWeek,
          end: endOfLastWeek,
          display: t('datePicker.lastWeek'),
        };
      }
    },
    {
      id: 'thisMonth',
      label: t('datePicker.thisMonth'),
      getRange: () => {
        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
        const today = moment().format('YYYY-MM-DD');
        return {
          start: startOfMonth,
          end: today,
          display: t('datePicker.thisMonth'),
        };
      }
    },
    {
      id: 'lastMonth',
      label: t('datePicker.lastMonth'),
      getRange: () => {
        const startOfLastMonth = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        const endOfLastMonth = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
        return {
          start: startOfLastMonth,
          end: endOfLastMonth,
          display: t('datePicker.lastMonth'),
        };
      }
    },
    {
      id: 'last30Days',
      label: t('datePicker.last30Days'),
      getRange: () => {
        const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
        const today = moment().format('YYYY-MM-DD');
        return {
          start: thirtyDaysAgo,
          end: today,
          display: t('datePicker.last30Days'),
        };
      }
    },
  ];

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '--/--/----';
    return moment(dateString).format('MMM D, YYYY');
  };

  const handleOptionSelect = (option) => {
    setSelectedRange(option);
  };

  const handleApply = () => {
    if (selectedRange) {
      const range = selectedRange.getRange();
      onApply(range.start, range.end);
    }
  };

  const handleReset = () => {
    setSelectedRange(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('purchaseStock.dateFilter')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>
              {t('datePicker.quickSelect')}
            </Text>
            
            <View style={styles.optionsGrid}>
              {predefinedRanges.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    selectedRange?.id === option.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedRange?.id === option.id && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedRange && (
              <View style={styles.selectedRange}>
                <Text style={styles.selectedRangeLabel}>
                  {t('datePicker.selectedRange')}:
                </Text>
                <Text style={styles.selectedRangeValue}>
                  {formatDisplayDate(selectedRange.getRange().start)} - {formatDisplayDate(selectedRange.getRange().end)}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
              <Text style={styles.resetButtonText}>
                {t('common.reset')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  !selectedRange && styles.applyButtonDisabled,
                ]}
                onPress={handleApply}
                disabled={!selectedRange}
              >
                <Text style={styles.applyButtonText}>
                  {t('common.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    minWidth: '45%',
    flexGrow: 1,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  selectedRange: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    alignItems: 'center',
  },
  selectedRangeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectedRangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default DateRangePicker;