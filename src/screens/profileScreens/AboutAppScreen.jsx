import React from 'react';
import { 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image 
} from "react-native";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Make sure to install this package

const AboutAppScreen = ({ navigation }) => {
  const goBack = () => navigation.goBack();
  
  const handleContactSupport = () => {
    // You can replace with your actual support email/phone
    Linking.openURL('mailto:support@yescharge.com');
  };

  const handleVisitWebsite = () => {
    // Replace with your actual website
    Linking.openURL('https://www.yescharge.com');
  };

  const features = [
    {
      icon: "smartphone",
      title: "Mobile Top-up",
      description: "Instant mobile recharge for all networks"
    },
    {
      icon: "wifi",
      title: "Data Bundle",
      description: "Affordable data plans for internet connectivity"
    },
    {
      icon: "sports-esports",
      title: "Games & Entertainment",
      description: "Gaming credits, subscriptions, and entertainment services"
    },
    {
      icon: "people",
      title: "Social Media",
      description: "Activation and recharge for social platforms"
    },
    {
      icon: "bolt",
      title: "Utility Bills",
      description: "Pay electricity, water, and other utility bills"
    },
    {
      icon: "card-giftcard",
      title: "Gift Cards",
      description: "Purchase digital gift cards for various services"
    }
  ];

  const appInfo = {
    version: "1.0.1",
    build: "3",
    releaseDate: "December 2024",
    company: "YES Charge Technologies"
  };

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title="About YES Charge" onBack={goBack} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
       <Text>Need Content</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 15,
  },
  appDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.darkGray,
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  benefitsList: {
    marginTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: Colors.darkGray,
    marginLeft: 10,
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.gray,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark,
  },
  contactCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  contactText: {
    fontSize: 15,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  supportButton: {
    backgroundColor: Colors.primary,
  },
  websiteButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    color: Colors.white,
  },
  websiteButtonText: {
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  terms: {
    fontSize: 12,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default AboutAppScreen;