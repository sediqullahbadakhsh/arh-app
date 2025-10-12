import { Platform, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
const TabNavStyles = StyleSheet.create({
  navigatorWrapper: {
    flex: 1,
    zIndex: 9999,
    overflow: "visible",
    backgroundColor: "#fff",
  },
  middleButtonContainer: {
    position: "absolute",
    top: -hp(3.5),
    alignSelf: "center",
    zIndex: 9999,
  },

  middleButton: {
    width: hp(7),
    height: hp(7),
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: Platform.OS === "android" ? 10 : 10,
  },
});


export default TabNavStyles;