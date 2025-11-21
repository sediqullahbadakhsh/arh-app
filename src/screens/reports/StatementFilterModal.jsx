import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const StatementFilterModal = ({ visible, onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState("currentMonth");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const getDateRange = (type) => {
    const now = new Date();
    
    switch (type) {
      case "currentMonth":
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      case "previousMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          startDate: lastMonth,
          endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      case "last7Days":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return {
          startDate: sevenDaysAgo,
          endDate: now,
        };
      case "last30Days":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return {
          startDate: thirtyDaysAgo,
          endDate: now,
        };
      default:
        return { startDate, endDate };
    }
  };

  const handleFilterSelect = (type) => {
    setFilterType(type);
    if (type !== "custom") {
      const range = getDateRange(type);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const handleSubmit = () => {
    let selectedRange;
    
    if (filterType === "custom") {
      if (startDate > endDate) {
        Alert.alert(t('error'), t('startDateAfterEndDate'));
        return;
      }
      selectedRange = { startDate, endDate };
    } else {
      selectedRange = getDateRange(filterType);
    }

    onSubmit({
      startDate: selectedRange.startDate.toISOString(),
      endDate: selectedRange.endDate.toISOString(),
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filterOptions = [
    { key: "currentMonth", label: t('currentMonth'), icon: "calendar-outline" },
    { key: "previousMonth", label: t('previousMonth'), icon: "calendar-clear-outline" },
    { key: "last7Days", label: t('last7Days'), icon: "time-outline" },
    { key: "last30Days", label: t('last30Days'), icon: "calendar-number-outline" },
    { key: "custom", label: t('customRange'), icon: "options-outline" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('generateStatementReport')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>{t('selectTimePeriod')}</Text>
          
          <View style={styles.filterGrid}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filterType === option.key && styles.filterOptionSelected,
                ]}
                onPress={() => handleFilterSelect(option.key)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={filterType === option.key ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[
                  styles.filterOptionText,
                  filterType === option.key && styles.filterOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filterType === "custom" && (
            <View style={styles.customRangeSection}>
              <Text style={styles.rangeTitle}>{t('customDateRange')}</Text>
              
              <View style={styles.dateInputs}>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.dateInputText}>
                    {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.dateSeparator}>{t('to')}</Text>

                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.dateInputText}>
                    {formatDate(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>
          )}

          <View style={styles.selectedRange}>
            <Text style={styles.rangeLabel}>{t('selectedPeriod')}:</Text>
            <Text style={styles.rangeValue}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>{t('generating')}</Text>
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>{t('generateReport')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: scale.hp(0.5),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2.6),
  },
  sectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(2.1),
  },
  filterGrid: {
    gap: scale.hp(1.55),
    marginBottom: scale.hp(3.1),
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale.hp(2.1),
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    borderWidth: 2,
    borderColor: 'transparent',
    gap: scale.wp(3.1),
  },
  filterOptionSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customRangeSection: {
    marginBottom: scale.hp(3.1),
  },
  rangeTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(1.55),
  },
  dateInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(3.1),
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    gap: scale.wp(3.1),
  },
  dateInputText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dateSeparator: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedRange: {
    backgroundColor: '#F0F9FF',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: '#3B82F6',
  },
  rangeLabel: {
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.5),
  },
  rangeValue: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    padding: scale.hp(2.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
  },
  cancelButtonText: {
    fontSize: scale.hp(2.1),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    padding: scale.hp(2.1),
    gap: scale.wp(2),
  },
  submitButtonText: {
    fontSize: scale.hp(2.1),
    color: Colors.white,
    fontWeight: '600',
  },
});

export default StatementFilterModal;