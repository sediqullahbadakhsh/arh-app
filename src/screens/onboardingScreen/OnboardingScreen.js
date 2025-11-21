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
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import DotIndicators from "../../components/DotIndicators";
import LottieView from "lottie-react-native";
import { useTranslation } from "react-i18next";
import onboardImage from '../../../assets/onboard.png';
import securePay1 from '../../../assets/lotties/SecurePay1.json';
import securep1 from '../../../assets/lotties/Securep1.json';
import mobile from '../../../assets/lotties/mobile.json';
import { scale } from "../../utils/normalizeSize";

const { width } = Dimensions.get("window");
const ILLUSTRATION = onboardImage;


const getSlides = (t) => [
  {
    key: 's1',
    title: t('onboarding.slide1.title'),
    subtitle: t('onboarding.slide1.subtitle'),
    lottie: securePay1,
  },
  {
    key: 's2', 
    title: t('onboarding.slide2.title'),
    subtitle: t('onboarding.slide2.subtitle'),
    lottie: securep1,
  },
  {
    key: 's3',
    title: t('onboarding.slide3.title'),
    subtitle: t('onboarding.slide3.subtitle'),
    lottie: mobile,
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const SLIDES = useMemo(() => getSlides(t), [t]);
  const lastIndex = SLIDES.length - 1;
  const isLast = index === lastIndex;


  const getAdjustedIndex = useCallback((rawIndex) => {
    return I18nManager.isRTL ? SLIDES.length - 1 - rawIndex : rawIndex;
  }, [SLIDES.length]);

  const getCurrentAdjustedIndex = useCallback(() => {
    return I18nManager.isRTL ? SLIDES.length - 1 - index : index;
  }, [index, SLIDES.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const rawIndex = viewableItems[0].index ?? 0;
      const adjustedIndex = I18nManager.isRTL ? SLIDES.length - 1 - rawIndex : rawIndex;
      setIndex(adjustedIndex);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const getItemLayout = useCallback(
    (_data, i) => ({ length: width, offset: width * i, index: i }),
    []
  );

  const goNext = useCallback(() => {
    const currentIndex = getCurrentAdjustedIndex();
    
    if (currentIndex < lastIndex) {
      const nextIndex = I18nManager.isRTL ? index - 1 : index + 1;
      listRef.current?.scrollToIndex({ 
        index: nextIndex, 
        animated: true 
      });
    } else {
      navigation.replace("Login");
    }
  }, [index, lastIndex, navigation, getCurrentAdjustedIndex]);

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

  const getButtonIcon = useCallback(() => {
    if (isLast) {
      return "checkmark";
    }
    return I18nManager.isRTL ? "arrow-back" : "arrow-forward";
  }, [isLast]);

  const currentAdjustedIndex = getCurrentAdjustedIndex();
  const adjustedIsLast = currentAdjustedIndex === lastIndex;

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
          // Disable RTL reversal for FlatList
          inverted={I18nManager.isRTL}
          initialScrollIndex={I18nManager.isRTL ? SLIDES.length - 1 : 0}
        />

        <View style={styles.dots}>
          <DotIndicators 
            total={SLIDES.length} 
            activeIndex={currentAdjustedIndex} 
          />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          {!adjustedIsLast ? (
            <TouchableOpacity
              onPress={skip}
              style={styles.textBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.textBtnLabel}>{t('onboarding.skip')}</Text>
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
              {adjustedIsLast ? t('onboarding.getStarted') : t('onboarding.next')}
            </Text>
            <Ionicons 
              name={getButtonIcon()} 
              size={18} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const HERO_HEIGHT = 240;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: '10%', 
    direction: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: scale.wp(6), 
    alignItems: 'center',
  },
  lottie: {
    width: scale.wp(100), 
    height: scale.hp(50), 
  },
  heroArea: {
    height: HERO_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: scale.wp(57.5), 
    height: scale.hp(22.5),
  },
  title: {
    marginTop: scale.hp(13.75), 
    fontSize: scale.hp(2.5), 
    fontFamily: 'dmsansMedium',
    color: Colors.textTitle,
    textAlign: 'center',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  subtitle: {
    marginTop: scale.hp(1.875), 
    fontSize: scale.hp(2), 
    color: Colors.textSubtitle,
    textAlign: 'center',
    fontFamily: 'dmsansRegular',
    lineHeight: scale.hp(3.25), 
    paddingHorizontal: scale.wp(1.5), 
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  dots: {
    alignItems: 'center',
    marginTop: scale.hp(1.25),
    marginBottom: scale.hp(2.5), 
  },
  bottomBar: {
    paddingHorizontal: scale.wp(6), 
    paddingTop: scale.hp(2.25), 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    direction: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  textBtn: {
    paddingHorizontal: scale.wp(2), 
    paddingVertical: scale.hp(1), 
  },
  textBtnLabel: {
    color: Colors.textDark,
    fontSize: scale.hp(2.25), 
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  primaryBtn: {
    height: scale.hp(6.25), 
    minWidth: scale.wp(40), 
    paddingHorizontal: scale.wp(4.5), 
    backgroundColor: Colors.primary,
    borderRadius: scale.hp(1.5), 
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale.wp(2), 
  },
  primaryBtnLabel: {
    color: '#fff',
    fontSize: scale.hp(1.875), 
    fontWeight: '600',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
