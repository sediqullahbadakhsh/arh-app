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

export default function DeleteConfirmationModal({
  visible = false,
  onCancel,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  itemName = "",
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);


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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={32} color={Colors.white} />
            </View>
          </View>


          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            
            <Text style={styles.message}>
              {message}
            </Text>

            {itemName ? (
              <View style={styles.itemNameContainer}>
                <Text style={styles.itemNameLabel}>Item to delete:</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  "{itemName}"
                </Text>
              </View>
            ) : null}


            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={Colors.white} />
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>
                      Deleting...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={Colors.white} />
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>
                      {confirmText}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    marginTop: scale.hp(3.1),
    marginBottom: scale.hp(1.05),
  },
  iconCircle: {
    width: scale.wp(16.6),
    height: scale.wp(16.6),
    borderRadius: scale.wp(8.3),
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
    paddingTop: scale.hp(2.1),
  },
  title: {
    fontSize: scale.hp(2.6),
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: scale.hp(1.55),
  },
  message: {
    fontSize: scale.hp(2),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale.hp(2.9),
    marginBottom: scale.hp(2.1),
  },
  itemNameContainer: {
    backgroundColor: '#FEF2F2',
    padding: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
    borderLeftWidth: scale.wp(1),
    borderLeftColor: '#DC2626',
    marginBottom: scale.hp(2.6),
  },
  itemNameLabel: {
    fontSize: scale.hp(1.55),
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: scale.hp(0.5),
  },
  itemName: {
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: scale.wp(3.1),
    marginTop: scale.hp(1.05),
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
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
  },
  deleteButtonText: {
    color: Colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.wp(2.1),
  },
});