import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, View, ActivityIndicator, Text, ScrollView } from "react-native";
import ServiceHeader from "../../components/ServiceHeader";
import { Colors } from "../../theme/colors";
import LanguageSelector from "./languageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { useUser } from "../../context/userContext";
import { updateLanguage } from "../../services/merchantApi";
import RTLTransitionHandler from '../../components/RTLTransitionHandler';

export default function LanguageScreen({ navigation }) {
  const { user } = useUser();
  const { selectedLang, LANGS, changeLanguage, isChangingLanguage } = useLanguage();
  const [updatingBackend, setUpdatingBackend] = useState(false);

  const handleLanguageChange = async (lang) => {
    if (isChangingLanguage || updatingBackend) return;

    setUpdatingBackend(true);
    try {
      const languageChanged = await changeLanguage(lang);
      
      if (!languageChanged) {
        throw new Error('Failed to change app language');
      }

      if (user?.id) {
        const payload = { messageLanguage: lang.value };
        await updateLanguage(user.id, payload);
      }

      Alert.alert("Success", "Language changed successfully!");
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert("Error", "Failed to change language. Please try again.");
    } finally {
      setUpdatingBackend(false);
    }
  };

  return (
    <RTLTransitionHandler>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <ServiceHeader 
          title="Manage Language" 
          onBack={() => navigation.goBack()} 
        />
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <LanguageSelector
            selectedLang={selectedLang}
            onChange={handleLanguageChange}
            langs={LANGS}
            loading={isChangingLanguage || updatingBackend}
          />
          
          {(isChangingLanguage || updatingBackend) && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ marginTop: 10, color: Colors.textSecondary }}>
                {updatingBackend ? "Updating preferences..." : "Changing language..."}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </RTLTransitionHandler>
  );
}