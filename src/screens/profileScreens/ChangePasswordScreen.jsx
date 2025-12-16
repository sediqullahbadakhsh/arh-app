import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAgentPassword } from '../../services/authApi';
import ServiceHeader from '../../components/ServiceHeader';
import SuccessModal from '../../components/modals/SuccessModal';
import ErrorModal from '../../components/modals/ErrorModal';
import { Colors } from '../../theme/colors';
import { scale } from '../../utils/normalizeSize';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


const CustomButton = React.memo(({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  icon,
  style = {} 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.customButton,
        disabled || loading ? styles.buttonDisabled : {},
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={20} 
              color="#fff" 
              style={styles.buttonIcon}
            />
          )}
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

// Custom Password Input Component - Moved completely outside
const PasswordInput = React.memo(({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  showPassword, 
  onToggleVisibility,
  inputRef,
  onSubmitEditing,
  returnKeyType,
  iconName,
  helperText 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      
      <View style={[
        styles.inputWrapper, 
        error ? styles.inputError : {},
        isFocused ? styles.inputFocused : {}
      ]}>
        <MaterialIcons 
          name={iconName} 
          size={20} 
          color={isFocused ? Colors.primary : "#666"} 
          style={styles.inputIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType !== 'next'}
          enablesReturnKeyAutomatically={true}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={Colors.primary}
          contextMenuHidden={false}
          textContentType="none"
          autoComplete="off"
        />
        
        <TouchableOpacity 
          onPress={onToggleVisibility}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons 
            name={showPassword ? "visibility-off" : "visibility"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const ChangePassword = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Using useRef for form data to prevent re-renders on every keystroke
  const formDataRef = useRef({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Refs for input fields
  const currentPasswordRef = useRef();
  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  
  // Modal handlers
  const handleSuccessClose = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  }, [navigation]);
  
  const handleErrorClose = useCallback(() => {
    setShowErrorModal(false);
    setErrorMessage('');
  }, []);
  
  const showCustomSuccessModal = useCallback((message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  }, []);
  
  const showCustomErrorModal = useCallback((message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  }, []);
  
  // Handle input change - optimized version
  const handleInputChange = useCallback((field, value) => {
    // Update ref immediately
    formDataRef.current = {
      ...formDataRef.current,
      [field]: value
    };
    
    // Update state for display (batched for better performance)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);
  
  // Toggle password visibility
  const togglePasswordVisibility = useCallback((field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(prev => !prev);
        break;
      case 'new':
        setShowNewPassword(prev => !prev);
        break;
      case 'confirm':
        setShowConfirmPassword(prev => !prev);
        break;
      default:
        break;
    }
  }, []);
  
  // Validate form using ref to avoid dependency on formData state
  const validateForm = useCallback(() => {
    const currentFormData = formDataRef.current;
    const newErrors = {};
    
    if (!currentFormData.currentPassword.trim()) {
      newErrors.currentPassword = t('currentPasswordRequired');
    }
    
    if (!currentFormData.newPassword.trim()) {
      newErrors.newPassword = t('newPasswordRequired');
    } else if (currentFormData.newPassword.length < 8) {
      newErrors.newPassword = t('passwordMinLength');
    }
    
    if (!currentFormData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (currentFormData.newPassword !== currentFormData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t]);
  

const handleResetPassword = useCallback(async () => {
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  
  try {
    const lang = await AsyncStorage.getItem('i18nextLng') || 'en';
    const payload = {
      ...formDataRef.current,
      lang
    };
    
    const response = await resetAgentPassword(payload);
    
    if (response.status === true) {
      showCustomSuccessModal(response.message || t('passwordResetSuccess'));
      
      // Reset form data
      formDataRef.current = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // IMPORTANT: Always logout after password reset
      // Clear user session regardless of response.logoutRequired
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      
      // Show logout message after success modal
      setTimeout(() => {
        Alert.alert(
          t('passwordChanged'),
          t('passwordResetLogoutMessage') || 'For security reasons, you have been logged out. Please login again with your new password.',
          [
            {
              text: t('ok'),
              onPress: () => {
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }, 1500);
      
    } else {
      showCustomErrorModal(response.message || t('passwordResetFailed'));
    }
  } catch (error) {
    console.error('Reset password error:', error);
    
    let errorMsg = t('somethingWentWrong');
    if (error.response) {
      errorMsg = error.response.data?.error || 
                 error.response.data?.message || 
                 t('passwordResetFailed');
    } else if (error.request) {
      errorMsg = t('networkError');
    }
    
    showCustomErrorModal(errorMsg);
  } finally {
    setLoading(false);
  }
}, [validateForm, showCustomSuccessModal, showCustomErrorModal, t, navigation]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <ServiceHeader 
        title={t('changePassword')} 
        onBack={goBack}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{t('resetYourPassword')}</Text>
              <Text style={styles.subtitle}>
                {t('resetPasswordDescription')}
              </Text>
            </View>
            
            <View style={styles.formContainer}>
              {/* Current Password */}
              <PasswordInput
                label={t('currentPassword')}
                placeholder={t('enterCurrentPassword')}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                showPassword={showCurrentPassword}
                onToggleVisibility={() => togglePasswordVisibility('current')}
                inputRef={currentPasswordRef}
                returnKeyType="next"
                onSubmitEditing={() => newPasswordRef.current?.focus()}
                iconName="lock"
                error={errors.currentPassword}
              />
              
              {/* New Password */}
              <PasswordInput
                label={t('newPassword')}
                placeholder={t('enterNewPassword')}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                showPassword={showNewPassword}
                onToggleVisibility={() => togglePasswordVisibility('new')}
                inputRef={newPasswordRef}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                iconName="lock-open"
                error={errors.newPassword}
                helperText={t('passwordRequirements')}
              />
              
              {/* Confirm Password */}
              <PasswordInput
                label={t('confirmPassword')}
                placeholder={t('confirmNewPassword')}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                showPassword={showConfirmPassword}
                onToggleVisibility={() => togglePasswordVisibility('confirm')}
                inputRef={confirmPasswordRef}
                returnKeyType="done"
                iconName="check-circle"
                error={errors.confirmPassword}
              />
              
              {/* Warning Message */}
              <View style={styles.warningContainer}>
                <View style={styles.warningIcon}>
                  <MaterialIcons name="warning" size={20} color="#856404" />
                </View>
                <Text style={styles.warningText}>
                  {t('resetPasswordWarning')}
                </Text>
              </View>
              
              {/* Submit Button */}
              <CustomButton
                title={loading ? t('resetting') : t('resetPassword')}
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                icon={loading ? null : "lock-reset"}
                style={styles.submitButton}
              />
              
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={goBack}
                style={styles.cancelButton}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.cancelButtonText}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('success')}
        message={successMessage}
        buttonText={t('continue')}
      />
      
      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('error')}
        message={errorMessage}
        buttonText={t('tryAgain')}
      />
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(5),
    paddingTop: scale.hp(2),
  },
  headerContainer: {
    marginBottom: scale.hp(4),
    paddingHorizontal: scale.wp(2),
  },
  title: {
    fontSize: scale.hp(3),
    fontWeight: '700',
    color: Colors.primary || '#CD0202',
    marginBottom: scale.hp(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale.hp(1.9),
    color: Colors.textSecondary || '#666',
    lineHeight: scale.hp(2.5),
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: scale.wp(2),
  },
  // Input styles
  inputContainer: {
    marginBottom: scale.hp(2.5),
  },
  inputLabel: {
    fontSize: scale.hp(1.8),
    fontWeight: '500',
    color: '#333',
    marginBottom: scale.hp(1),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#fff',
    height: scale.hp(6),
  },
  inputFocused: {
    borderColor: Colors.primary || '#CD0202',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: scale.hp(1.9),
    color: '#333',
    paddingVertical: scale.hp(1),
    height: '100%',
    paddingHorizontal: 5,
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  errorText: {
    fontSize: scale.hp(1.6),
    color: '#dc3545',
    marginTop: 5,
  },
  helperText: {
    fontSize: scale.hp(1.6),
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Warning styles
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginTop: scale.hp(1),
    marginBottom: scale.hp(3),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: scale.hp(1.8),
    color: '#856404',
    lineHeight: scale.hp(2.3),
  },
  // Button styles
  customButton: {
    backgroundColor: Colors.primary || '#CD0202',
    borderRadius: 10,
    height: scale.hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: scale.hp(1),
    marginBottom: scale.hp(2),
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale.hp(1.9),
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: scale.hp(1.9),
    color: Colors.textSecondary || '#666',
    fontWeight: '500',
  },
};

export default ChangePassword;