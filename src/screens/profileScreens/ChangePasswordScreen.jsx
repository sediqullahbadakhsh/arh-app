import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { Formik } from 'formik';


import ServiceHeader from '../../components/ServiceHeader';
import SuccessModal from '../../components/modals/SuccessModal';
import ErrorModal from '../../components/modals/ErrorModal';
import LoadingModal from '../../components/modals/LoadingModal';
import { Colors } from '../../theme/colors';
import { scale } from '../../utils/normalizeSize';
import api from '../../api/apiClient';


const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
});

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const goBack = () => navigation.goBack();

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (successMessage.includes('login again')) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handleChangePassword = async (values) => {
    try {
      setShowLoading(true);
      
      const response = await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (response.data.status) {
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to change password';
        setErrorMessage(errorMsg);
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      
      setShowErrorModal(true);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t('changePassword')} 
        onBack={goBack}
        showBackButton={true}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('changeYourPassword')}</Text>
            <Text style={styles.subtitle}>
              {t('changePasswordInstructions')}
            </Text>
          </View>

          <Formik
            initialValues={{
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={passwordSchema}
            onSubmit={handleChangePassword}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
              dirty,
            }) => (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('currentPassword')}</Text>
                  <TextInput
                    mode="outlined"
                    value={values.currentPassword}
                    onChangeText={handleChange('currentPassword')}
                    onBlur={handleBlur('currentPassword')}
                    secureTextEntry={!showCurrentPassword}
                    style={styles.input}
                    outlineColor={Colors.greyLight}
                    activeOutlineColor={Colors.primary}
                    right={
                      <TextInput.Icon
                        icon={showCurrentPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        color={Colors.grey}
                      />
                    }
                  />
                  {touched.currentPassword && errors.currentPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.currentPassword}
                    </HelperText>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('newPassword')}</Text>
                  <TextInput
                    mode="outlined"
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                    secureTextEntry={!showNewPassword}
                    style={styles.input}
                    outlineColor={Colors.greyLight}
                    activeOutlineColor={Colors.primary}
                    right={
                      <TextInput.Icon
                        icon={showNewPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        color={Colors.grey}
                      />
                    }
                  />
                  {touched.newPassword && errors.newPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.newPassword}
                    </HelperText>
                  )}
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      {t('passwordRequirements')}:
                    </Text>
                    <Text style={styles.requirementItem}>
                      • {t('atLeast8Characters')}
                    </Text>
                    <Text style={styles.requirementItem}>
                      • {t('uppercaseAndLowercase')}
                    </Text>
                    <Text style={styles.requirementItem}>
                      • {t('atLeastOneNumber')}
                    </Text>
                    <Text style={styles.requirementItem}>
                      • {t('atLeastOneSpecialCharacter')}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('confirmPassword')}</Text>
                  <TextInput
                    mode="outlined"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    outlineColor={Colors.greyLight}
                    activeOutlineColor={Colors.primary}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        color={Colors.grey}
                      />
                    }
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <HelperText type="error" visible={true}>
                      {errors.confirmPassword}
                    </HelperText>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isValid || !dirty) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!isValid || !dirty}
                >
                  <Text style={styles.submitButtonText}>
                    {t('changePassword')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotPasswordLink}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>
                    {t('forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('success')}
        message={successMessage}
        buttonText={t('continue')}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t('error')}
        message={errorMessage}
        buttonText={t('tryAgain')}
      />

      <LoadingModal
        visible={showLoading}
        message={t('changingPassword')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale.hp(4),
  },
  headerContainer: {
    paddingHorizontal: scale.wp(6),
    paddingTop: scale.hp(3),
    paddingBottom: scale.hp(2),
  },
  title: {
    fontSize: scale.hp(3),
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: scale.hp(1),
  },
  subtitle: {
    fontSize: scale.hp(1.9),
    color: Colors.grey,
    lineHeight: scale.hp(2.5),
  },
  formContainer: {
    paddingHorizontal: scale.wp(6),
  },
  inputContainer: {
    marginBottom: scale.hp(2.5),
  },
  label: {
    fontSize: scale.hp(1.9),
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: scale.hp(1),
  },
  input: {
    backgroundColor: Colors.white,
  },
  passwordRequirements: {
    marginTop: scale.hp(1.5),
    padding: scale.hp(1.5),
    backgroundColor: Colors.lightBlue,
    borderRadius: scale.hp(1),
  },
  requirementsTitle: {
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: scale.hp(0.5),
  },
  requirementItem: {
    fontSize: scale.hp(1.7),
    color: Colors.greyDark,
    marginBottom: scale.hp(0.3),
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: scale.hp(2),
    borderRadius: scale.hp(1),
    alignItems: 'center',
    marginTop: scale.hp(2),
    marginBottom: scale.hp(3),
  },
  submitButtonDisabled: {
    backgroundColor: Colors.greyLight,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: scale.hp(1),
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: scale.hp(1.9),
    fontWeight: '500',
  },
});

export default ChangePasswordScreen;