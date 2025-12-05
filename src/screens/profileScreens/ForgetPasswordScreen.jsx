import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import api from '../../services/authApi';


const emailSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const goBack = () => navigation.goBack();

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handleResetRequest = async (values) => {
    try {
      setShowLoading(true);
      
      const response = await api.post('/auth/forgot-password', {
        email: values.email,
      });

      setSuccessMessage(response.data.message);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Failed to send reset link';
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
        title={t('forgotPassword')} 
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
            <Text style={styles.title}>{t('resetYourPassword')}</Text>
            <Text style={styles.subtitle}>
              {t('forgotPasswordInstructions')}
            </Text>
          </View>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={emailSchema}
            onSubmit={handleResetRequest}
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
                  <Text style={styles.label}>{t('emailAddress')}</Text>
                  <TextInput
                    mode="outlined"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    outlineColor={Colors.greyLight}
                    activeOutlineColor={Colors.primary}
                    left={<TextInput.Icon icon="email" color={Colors.grey} />}
                  />
                  {touched.email && errors.email && (
                    <HelperText type="error" visible={true}>
                      {errors.email}
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
                    {t('sendResetLink')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.backToLoginContainer}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backToLoginText}>
                      {t('backToLogin')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>

 
      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t('checkYourEmail')}
        message={successMessage}
        buttonText={t('ok')}
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
        message={t('sendingResetLink')}
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
    marginBottom: scale.hp(3),
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
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: scale.hp(2),
    borderRadius: scale.hp(1),
    alignItems: 'center',
    marginTop: scale.hp(2),
  },
  submitButtonDisabled: {
    backgroundColor: Colors.greyLight,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: scale.hp(3),
  },
  backToLoginText: {
    color: Colors.primary,
    fontSize: scale.hp(1.9),
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;