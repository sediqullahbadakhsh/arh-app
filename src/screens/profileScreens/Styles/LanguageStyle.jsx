import { StyleSheet } from "react-native";

const LanguageStyles = StyleSheet.create({
  label: { 
    fontSize: 14, 
    marginBottom: 5,
    fontWeight: '500',
    color: '#374151'
  },
  dropField: {
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
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
    alignItems: "center" 
  },
  selectedText: { 
    marginLeft: 8, 
    color: "#000",
    fontSize: 16
  },
  flag: { 
    width: 24, 
    height: 18,
    borderRadius: 2
  },
  modal: { 
    justifyContent: "flex-end", 
    margin: 0 
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    maxHeight: '50%'
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  langText: { 
    marginLeft: 12, 
    fontSize: 16, 
    color: "#000",
    flex: 1
  },
  checkIcon: {
    marginLeft: 'auto'
  }
});

export default LanguageStyles;