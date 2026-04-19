import { Text, View, SafeAreaView, ScrollView, Image, StyleSheet } from "react-native";
import ServiceHeader from "../../components/ServiceHeader";
import { Colors } from "../../theme/colors";

const AboutUsScreen = ({ navigation }) => {
  const goBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader title="About Us" onBack={goBack} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
     
    

   
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who We Are</Text>
          <Text style={styles.paragraph}>
            Yes Charge (YC) is an innovative digital service platform established under 
            QUICKIE Top, a UAE-based company specializing in telecom and digital product 
            distribution. Yes Charge has been established with a clear purpose to transform 
            the digital payment and recharge experience across the world through technology, 
            transparency, and trust.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Core Business</Text>
          <Text style={styles.paragraph}>
            Our core business focuses on delivering mobile top-ups, data and voice bundles, 
            utility payments, gaming credits, gift cards, and other digital products. In addition, 
            we are expanding into e-commerce, providing a marketplace for authentic Afghan products 
            such as traditional clothing, dry fruits, natural oils, and other locally sourced goods, 
            connecting Afghan businesses to customers worldwide.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Commitment</Text>
          <Text style={styles.paragraph}>
            At Yes Charge, we are committed to providing fast, secure, and seamless transactions 
            supported by a robust technical infrastructure. Our system is designed to handle high 
            transaction volumes with accuracy, real-time monitoring, and full audit control. We 
            continuously enhance our platform to meet the latest industry standards in security, 
            integration, and customer experience.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <Text style={styles.paragraph}>
            Yes Charge operates with a professional management and technical team that brings 
            together expertise from the telecom, IT, and financial technology sectors. Together, 
            we aim to become a trusted partner for mobile operators, service providers, and end 
            users by simplifying access to digital services.
          </Text>
        </View>

 
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Our Vision</Text>
            <Text style={styles.cardText}>
              To become most trusted and innovative digital platform for telecom and financial 
              services, while serving as a secure global hub for Topup and authentic Afghan 
              products and businesses.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Our Mission</Text>
            <Text style={styles.cardText}>
              To empower digital access by providing reliable, fast, and secure delivery of 
              telecom and digital products, and to connect Afghans living abroad with their 
              homeland through a seamless and secure digital marketplace.
            </Text>
          </View>
        </View>

    
    
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.primary + '10',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textLight,
    textAlign: 'justify',
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 85,
  },
  card: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textLight,
    textAlign: 'justify',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    width: '25%',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textDark,
  },
});

export default AboutUsScreen;