import React from 'react';
import { 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  Alert 
} from "react-native";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";

const ContactUsScreen = ({ navigation }) => {
  const goBack = () => navigation.goBack();
  

  const whatsappNumber = "+12797901187"; 
  const whatsappMessage = "Hello! I need assistance.";
  
  const openWhatsApp = async () => {
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMessage)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to open WhatsApp. Please make sure WhatsApp is installed.",
        [{ text: "OK" }]
      );
      console.error("Error opening WhatsApp:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title="Contact Us" onBack={goBack} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Get in Touch</Text>
        <Text style={styles.description}>
          Have questions or need support? Reach out to us on WhatsApp for quick assistance.
        </Text>
        
        <View style={styles.whatsappContainer}>
          <TouchableOpacity 
            style={styles.whatsappButton}
            onPress={openWhatsApp}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.whatsappIcon}>💬</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.whatsappButtonText}>Chat on WhatsApp</Text>
                <Text style={styles.whatsappSubText}>Typically replies within minutes</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.note}>
            Tap the button above to start a conversation with our support team directly on WhatsApp.
          </Text>
        </View>
        

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 30,
  },
  whatsappContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  whatsappButton: {
    backgroundColor: '#25D366', // WhatsApp green
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  whatsappButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  whatsappSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  note: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    flex: 1,
  },
});

export default ContactUsScreen;