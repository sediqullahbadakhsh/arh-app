// src/screens/OnboardingScreen.jsx
import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import DotIndicators from "../components/DotIndicators";
import LottieView from "lottie-react-native";
import onboardImage from '../../assets/onboard.png';
import securePay1 from '../../assets/lotties/SecurePay1.json';
import securep1 from '../../assets/lotties/Securep1.json';
import mobile from '../../assets/lotties/mobile.json';

const { width } = Dimensions.get("window");
const ILLUSTRATION = onboardImage;

const SLIDES = [
  {
    key: 's1',
    title: 'Top-up Anytime, Anywhere',
    subtitle: 'Send airtime and data to any mobile number in any country — instantly.',
    lottie: securePay1,
  },
  {
    key: 's2',
    title: 'All Networks. All Wallets.',
    subtitle: 'Top-up across networks, pay with your preferred wallet in your local currency.',
    lottie: securep1,
  },
  {
    key: 's3',
    title: 'Your Security, Our Priority',
    subtitle: 'Bank-grade encryption, OTPs, and real-time monitoring keep your transactions safe.',
    lottie: mobile,
  },
];


export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const lastIndex = SLIDES.length - 1;
  const isLast = index === lastIndex;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) setIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const getItemLayout = useCallback(
    (_data, i) => ({ length: width, offset: width * i, index: i }),
    []
  );

  const goNext = useCallback(() => {
    if (index < lastIndex) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      navigation.replace("Login");
    }
  }, [index, lastIndex, navigation]);

  const skip = useCallback(() => navigation.replace("Login"), [navigation]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={{ width }}>
     
        <View style={[styles.slideInner, { paddingTop: insets.top + 124 }]}>
      <View style={styles.heroArea}>
  <LottieView
    source={item.lottie}
    autoPlay
    loop
    style={styles.lottie}
  />
</View>

     
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    ),
    [insets.top]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.root}>
        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={SLIDES}
          keyExtractor={(it) => it.key}
          renderItem={renderItem}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfigRef.current}
          getItemLayout={getItemLayout}
        />

    
        <View style={styles.dots}>
          <DotIndicators total={SLIDES.length} activeIndex={index} />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          {!isLast ? (
            <TouchableOpacity
              onPress={skip}
              style={styles.textBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.textBtnLabel}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 64 }} />
          )}

          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.9}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnLabel}>
              {isLast ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const HERO_HEIGHT = 240;

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: "10%" },
  slideInner: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  lottie: {
  width: 400,
  height: 400,
},

  heroArea: {
    height: HERO_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  heroImage: {
    width: 230,
    height: 180,
  },

  title: {
    marginTop: 110,
    fontSize: 20,
    // fontWeight: "500",
    fontFamily: "dmsansMedium",
    color: Colors.textTitle,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 15,
    fontSize: 16,
    color: Colors.textSubtitle,
    textAlign: "center",
    fontFamily: "dmsansRegular",
    lineHeight: 26,
    paddingHorizontal: 6,
  },

  dots: { alignItems: "center", marginTop: 10, marginBottom: 20 },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  textBtnLabel: { color: Colors.textDark, fontSize: 18 },

  primaryBtn: {
    height: 50,
    minWidth: 160,
    paddingHorizontal: 18,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
