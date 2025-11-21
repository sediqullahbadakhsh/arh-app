import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { scale } from '../../utils/normalizeSize';

const { width, height } = Dimensions.get('window');

export default function ErrorModal({
  visible = false,
  onClose,
  title = "Error!",
  message = "Something went wrong. Please try again.",
  buttonText = "Try Again",
  showCloseButton = true,
  showRetryButton = true,
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      shakeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

 
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const backdropStyle = {
    opacity: fadeAnim,
  };

  const modalStyle = {
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  };

  const iconStyle = {
    transform: [
      {
        scale: shakeAnim.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [1, 1.1, 1, 1.1, 1],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
        
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.iconCircle, iconStyle]}>
              <Ionicons name="close" size={32} color={Colors.white} />
            </Animated.View>
          </View>

      
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            
            <Text style={styles.message}>
              {message}
            </Text>

       
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.closeButtonText]}>
                  Close
                </Text>
              </TouchableOpacity>

              {showRetryButton && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={onClose}
                >
                  <Ionicons name="refresh" size={18} color={Colors.white} />
                  <Text style={[styles.buttonText, styles.retryButtonText]}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

  
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButtonX}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale.wp(5.2),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: scale.hp(2.6),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(1.3),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2.6),
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: scale.hp(4.2),
    marginBottom: scale.hp(2.1),
  },
  iconCircle: {
    width: scale.wp(20.8),
    height: scale.wp(20.8),
    borderRadius: scale.wp(10.4),
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.5),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(1.05),
    elevation: 6,
  },
  content: {
    padding: scale.wp(6.2),
    paddingTop: scale.hp(1.05),
  },
  title: {
    fontSize: scale.hp(2.9),
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: scale.hp(1.55),
  },
  message: {
    fontSize: scale.hp(2.1),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale.hp(3.1),
    marginBottom: scale.hp(3.1),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale.wp(2.1),
    paddingVertical: scale.hp(1.8),
    borderRadius: scale.hp(1.55),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.26),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(0.5),
    elevation: 3,
  },
  closeButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  retryButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  closeButtonText: {
    color: Colors.textSecondary,
  },
  retryButtonText: {
    color: Colors.white,
  },
  closeButtonX: {
    position: 'absolute',
    top: scale.hp(2.1),
    right: scale.hp(2.1),
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.wp(4.2),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});