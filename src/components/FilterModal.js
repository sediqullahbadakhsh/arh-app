import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { useTranslation } from "react-i18next";
import Slider from "@react-native-community/slider";

const FilterModal = ({ 
  visible, 
  onClose, 
  onApply, 
  filterConfig = [], 
  initialValues = {} 
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({});
  const [rangeValues, setRangeValues] = useState({});

  useEffect(() => {
    // Initialize filters with initial values
    const initialFilters = {};
    const initialRanges = {};
    
    filterConfig.forEach(config => {
      if (config.type === 'range') {
        initialRanges[config.key] = {
          min: initialValues[`${config.key}[gte]`] || config.min || 0,
          max: initialValues[`${config.key}[lte]`] || config.max || 100,
        };
      } else {
        initialFilters[config.key] = initialValues[config.key] || '';
      }
    });
    
    setFilters(initialFilters);
    setRangeValues(initialRanges);
  }, [filterConfig, initialValues]);

  const handleValueChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRangeChange = (key, type, value) => {
    setRangeValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value,
      },
    }));
  };

  const handleApply = () => {
    const result = {};
    
    // Add regular filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result[key] = filters[key];
      }
    });
    
    // Add range filters
    Object.keys(rangeValues).forEach(key => {
      if (rangeValues[key].min > 0) {
        result[`${key}[gte]`] = rangeValues[key].min;
      }
      if (rangeValues[key].max < 100000) {
        result[`${key}[lte]`] = rangeValues[key].max;
      }
    });
    
    onApply(result);
  };

  const handleReset = () => {
    const resetFilters = {};
    const resetRanges = {};
    
    filterConfig.forEach(config => {
      if (config.type === 'range') {
        resetRanges[config.key] = {
          min: config.min || 0,
          max: config.max || 100000,
        };
      } else {
        resetFilters[config.key] = '';
      }
    });
    
    setFilters(resetFilters);
    setRangeValues(resetRanges);
  };

  const renderFilterInput = (config) => {
    switch (config.type) {
      case 'dropdown':
        return (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>{config.label}</Text>
            <View style={styles.dropdown}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.dropdownOptions}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      !filters[config.key] && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handleValueChange(config.key, '')}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      !filters[config.key] && styles.dropdownOptionTextSelected,
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {config.options.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        filters[config.key] === option.value && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => handleValueChange(config.key, option.value)}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        filters[config.key] === option.value && styles.dropdownOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        );

      case 'range':
        const range = rangeValues[config.key] || { min: config.min || 0, max: config.max || 100000 };
        
        return (
          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>
              {config.label}: {config.unit} {range.min} - {range.max}
            </Text>
            
            <View style={styles.rangeSliders}>
              <View style={styles.rangeSliderContainer}>
                <Text style={styles.rangeSliderLabel}>Min:</Text>
                <View style={styles.rangeInputContainer}>
                  <TextInput
                    style={styles.rangeInput}
                    value={range.min.toString()}
                    onChangeText={(value) => handleRangeChange(config.key, 'min', parseFloat(value) || 0)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rangeUnit}>{config.unit}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={config.min || 0}
                  maximumValue={config.max || 100000}
                  step={config.step || 1}
                  value={range.min}
                  onValueChange={(value) => handleRangeChange(config.key, 'min', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor="#E4E7EC"
                  thumbTintColor={Colors.primary}
                />
              </View>
              
              <View style={styles.rangeSliderContainer}>
                <Text style={styles.rangeSliderLabel}>Max:</Text>
                <View style={styles.rangeInputContainer}>
                  <TextInput
                    style={styles.rangeInput}
                    value={range.max.toString()}
                    onChangeText={(value) => handleRangeChange(config.key, 'max', parseFloat(value) || 100000)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rangeUnit}>{config.unit}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={config.min || 0}
                  maximumValue={config.max || 100000}
                  step={config.step || 1}
                  value={range.max}
                  onValueChange={(value) => handleRangeChange(config.key, 'max', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor="#E4E7EC"
                  thumbTintColor={Colors.primary}
                />
              </View>
            </View>
          </View>
        );

      case 'text':
        return (
          <View style={styles.textInputContainer}>
            <Text style={styles.inputLabel}>{config.label}</Text>
            <TextInput
              style={styles.textInput}
              value={filters[config.key] || ''}
              onChangeText={(value) => handleValueChange(config.key, value)}
              placeholder={config.placeholder || 'Enter value...'}
              placeholderTextColor="#999"
            />
          </View>
        );

      default:
        return null;
    }
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
              {t('purchaseStock.advanceFilter')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {filterConfig.map((config) => (
              <View key={config.key} style={styles.filterSection}>
                {renderFilterInput(config)}
              </View>
            ))}
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
                style={styles.applyButton}
                onPress={handleApply}
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterSection: {
    marginBottom: 20,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownOptions: {
    flexDirection: 'row',
    padding: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.primary,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dropdownOptionTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  rangeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  rangeSliders: {
    gap: 16,
  },
  rangeSliderContainer: {
    gap: 8,
  },
  rangeSliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  rangeInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  rangeUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
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
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default FilterModal;