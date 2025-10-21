import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from "../../theme/colors";

const StatementFilterModal = ({ visible, onClose, onSubmit, isLoading }) => {
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
        alert("Start date cannot be after end date");
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
    { key: "currentMonth", label: "Current Month", icon: "calendar-outline" },
    { key: "previousMonth", label: "Previous Month", icon: "calendar-clear-outline" },
    { key: "last7Days", label: "Last 7 Days", icon: "time-outline" },
    { key: "last30Days", label: "Last 30 Days", icon: "calendar-number-outline" },
    { key: "custom", label: "Custom Range", icon: "options-outline" },
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
          <Text style={styles.title}>Generate Statement Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Select Time Period</Text>
          
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
              <Text style={styles.rangeTitle}>Custom Date Range</Text>
              
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

                <Text style={styles.dateSeparator}>to</Text>

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
            <Text style={styles.rangeLabel}>Selected Period:</Text>
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Generating...</Text>
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Generate Report</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  filterGrid: {
    gap: 12,
    marginBottom: 24,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  filterOptionSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customRangeSection: {
    marginBottom: 24,
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dateInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateInputText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dateSeparator: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedRange: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  rangeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
});

export default StatementFilterModal;