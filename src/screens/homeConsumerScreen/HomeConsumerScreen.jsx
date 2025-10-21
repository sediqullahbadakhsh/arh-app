import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import { Colors } from "../../theme/colors";
import ServiceButton from "../../components/ServiceButton";
import { useAuth } from "../../auth/AuthProvider";
import { useQuery } from '@tanstack/react-query';
import { getOrdersC } from '../../services/order_services';
import { getCustomerProfile } from "../../services/authApi";
import { useTranslation } from "react-i18next";
import HomeStyles from "./Styles/HomeStyle";
import HeaderBackgroundSVG from "../../../assets/top";
import { getAppContents } from '../../services/appContentApi';
import TopupIcon from '../../../assets/icons/topup.png';
import BundleIcon from '../../../assets/icons/Data bundle.png';
import GamesIcon from '../../../assets/icons/game.png';

const { width: screenWidth } = Dimensions.get('window');

const CountdownTimer = ({ expiresAt }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expiryTime = new Date(expiresAt).getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = expiryTime - now;
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();

    if (!isExpired) {
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresAt, isExpired]);

  const formatTimeUnit = (unit) => {
    return unit < 10 ? `0${unit}` : unit;
  };

  return (
    <View style={HomeStyles.countdownContainer}>
      <Text style={HomeStyles.countdownTitle}>{t('offerEndsIn')}</Text>
      <View style={HomeStyles.timerContainer}>
        {timeLeft.days > 0 && (
          <View style={HomeStyles.timeUnit}>
            <Text style={HomeStyles.timeValue}>{formatTimeUnit(timeLeft.days)}</Text>
            <Text style={HomeStyles.timeLabel}>{t('days')}</Text>
          </View>
        )}
        <View style={HomeStyles.timeUnit}>
          <Text style={HomeStyles.timeValue}>{formatTimeUnit(timeLeft.hours)}</Text>
          <Text style={HomeStyles.timeLabel}>{t('hours')}</Text>
        </View>
        <View style={HomeStyles.timeUnit}>
          <Text style={HomeStyles.timeValue}>{formatTimeUnit(timeLeft.minutes)}</Text>
          <Text style={HomeStyles.timeLabel}>{t('minutes')}</Text>
        </View>
        <View style={HomeStyles.timeUnit}>
          <Text style={HomeStyles.timeValue}>{formatTimeUnit(timeLeft.seconds)}</Text>
          <Text style={HomeStyles.timeLabel}>{t('seconds')}</Text>
        </View>
      </View>
      {isExpired && (
        <Text style={HomeStyles.expiredText}>{t('offerExpired')}</Text>
      )}
    </View>
  );
};

export default function HomeConsumerScreen({ navigation }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState(user?.fullName || user?.username || t('customer'));
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);

  const { data: appContentsData, isLoading: offersLoading, refetch: refetchOffers } = useQuery({
    queryKey: ['app-contents'],
    queryFn: () => getAppContents({ active: true }), 
  });

  console.log(appContentsData, "this is app content data");

  const offersData = useMemo(() => {
    if (!appContentsData?.data) return [];

    return appContentsData.data
      .filter(content => content.active && (content.type === "offer" || content.type === "promotion"))
      .map(content => {
        const currentLang = i18n.language || 'en';
        const title = content.title?.[currentLang] || content.title?.en || t('specialOffer');
        const subtitle = content.subTitle?.[currentLang] || content.subTitle?.en || t('limitedTimeOffer');
        

        const getIconByType = (type) => {
          switch (type) {
            case 'offer':
              return 'gift-outline';
            case 'promotion':
              return 'megaphone-outline';
            case 'event':
              return 'calendar-outline';
            case 'distributor':
              return 'storefront-outline';
            default:
              return 'gift-outline';
          }
        };

        const getBackgroundColor = (type) => {
          switch (type) {
            case 'offer':
              return '#C40C02';
            case 'promotion':
              return '#E48D08';
            case 'event':
              return '#C40C02';
            case 'distributor':
              return '#E48D08';
            default:
              return '#C40C02';
          }
        };

        return {
          id: content.id,
          title: title,
          description: subtitle,
          backgroundColor: getBackgroundColor(content.type),
          icon: getIconByType(content.type),
          expiresAt: content.expire_at,
          type: content.type,
          image: content.img
        };
      });
  }, [appContentsData?.data, i18n.language, t]);

  const fetchCustomerProfile = async () => {
    try {
      const response = await getCustomerProfile();
      if (response.success) {
        setCustomerData(response.data);
        
        if (response.data.fullName) {
          setUserName(response.data.fullName);
        } else if (response.data.username) {
          setUserName(response.data.username);
        }
        
        if (response.data.profileImg) {
          const fullImageUrl = response.data.profileImg.startsWith('http') 
            ? response.data.profileImg 
            : `http://3.67.144.22/backend/uploads/customer_pictures/${response.data.profileImg}`;
          setProfileImage(fullImageUrl);
        }
        
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      return null;
    }
  };

  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getOrdersC({ page: 1, limit: 10, status: '' }),
  });

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case 'succeeded':
        return t('status.succeeded');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.pending');
      default:
        return status;
    }
  };
  
  const getServiceName = (source) => {
    switch (source) {
      case 'stripe_card':
        return t('services.mobileTopup');
      case 'data_bundle':
        return t('services.dataBundle');
      case 'game_coins':
        return t('services.gameCoins');
      default:
        return t('transaction');
    }
  };
  
  const getServiceIcon = (source) => {
    switch (source) {
      case 'stripe_card':
        return 'phone-portrait-outline';
      case 'data_bundle':
        return 'wifi-outline';
      case 'game_coins':
        return 'game-controller-outline';
      default:
        return 'document-text-outline';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), fetchCustomerProfile(), refetchOffers()]).then(() => {
      setRefreshing(false);
    });
  }, [refetchOffers]);

  const goToNotifications = () => navigation.navigate("Notifications");
  const goToAllOrders = () => navigation.navigate("Order");
  const goToProfile = () => navigation.navigate("ProfileDetails");
  const goToMerchant = () => navigation.navigate("MerchantSignup");

  const SERVICES_B2C = useMemo(
    () => [
      {
        key: "MobileTopup1",
        label: t('services.mobileTopup'),
        icon: <Image source={TopupIcon} style={{ width: 100, height: 100 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("Topup1"),
      },
      {
        key: "DataBundle",
        label: t('services.dataBundle'),
        icon: <Image source={BundleIcon}  style={{ width: 80, height: 80 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("Data"),
      },
      {
        key: "GameCoins",
        label: t('services.gameCoins'),
        icon: <Image source={GamesIcon}  style={{ width: 90, height: 90 }} resizeMode="contain" />,
        onPress: () => navigation.navigate("GameCoins"),
      },
    ],
    [navigation, t]
  );

  const renderCarouselItem = ({ item, index }) => {
    return (
      <View style={[
        HomeStyles.offerCard,
        { backgroundColor: item.backgroundColor }
      ]}>
        <View style={HomeStyles.offerContent}>
          <View style={HomeStyles.offerIconContainer}>
            <Ionicons name={item.icon} size={32} color="#fff" />
          </View>
          <View style={HomeStyles.offerTextContainer}>
            <Text style={HomeStyles.offerTitle}>{item.title}</Text>
            <Text style={HomeStyles.offerDescription}>{item.description}</Text>
            <CountdownTimer expiresAt={item.expiresAt} />
          </View>
        </View>
      </View>
    );
  };

  const PromotionalBanner = () => (
    <TouchableOpacity 
      style={HomeStyles.promoBanner}
      onPress={() => navigation.navigate("MerchantApplication")} 
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#C40C02', '#E48D08']}
        style={HomeStyles.promoGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={HomeStyles.promoContent}>
          <View style={HomeStyles.promoTextContainer}>
            <Text style={HomeStyles.promoTitle}>{t('becomeMerchant')}</Text>
            <Text style={HomeStyles.promoSubtitle}>
              {t('merchantBenefits')}
            </Text>
          </View>
          <View style={HomeStyles.promoButton}>
            <Text style={HomeStyles.promoButtonText}>{t('getStarted')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>
        <View style={HomeStyles.promoIcon}>
          <Ionicons name="storefront-outline" size={40} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const OffersSlider = () => {
    const { t } = useTranslation();
    
    if (offersLoading) {
      return (
        <View style={HomeStyles.offersContainer}>
          <View style={HomeStyles.offersHeader}>
            <Text style={HomeStyles.offersTitle}>{t('limitedTimeOffers')}</Text>
          </View>
          <View style={HomeStyles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={HomeStyles.loadingText}>{t('loadingOffers')}</Text>
          </View>
        </View>
      );
    }

    if (offersData.length === 0) {
      return null; // Don't show offers section if no offers available
    }

    return (
      <View style={HomeStyles.offersContainer}>
        <View style={HomeStyles.offersHeader}>
          <Text style={HomeStyles.offersTitle}>{t('limitedTimeOffers')}</Text>
          <TouchableOpacity>
            <Text style={HomeStyles.seeAll}>{t('viewAll')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={HomeStyles.sliderContainer}>
          <Carousel
            loop
            width={screenWidth - 40}
            height={200}
            autoPlay={true}
            autoPlayInterval={4000}
            data={offersData}
            scrollAnimationDuration={1000}
            renderItem={renderCarouselItem}
            onSnapToItem={(index) => setCurrentOfferIndex(index)}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxScrollingOffset: 50,
            }}
          />
          
          {offersData.length > 1 && (
            <View style={HomeStyles.pagination}>
              {offersData.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentOfferIndex(index)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      HomeStyles.paginationDot,
                      index === currentOfferIndex && HomeStyles.paginationDotActive
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const TransactionRow = ({ item }) => (
    <TouchableOpacity
      style={HomeStyles.txRow}
      onPress={() => navigation.navigate("Orders")}
      activeOpacity={0.85}
    >
      <View style={HomeStyles.txLeft}>
        <View style={[
          HomeStyles.txIconWrap,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Ionicons
            name={getServiceIcon(item.source)} 
            size={20} 
            color={item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107'} 
          />
        </View>
        <View style={HomeStyles.txInfo}>
          <Text style={HomeStyles.txTitle}>
            {getServiceName(item.source)}
          </Text>
          <Text style={HomeStyles.txSub}>{formatDate(item.createdAt)}</Text>
          <Text style={HomeStyles.txPhone}>{item.receiver}</Text>
        </View>
      </View>
      <View style={HomeStyles.txRight}>
        <Text style={[
          HomeStyles.txAmount,
          { color: item.status === 'succeeded' ? '#4CAF50' : 
                 item.status === 'failed' ? '#F44336' : '#FFC107' }
        ]}>
          {Number(item.amount).toFixed(2)} {item.currency}
        </Text>
        <View style={[
          HomeStyles.statusBadge,
          { backgroundColor: item.status === 'succeeded' ? '#E8F5E9' : 
                            item.status === 'failed' ? '#FFEBEE' : '#FFF8E1' }
        ]}>
          <Text style={[
            HomeStyles.statusText,
            { color: item.status === 'succeeded' ? '#4CAF50' : 
                   item.status === 'failed' ? '#F44336' : '#FFC107' }
          ]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={HomeStyles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={HomeStyles.header}>
        <View style={HomeStyles.svgContainer}>
          <HeaderBackgroundSVG width="100%" height="100%" />
        </View>
        <View style={HomeStyles.headerContent}>
          <TouchableOpacity 
            style={HomeStyles.userInfo} 
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <View style={HomeStyles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={HomeStyles.avatarImage}
                  onError={(e) => {
                    console.log('Image load error:', e.nativeEvent.error);
                    setProfileImage(null);
                  }}
                />
              ) : (
                <View style={HomeStyles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
              )}
            </View>
            <View style={HomeStyles.userTextContainer}>
              <Text style={HomeStyles.greeting}>{t('greeting.hi')},</Text>
              <Text style={HomeStyles.userName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNotifications} style={HomeStyles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={HomeStyles.servicesHeader}>
          {/* <Text style={HomeStyles.servicesTitle}>{t('services.title')}</Text> */}
        </View>
        <View style={HomeStyles.servicesGrid}>
          {SERVICES_B2C.map((s) => (
            <ServiceButton
              key={s.key}
              label={s.label}
              icon={s.icon}
              onPress={s.onPress}
            />
          ))}
        </View>

        <PromotionalBanner />
        <OffersSlider />

        <View style={HomeStyles.recentContainer}>
          <View style={HomeStyles.recent}>
            <View style={HomeStyles.recentHeader}>
              <Text style={HomeStyles.recentTitle}>{t('transactions.recent')}</Text>
              <TouchableOpacity onPress={goToAllOrders}>
                <Text style={HomeStyles.seeAll}>{t('common.seeAll')}</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={HomeStyles.loader} />
            ) : isError ? (
              <View style={HomeStyles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color="#f44336" />
                <Text style={HomeStyles.errorText}>{t('errors.loadTransactions')}</Text>
                <TouchableOpacity onPress={refetch} style={HomeStyles.retryButton}>
                  <Text style={HomeStyles.retryButtonText}>{t('common.tryAgain')}</Text>
                </TouchableOpacity>
              </View>
            ) : ordersData?.data && ordersData.data.length > 0 ? (
              ordersData.data.map((tx) => (
                <TransactionRow key={tx.id} item={tx} />
              ))
            ) : (
              <View style={HomeStyles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color="#ccc" />
                <Text style={HomeStyles.emptyStateText}>{t('transactions.noTransactions')}</Text>
              </View>
            )}
          </View>
        </View>   
      </ScrollView>
    </SafeAreaView>
  );
}