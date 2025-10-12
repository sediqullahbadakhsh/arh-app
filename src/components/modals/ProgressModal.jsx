import React from 'react';
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
import { Colors } from "../../theme/colors";

const { width } = Dimensions.get('window');

export const ProgressBar = ({ duration = 2000, onComplete, color = Colors.primary }) => {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={progressStyles.container}>
      <Animated.View 
        style={[
          progressStyles.bar, 
          { 
            width: widthInterpolated,
            backgroundColor: color
          }
        ]} 
      />
    </View>
  );
};

const ProgressModal = ({
  visible = false,
  onCancel,
  title = "Processing",
  message = "Please wait...",
  duration = 3000,
  progressColor = Colors.primary,
  icon = "sync-outline",
  iconColor = Colors.primary,
  onComplete,
  cancelText = "Cancel"
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={progressStyles.modalOverlay}>
        <View style={progressStyles.progressModal}>
          <View style={progressStyles.progressContent}>
            <Ionicons name={icon} size={48} color={iconColor} />
            <Text style={progressStyles.progressTitle}>{title}</Text>
            <Text style={progressStyles.progressText}>{message}</Text>
            
            <ProgressBar 
              duration={duration} 
              onComplete={onComplete}
              color={progressColor}
            />
            
            {onCancel && (
              <TouchableOpacity 
                style={progressStyles.cancelButton}
                onPress={onCancel}
              >
                <Text style={progressStyles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const progressStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressContent: {
    alignItems: 'center',
    width: '100%',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    height: 8,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 16,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
};

export default ProgressModal;