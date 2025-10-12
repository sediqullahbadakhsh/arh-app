import { Platform, StyleSheet, Dimensions } from "react-native";
import { Colors } from "../../../theme/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const AVATAR_SIZE = 100;
const EDIT_SIZE = 32;

const ProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  skeletonContainer: {
  flex: 1,
  backgroundColor: '#fff',
},

skeletonHeader: {
  height: 200,
  justifyContent: 'center',
  alignItems: 'center',
},

skeletonAvatarWrapper: {
  alignItems: 'center',
  position: 'relative',
},

skeletonAvatar: {
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: '#e0e0e0',
  marginBottom: 10,
},

skeletonEditButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#e0e0e0',
  position: 'absolute',
  bottom: 5,
  right: 5,
},

skeletonFormContainer: {
  padding: 24,
},

skeletonSectionTitle: {
  width: 200,
  height: 24,
  backgroundColor: '#e0e0e0',
  borderRadius: 6,
  marginBottom: 24,
},

skeletonInputGroup: {
  marginBottom: 20,
},

skeletonLabel: {
  width: 120,
  height: 16,
  backgroundColor: '#e0e0e0',
  borderRadius: 4,
  marginBottom: 8,
},

skeletonInput: {
  width: '100%',
  height: 50,
  backgroundColor: '#e0e0e0',
  borderRadius: 12,
},

skeletonButton: {
  width: '100%',
  height: 50,
  backgroundColor: '#e0e0e0',
  borderRadius: 25,
  marginTop: 24,
},

shimmerContainer: {
  ...StyleSheet.absoluteFillObject,
  overflow: 'hidden',
},

shimmer: {
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  transform: [{ skewX: '-20deg' }],
},
  scrollContent: {
    flexGrow: 1,
  marginBottom: 100,
  },
  header: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: EDIT_SIZE,
    height: EDIT_SIZE,
    borderRadius: EDIT_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    padding: 20,
    marginTop: -20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: 550,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 25,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  inputError: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    color: Colors.primary,
    fontSize: 13,
    marginTop: 6,
    marginLeft: 5,
    fontWeight: "500",
  },
  helpText: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 5,
    fontStyle: "italic",
  },
  updateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 14,
    marginTop: 15,
    marginBottom: 30,
    gap: 12,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textPrimary,
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imagePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,

  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  pickerOptions: {
    padding: 20,
    paddingBottom: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cancelButton: {
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 0 : 0,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#CD0202',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProfileStyles;