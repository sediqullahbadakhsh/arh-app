// screens/merchant/MerchantAnalyticsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import ServiceHeader from '../components/ServiceHeader';
import gameStyles from './gameCoinsScreen/GameSyle';
import { scale } from '../utils/normalizeSize';

const { width, height } = Dimensions.get('window');

export default function MerchantAnalyticsScreen({ navigation }) {
  const { t } = useTranslation();
 const goBack = () => {
    navigation.goBack();
  };


  return (
    <SafeAreaView style={styles.safeArea}>
        <ServiceHeader title="Analytics" onBack={goBack} />
          <View style={gameStyles.center}>
            <View style={gameStyles.badge}>
          <Ionicons
            name="analytics-outline"
            size={28}
            color={Colors.primary}
          />
        </View>
     <Text style={gameStyles.sub}>{t("thisFeatureComingSoon")}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={gameStyles.btn}
          activeOpacity={0.85}
        >
          <Text style={gameStyles.btnText}>{t("goBack")}</Text>
</TouchableOpacity>
   </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(5.2),
    paddingVertical: scale.hp(2.1),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: scale.hp(0.5),
  },
  headerTitle: {
    fontSize: scale.hp(2.6),
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: scale.wp(8.3),
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale.wp(10.4),
  },
  gradientCircle: {
    width: scale.wp(39),
    height: scale.wp(39),
    borderRadius: scale.wp(19.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale.hp(4),
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: scale.hp(1.3),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2.6),
    elevation: 10,
  },
  title: {
    fontSize: scale.hp(4),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: scale.hp(1.55),
  },
  subtitle: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale.hp(3.1),
    marginBottom: scale.hp(5.2),
  },
  featuresContainer: {
    width: '100%',
    marginBottom: scale.hp(5.2),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(2.6),
    padding: scale.hp(2.1),
    backgroundColor: '#f8f9fa',
    borderRadius: scale.hp(1.55),
  },
  featureIcon: {
    width: scale.wp(13),
    height: scale.wp(13),
    borderRadius: scale.wp(6.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale.wp(4.2),
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
  },
  featureDescription: {
    fontSize: scale.hp(1.95),
    color: Colors.textSecondary,
    lineHeight: scale.hp(2.3),
  },
  progressContainer: {
    width: '100%',
    marginBottom: scale.hp(4),
  },
  progressText: {
    fontSize: scale.hp(1.95),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale.hp(1.05),
  },
  progressBar: {
    width: '100%',
    height: scale.hp(0.8),
    backgroundColor: '#e9ecef',
    borderRadius: scale.hp(0.4),
    overflow: 'hidden',
  },
  progressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: scale.hp(0.4),
  },
  notifyButton: {
    width: '100%',
    borderRadius: scale.hp(3.4),
    overflow: 'hidden',
    marginBottom: scale.hp(2.6),
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: scale.hp(1),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2.1),
    elevation: 8,
  },
  notifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(2.1),
    paddingHorizontal: scale.wp(6.2),
  },
  notifyText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    marginLeft: scale.wp(2.1),
  },
  etaText: {
    fontSize: scale.hp(1.95),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});