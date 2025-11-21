import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { scale } from '../../utils/normalizeSize';

const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale.hp(2.1),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale.hp(3.1),
    fontWeight: 'bold',
    color: '#333',
    marginRight: scale.wp(2),
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.55),
    minWidth: scale.wp(5.8),
    height: scale.hp(3.1),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale.wp(1.5),
  },
  unreadCount: {
    color: '#fff',
    fontSize: scale.hp(1.55),
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: scale.hp(1.05),
    marginLeft: scale.wp(2),
  },
  listContainer: {
    padding: scale.hp(2.1),
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: scale.hp(1.55),
    marginBottom: scale.hp(1.55),
    padding: scale.hp(2.1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.25) },
    shadowOpacity: 0.08,
    shadowRadius: scale.hp(0.8),
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: scale.wp(9.75),
    height: scale.wp(9.75),
    borderRadius: scale.wp(4.9),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.9),
  },
  notificationText: {
    flex: 1,
    marginRight: scale.wp(2),
  },
  notificationTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: '#333',
    marginBottom: scale.hp(0.5),
  },
  notificationMessage: {
    fontSize: scale.hp(1.8),
    color: '#666',
    lineHeight: scale.hp(2.6),
    marginBottom: scale.hp(0.5),
  },
  notificationTime: {
    fontSize: scale.hp(1.55),
    color: '#999',
  },
  unreadDot: {
    width: scale.wp(2),
    height: scale.wp(2),
    borderRadius: scale.wp(1),
    backgroundColor: Colors.primary,
    marginTop: scale.hp(0.5),
  },
  deleteButton: {
    padding: scale.hp(0.5),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale.hp(12.9),
    padding: scale.hp(5.2),
    flex: 1,
  },
  emptyStateText: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: '#666',
    marginTop: scale.hp(2.1),
    marginBottom: scale.hp(1.05),
  },
  emptyStateSubText: {
    fontSize: scale.hp(1.8),
    color: '#999',
    textAlign: 'center',
    lineHeight: scale.hp(2.6),
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale.hp(5.2),
    flex: 1,
  },
  errorStateText: {
    fontSize: scale.hp(2.35),
    fontWeight: '600',
    color: '#f44336',
    marginTop: scale.hp(2.1),
    marginBottom: scale.hp(1.05),
  },
  errorStateSubText: {
    fontSize: scale.hp(1.8),
    color: '#666',
    textAlign: 'center',
    marginBottom: scale.hp(2.1),
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(3.9),
    paddingVertical: scale.hp(1.55),
    borderRadius: scale.hp(1.05),
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatus: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale.hp(1.05),
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: scale.hp(1.8),
    fontWeight: '600',
    marginLeft: scale.wp(1),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale.hp(2.1),
    borderTopRightRadius: scale.hp(2.1),
    maxHeight: '80%',
    padding: scale.hp(2.1),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale.hp(2.1),
    paddingBottom: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: scale.hp(2.35),
    fontWeight: 'bold',
    color: '#333',
  },
  settingsList: {
    marginBottom: scale.hp(2.1),
  },
  settingsSectionTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: '600',
    color: '#333',
    marginTop: scale.hp(2.1),
    marginBottom: scale.hp(1.55),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale.hp(1.55),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: scale.wp(2.9),
    flex: 1,
  },
  settingTitle: {
    fontSize: scale.hp(2.1),
    color: '#333',
    marginBottom: scale.hp(0.25),
  },
  settingDescription: {
    fontSize: scale.hp(1.55),
    color: '#666',
    lineHeight: scale.hp(2.1),
  },
  modalActions: {
    marginTop: scale.hp(2.1),
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.05),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconContainer: {
    width: scale.wp(11.7),
    height: scale.wp(11.7),
    borderRadius: scale.wp(5.85),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(2.9),
  },
  detailTitle: {
    flex: 1,
  },
  detailTitleText: {
    fontSize: scale.hp(2.35),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: scale.hp(0.5),
  },
  detailTime: {
    fontSize: scale.hp(1.55),
    color: '#999',
  },
  detailContent: {
    maxHeight: scale.hp(51.6),
  },
  detailMessage: {
    fontSize: scale.hp(2.1),
    color: '#333',
    lineHeight: scale.hp(3.1),
    marginBottom: scale.hp(2.6),
  },
   actionButton: {
    backgroundColor: Colors.primary,
    padding: scale.hp(2.1),
    borderRadius: scale.hp(1.05),
    alignItems: 'center',
    marginTop: scale.hp(2.1),
  },
  actionButtonText: {
    color: '#fff',
    fontSize: scale.hp(2.1),
    fontWeight: '600',
  },
});

export default notificationStyles;