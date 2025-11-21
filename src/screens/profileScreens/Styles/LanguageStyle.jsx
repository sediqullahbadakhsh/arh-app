import { StyleSheet } from "react-native";
import { scale } from "../../../utils/normalizeSize";

const LanguageStyles = StyleSheet.create({
  label: {
    fontSize: scale.hp(1.8),
    marginBottom: scale.hp(0.65),
    fontWeight: '500',
    color: '#374151',
  },
  dropField: {
    height: scale.hp(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: scale.hp(1.05),
    paddingHorizontal: scale.wp(3.1),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabled: {
    opacity: 0.6,
  },
  selected: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedText: {
    marginLeft: scale.wp(2),
    color: "#000",
    fontSize: scale.hp(2.1),
  },
  flag: {
    width: scale.wp(6.2),
    height: scale.hp(2.3),
    borderRadius: scale.hp(0.25),
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale.hp(2.1),
    borderTopRightRadius: scale.hp(2.1),
    paddingVertical: scale.hp(1.3),
    maxHeight: '50%',
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale.hp(2.1),
    paddingHorizontal: scale.wp(5.2),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  langText: {
    marginLeft: scale.wp(3.1),
    fontSize: scale.hp(2.1),
    color: "#000",
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});

export default LanguageStyles;