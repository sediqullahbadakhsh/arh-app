import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, SafeAreaView, ScrollView } from "react-native";
import ServiceHeader from "../../components/ServiceHeader";
import { Colors } from "../../theme/colors";
import LanguageSelector from "./languageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { useUser } from "../../context/userContext";
import { updateLanguage } from "../../services/merchantApi";
import { useTranslation } from "react-i18next";
import SuccessModal from "../../components/modals/SuccessModal";
import ErrorModal from "../../components/modals/ErrorModal";

export default function LanguageScreen({ navigation }) {
  const { user } = useUser();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage } = useLanguage();
  const { t, i18n } = useTranslation();
  const [updatingBackend, setUpdatingBackend] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showCustomSuccessModal = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const showCustomErrorModal = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleLanguageChange = async (lang) => {
    if (isChangingLanguage || updatingBackend) return;

    setUpdatingBackend(true);
    try {
      const languageChanged = await changeLanguage(lang);
      
      if (!languageChanged) {
        throw new Error('Failed to change app language');
      }
      await i18n.changeLanguage(lang.code);

      if (user?.id) {
        const payload = { messageLanguage: lang.value };
        await updateLanguage(user.id, payload);
      }

      showCustomSuccessModal(t('languageChangedSuccessfully'));
      
    
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error changing language:', error);
      showCustomErrorModal(t('failedToChangeLanguage'));
    } finally {
      setUpdatingBackend(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader 
        title={t('manageLanguage')}
        onBack={() => navigation.goBack()} 
      />
      
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <LanguageSelector
          selectedLang={selectedLang}
          onChange={handleLanguageChange}
          langs={LANGS}
          loading={isChangingLanguage || updatingBackend}
          t={t}
        />
        
        {(isChangingLanguage || updatingBackend) && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 10, color: Colors.textSecondary }}>
              {updatingBackend ? t("updatingPreferences") : t("changingLanguage")}
            </Text>
          </View>
        )}
      </ScrollView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title={t("success")}
        message={successMessage}
        buttonText={t("continue")}
        autoHideDuration={1500}
      />

      <ErrorModal
        visible={showErrorModal}
        onClose={handleErrorClose}
        title={t("error")}
        message={errorMessage}
        buttonText={t("tryAgain")}
        showRetryButton={true}
      />
    </SafeAreaView>
  );
}