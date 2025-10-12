import { StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";


const gameStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sub: { color: Colors.textSecondary, marginBottom: 16 },
  btn: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    marginBottom: 100,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});



export default gameStyles;