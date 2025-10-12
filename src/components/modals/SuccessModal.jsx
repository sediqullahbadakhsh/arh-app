import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import LottieView from 'lottie-react-native';
import { Colors } from "../../theme/colors";
import PrimaryButton from '../PrimaryButton';


const { width, height } = Dimensions.get('window');



const SuccessAnimation = ({ play = true, size = 300 }) => {
  return (
    <View style={successStyles.successAnimationContainer}>
      <LottieView
        source={require('../../../assets/lotties/Success.json')}
        autoPlay={play}
        loop={false}
        style={[successStyles.successAnimation, { width: size, height: size }]}
      />
    </View>
  );
};

const SuccessModal = ({
  visible = false,
  onClose,
  onShare,
  title = "Success!",
  subtitle = "Operation completed successfully",
  details = [],
  primaryButtonText = "Continue",
  shareButtonText = "Share Receipt",

  showAnimation = true,
  animationSize = 300
}) => {
  const successModalScale = useRef(new Animated.Value(0)).current;
  const successContentOpacity = useRef(new Animated.Value(0)).current;
  const detailsSlideUp = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      animateSuccessModal();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const resetAnimations = () => {
    successModalScale.setValue(0);
    successContentOpacity.setValue(0);
    detailsSlideUp.setValue(50);
  };

  const animateSuccessModal = () => {
    resetAnimations();

    Animated.sequence([
      Animated.spring(successModalScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(successContentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(detailsSlideUp, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(successModalScale, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(successContentOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  const renderDetailIcon = (type) => {
    const iconMap = {
      amount: 'cash-outline',
      transaction: 'receipt-outline',
      time: 'time-outline',
      date: 'calendar-outline',
      user: 'person-outline',
      default: 'information-circle-outline'
    };

    return (
      <View style={successStyles.detailIcon}>
        <Ionicons 
          name={iconMap[type] || iconMap.default} 
          size={20} 
          color={Colors.primary} 
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={successStyles.modalOverlay}>

        
        <Animated.View 
          style={[
            successStyles.successModal,
            {
              transform: [{ scale: successModalScale }],
              opacity: successContentOpacity,
            }
          ]}
        >
          <Animated.View 
            style={[
              successStyles.successContent,
              {
                opacity: successContentOpacity,
                transform: [{ translateY: detailsSlideUp }]
              }
            ]}
          >
            {showAnimation && (
              <SuccessAnimation play={visible} size={animationSize} />
            )}
            
            <Text style={successStyles.successTitle}>{title}</Text>
            <Text style={successStyles.successSubtitle}>{subtitle}</Text>
            
            {details.length > 0 && (
              <Animated.View 
                style={[
                  successStyles.successDetails,
                  {
                    transform: [{ translateY: detailsSlideUp }]
                  }
                ]}
              >
                {details.map((detail, index) => (
                  <View key={index} style={successStyles.detailRow}>
                    {renderDetailIcon(detail.type)}
                    <View style={successStyles.detailTextContainer}>
                      <Text style={successStyles.detailLabel}>{detail.label}</Text>
                      <Text style={successStyles.detailValue}>{detail.value}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}

            <View style={successStyles.successActions}>
              {onShare && (
                <TouchableOpacity 
                  style={successStyles.shareButton}
                  onPress={onShare}
                >
                  <Ionicons name="share-outline" size={20} color={Colors.primary} />
                  <Text style={successStyles.shareButtonText}>{shareButtonText}</Text>
                </TouchableOpacity>
              )}
              
              <PrimaryButton
                label={primaryButtonText}
                onPress={handleClose}
                style={{ 
                  flex: onShare ? 1 : undefined, 
                  marginLeft: onShare ? 12 : 0,
                  minWidth: onShare ? undefined : '100%'
                }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const successStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
    padding: 32,
  },
  successAnimationContainer: {
    marginBottom: 24,
  },
  successAnimation: {
    width:300,
    height: 300,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiAnimation: {
    width: '100%',
    height: '100%',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    flex: 1,
  },
  shareButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
};

export default SuccessModal;