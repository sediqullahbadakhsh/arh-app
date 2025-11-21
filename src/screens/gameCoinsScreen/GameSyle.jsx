import { StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";
import { scale } from "../../utils/normalizeSize";


const gameStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scale.hp(3.1),
  },
  badge: {
    width: scale.wp(17.5),
    height: scale.wp(17.5),
    borderRadius: scale.wp(8.75),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale.hp(1.55),
  },
  title: {
    fontSize: scale.hp(2.6),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.8),
  },
  sub: {
    color: Colors.textSecondary,
    marginBottom: scale.hp(2.1),
  },
  btn: {
    paddingHorizontal: scale.wp(4.4),
    height: scale.hp(5.7),
    borderRadius: scale.hp(2.85),
    marginBottom: scale.hp(12.9),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});


export default gameStyles;