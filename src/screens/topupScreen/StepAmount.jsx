//screens/topupscreen/StepAmount.jsx
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  useSharedValue,
  cancelAnimation,
  interpolateColor
} from "react-native-reanimated";
import TopUpStyles from "./TopupStyle";
import React, { useState, useEffect, useRef } from "react";
import { Colors } from "../../theme/colors";
import { 
  TouchableOpacity, 
  View, 
  Text, 
  TextInput, 
  ScrollView,
  FlatList,
  Image,
  Alert,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../../components/PrimaryButton";
import { useTranslation } from "react-i18next";
import { getDataProducts, getTopupProductsCustomer, getBundleCategories, getBundleTypes } from "../../services/merchantApi";
import { useQuery } from "@tanstack/react-query";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINIMUM_CUSTOM_AMOUNT = 60; // Minimum amount for custom topup

const SkeletonLoader = ({ type = 'card', count = 3 }) => {
  if (type === 'card') {
    return (
      <View>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={ProductStyles.skeletonCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
              <View style={ProductStyles.skeletonImage} />
              <View style={{ flex: 1 }}>
                <View style={[ProductStyles.skeletonLine, { width: '70%', marginBottom: 8 }]} />
                <View style={[ProductStyles.skeletonLine, { width: '90%', marginBottom: 8 }]} />
                <View style={[ProductStyles.skeletonLine, { width: '80%' }]} />
              </View>
            </View>
            
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center",
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#F5F5F5'
            }}>
              <View>
                <View style={[ProductStyles.skeletonLine, { width: 100, height: 24 }]} />
                <View style={[ProductStyles.skeletonLine, { width: 80, height: 14, marginTop: 4 }]} />
              </View>
              <View style={ProductStyles.skeletonChip} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'category') {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={ProductStyles.categoriesScroll}
      >
        <View style={ProductStyles.categoriesContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={ProductStyles.skeletonCategoryChip} />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (type === 'amount') {
    return (
      <View style={TopUpStyles.quickAmountsList}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={TopUpStyles.skeletonAmountItem} />
        ))}
      </View>
    );
  }

  return null;
};

const ProductStyles = {
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  smallLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 56,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  bundleCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ scale: 1 }],
  },
  bundleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBF9',
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  operatorLogoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  operatorLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  bundleDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  bundleFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureTag: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1F0FF',
  },
  featureText: {
    fontSize: 11,
    color: '#0066CC',
    fontWeight: '600',
  },
  bundleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  bundlePrice: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  bundleDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  dummyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCard: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#F0F0F0",
  },
  skeletonImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  skeletonChip: {
    width: 80,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  skeletonCategoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    minWidth: 100,
  },
};

// Animated Amount Item Component
const AnimatedAmountItem = ({ amount, isSelected, onPress, index }) => {
  const animationProgress = useSharedValue(0);
  const borderAnimation = useSharedValue(0);
  
  useEffect(() => {
    if (isSelected) {
      // Start the linear border animation when selected
      borderAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.linear }),
          withTiming(0, { duration: 1500, easing: Easing.linear })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
      
      // Pulse animation for background
      animationProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      // Stop animations when not selected
      cancelAnimation(borderAnimation);
      cancelAnimation(animationProgress);
      borderAnimation.value = 0;
      animationProgress.value = 0;
    }
    
    return () => {
      cancelAnimation(borderAnimation);
      cancelAnimation(animationProgress);
    };
  }, [isSelected]);
  
  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColors = interpolateColor(
      borderAnimation.value,
      [0, 0.5, 1],
      [Colors.primary, '#FFA500', Colors.primary]
    );
    
    return {
      borderColor: borderColors,
      borderWidth: isSelected ? 2 : 1,
      shadowColor: borderColors,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: borderAnimation.value * 0.3,
      shadowRadius: 8,
      elevation: isSelected ? 5 + borderAnimation.value * 3 : 1,
      transform: [
        {
          scale: isSelected ? 1 + animationProgress.value * 0.02 : 1,
        },
      ],
    };
  });
  
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isSelected 
        ? interpolateColor(
            animationProgress.value,
            [0, 1],
            ['#FFF5F5', '#FFE5E5']
          )
        : '#FFFFFF',
    };
  });
  
  return (
    <Animated.View style={[
      TopUpStyles.quickAmountItem,
      animatedBorderStyle,
      animatedBackgroundStyle
    ]}>
      <TouchableOpacity
        style={TopUpStyles.quickAmountTouchable}
        onPress={() => onPress(amount)}
        activeOpacity={0.7}
      >
        <View style={TopUpStyles.amountInfo}>
          <Text style={[
            TopUpStyles.amountValue,
            isSelected && TopUpStyles.amountValueSelected
          ]}>
            {amount.afn} AFN
          </Text>
          
          <Animated.Text style={[
            TopUpStyles.amountSubtext,
            isSelected && TopUpStyles.amountSubtextSelected
          ]}>
            ${amount.totalAmountInUSD.toFixed(2)} USD
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

function BundleProductSelection({
  country,
  localNumber,
  product,
  setProduct,
  onContinue,
  onActivateBundle
}) {
  const [bundleCategories, setBundleCategories] = useState([]);
  const [bundleTypes, setBundleTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    const fetchBundleData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingTypes(true);
        
        const [categoriesRes, typesRes] = await Promise.all([
          getBundleCategories(),
          getBundleTypes()
        ]);
        
        setBundleCategories(categoriesRes?.data || []);
        setBundleTypes(typesRes?.data || []);
        
        if (categoriesRes?.data?.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesRes.data[0]);
        }
        if (typesRes?.data?.length > 0 && !selectedType) {
          setSelectedType(typesRes.data[0]);
        }
      } catch (error) {
        console.error("Error loading bundle filters:", error);
      } finally {
        setLoadingCategories(false);
        setLoadingTypes(false);
      }
    };

    fetchBundleData();
  }, []);

  useEffect(() => {
    const getProductsForAgent = async () => {
      if (!country?.id) return;
      
      try {
        setLoading(true);
        const filter = {
          countryId: country?.id,
          productCategoryId: selectedCategory?.id,
          productTypeId: selectedType?.id,
          productFor: "BUNDLE"
        };
        const res = await getDataProducts(filter);
        console.log("Fetched Bundle Products:", res);
        setProducts(res?.data || []);
      } catch (error) {
        console.error("Error fetching bundle products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategory && selectedType) {
      getProductsForAgent();
    }
  }, [country, selectedCategory, selectedType]);

  const filteredProducts = products.filter((p) =>
    !search.trim() || 
    p.productName?.toLowerCase().includes(search.trim().toLowerCase()) ||
    p.description?.toLowerCase().includes(search.trim().toLowerCase()) ||
    p.price?.toString().includes(search.trim())
  );

  const handleProductSelect = async (selectedProduct) => {
    if (activating) return;
    
    setProduct(selectedProduct);
    setActivating(true);

    setTimeout(() => {
      setActivating(false);
      if (onContinue) {
        onContinue();
      }
    }, 300);
  };

  const renderProductImage = (item) => {
    if (item.image) {
      return (
        <Image 
          source={{ uri: item.image }} 
          style={ProductStyles.productImage}
          onError={() => console.log('Image load failed for:', item.productName)}
        />
      );
    }

    return (
      <View style={ProductStyles.productImage}>
        <View style={ProductStyles.dummyIcon}>
          <Ionicons name="cellular" size={24} color={Colors.primary} />
        </View>
      </View>
    );
  };

  const renderProductItem = ({ item }) => {
    const active = product?.id === item.id;

    return (
      <TouchableOpacity
        style={[ProductStyles.bundleCard, active && ProductStyles.bundleCardActive]}
        onPress={() => handleProductSelect(item)}
        activeOpacity={0.85}
        disabled={activating}
      >
        <View style={ProductStyles.bundleHeader}>
          {renderProductImage(item)}
          <View style={ProductStyles.bundleInfo}>
            <Text style={[ProductStyles.bundleName, active && { color: Colors.primary }]}>
              {item.productName?.en || item.productName}
            </Text>
            <Text style={[ProductStyles.bundlePrice, active && { color: Colors.primary }]}>
              {item.price} AFN
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {loadingCategories ? (
        <>
          <SkeletonLoader type="category" />
        </>
      ) : bundleCategories.length > 0 && (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={ProductStyles.categoriesScroll}
          >
            <View style={ProductStyles.categoriesContainer}>
              {bundleCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    ProductStyles.categoryChip, 
                    selectedCategory?.id === category.id && ProductStyles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  disabled={activating}
                >
                  <Text style={[
                    ProductStyles.categoryText, 
                    selectedCategory?.id === category.id && ProductStyles.categoryTextActive
                  ]}>
                    {category.category_name?.en || category.category_name || "Unknown"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {loadingTypes ? (
        <>
          <Text style={ProductStyles.smallLabel}>Type</Text>
          <SkeletonLoader type="category" />
        </>
      ) : bundleTypes.length > 0 && (
        <>
          <Text style={ProductStyles.smallLabel}>Validity</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={ProductStyles.categoriesScroll}
          >
            <View style={ProductStyles.categoriesContainer}>
              {bundleTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    ProductStyles.categoryChip, 
                    selectedType?.id === type.id && ProductStyles.categoryChipActive
                  ]}
                  onPress={() => setSelectedType(type)}
                  disabled={activating}
                >
                  <Text style={[
                    ProductStyles.categoryText, 
                    selectedType?.id === type.id && ProductStyles.categoryTextActive
                  ]}>
                    {type.productType?.en || type.productType || "Unnamed Type"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <View style={ProductStyles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={ProductStyles.searchIcon} />
        <TextInput
          placeholder="Search bundles..."
          value={search}
          onChangeText={setSearch}
          style={ProductStyles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={ProductStyles.emptyProducts}>
              <Ionicons name="wifi-outline" size={64} color="#DDD" />
              <Text style={ProductStyles.emptyProductsText}>
                {search ? "No bundles found for your search" : "No bundles available for this category/type"}
              </Text>
              <Text style={[ProductStyles.emptyProductsText, { fontSize: 14, marginTop: 8 }]}>
                Try selecting different categories or types
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function StepAmount({
  product,
  setProduct,
  customAfn,
  setCustomAfn,
  usd,
  afn,
  onEditNumber,
  exchangeRate,
  slabPercentage,
  calculateBaseAmount,
  calculateFeeAmount,
  loadingData,
  serviceType,
  setServiceType,
  showPopularAmounts,
  calculateUsdAmount,
  onSelectPopularAmount,
  showContinueButton,
  onContinue,
  canContinue,
  country,
  localNumber,
  dial,
  onBundleActivated,
  goNext
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedPopularAmount, setSelectedPopularAmount] = useState(null);
  const [localCustomAfn, setLocalCustomAfn] = useState(customAfn || "");
  const [amountValidationError, setAmountValidationError] = useState("");


  const { 
    data: rechargeProductsData, 
    isLoading: loadingRechargeProducts,
    error: rechargeProductsError 
  } = useQuery({
    queryKey: ['topupProducts', country?.id, serviceType],
    queryFn: async () => {
      if (!country?.id || serviceType !== 'recharge') {
        return { data: [] };
      }
      
      try {
        const filter = { 
          countryId: country.id,
        };
        
        console.log("Fetching topup products for country:", country.id);
        const res = await getTopupProductsCustomer(filter);
        console.log("Topup products response:", res);
        
        return res || { data: [] };
      } catch (error) {
        console.error("Error in queryFn:", error);
        return { data: [] };
      }
    },
    enabled: serviceType === 'recharge' && !!country?.id,
    staleTime: 60000, 
    cacheTime: 120000, 
  });
 console.log("Recharge products data:", rechargeProductsData);
  useEffect(() => {
    setLocalCustomAfn(customAfn || "");
  }, [customAfn]);

  useEffect(() => {
    if (localCustomAfn && localCustomAfn.trim() !== "" && product && !product.custom) {
      setProduct(null);
      setSelectedPopularAmount(null);
    }
  }, [localCustomAfn]);

  const rechargeProducts = rechargeProductsData?.data || [];
  

  const customProduct = rechargeProducts.find(p => 
    p.basePrice === 0 && 
    (p.productName?.toLowerCase().includes('custom') || 
     p.productName?.toLowerCase().includes('topup'))
  );

  console.log("Recharge products count:", rechargeProducts.length);
  console.log("Custom product found:", customProduct);

  const rechargeAmounts = React.useMemo(() => {
    if (rechargeProducts.length > 0) {
      return rechargeProducts
        .filter(product => product.basePrice > 0)
        .map(product => {
          const basePrice = parseFloat(product.basePrice);
          const basePriceInUSD = parseFloat(product.basePriceInUSD) || 0;
          const totalAmountInUSD = parseFloat(product.totalAmountInUSD) || 0;
          const serviceSlabPercentage = parseFloat(product.serviceSlabPercentage) || 0;
          
          return {
            id: product.id,
            afn: basePrice,
            basePrice: basePrice,
            basePriceInUSD: basePriceInUSD,
            totalAmountInUSD: totalAmountInUSD,
            serviceSlabPercentage: serviceSlabPercentage,
            productName: product.productName?.en || product.productName,
            product: product,
            slabPercentage: product.slabPercentage || 0,
            serviceSlabPercentage: product.serviceSlabPercentage || 0,
            totalAmountInProductCurrency: product.totalAmountInProductCurrency || basePrice
          };
        })
        .sort((a, b) => a.afn - b.afn);
    }
    

    const defaultAmounts = [50, 100, 150, 250, 500, 1000];
    return defaultAmounts.map(amount => ({
      id: amount.toString(),
      afn: amount,
      basePrice: amount,
      basePriceInUSD: calculateBaseAmount(amount),
      totalAmountInUSD: calculateUsdAmount(amount),
      serviceSlabPercentage: slabPercentage,
      productName: `${amount} AFN Topup`,
      product: null,
      slabPercentage: slabPercentage,
      serviceSlabPercentage: 0,
      totalAmountInProductCurrency: amount
    }));
  }, [rechargeProducts, calculateBaseAmount, calculateUsdAmount, slabPercentage]);

  const calculateTotalForCustomAmount = (baseAmount) => {
    if (!baseAmount || isNaN(baseAmount)) return 0;
    
    const amount = parseFloat(baseAmount);

    let totalAmount = amount;
    
    if (product?.slabPercentage) {
      totalAmount += amount * (product.slabPercentage / 100);
    }
    
    if (product?.serviceSlabPercentage) {
      totalAmount += amount * (product.serviceSlabPercentage / 100);
    }
    
    return totalAmount;
  };

  const calculateUsdForCustomAmount = (totalAfn) => {
    if (!exchangeRate) return 0;
    const usdAmount = totalAfn * exchangeRate;
    return parseFloat(usdAmount.toFixed(2));
  };

  const customAmountTotal = React.useMemo(() => {
    if (!localCustomAfn || localCustomAfn.trim() === "") return 0;
    
    const baseAmount = parseFloat(localCustomAfn);
    if (isNaN(baseAmount)) return 0;
    
    return calculateTotalForCustomAmount(baseAmount);
  }, [localCustomAfn, product]);

  const customAmountUSD = React.useMemo(() => {
    if (!localCustomAfn || localCustomAfn.trim() === "") return 0;
    
    const baseAmount = parseFloat(localCustomAfn);
    if (isNaN(baseAmount)) return 0;
    
    const totalAfn = calculateTotalForCustomAmount(baseAmount);
    return calculateUsdForCustomAmount(totalAfn);
  }, [localCustomAfn, product, exchangeRate]);

  const hasCustomAmount = localCustomAfn && localCustomAfn.trim() !== "" && !isNaN(parseFloat(localCustomAfn));

  // Function to validate custom amount
  const validateCustomAmount = (amount) => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
      setAmountValidationError("");
      return false;
    }
    
    if (amountValue < MINIMUM_CUSTOM_AMOUNT) {
      setAmountValidationError(`Minimum custom amount is ${MINIMUM_CUSTOM_AMOUNT} AFN`);
      return false;
    }
    
    setAmountValidationError("");
    return true;
  };

  const handleClearAmount = () => {
    setLocalCustomAfn("");
    setCustomAfn(""); 
    setProduct(null);
    setSelectedPopularAmount(null);
    setAmountValidationError("");
  };

  const handleCustomAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setLocalCustomAfn(cleanedText);
    setCustomAfn(cleanedText);
    setSelectedPopularAmount(null);
    
    // Validate the amount
    validateCustomAmount(cleanedText);
    
    if (cleanedText && customProduct) {
      const customAmount = parseFloat(cleanedText) || 0;
      
      // Only set product if amount meets minimum requirement
      if (customAmount >= MINIMUM_CUSTOM_AMOUNT) {
        console.log("Setting custom product for amount:", cleanedText);
        const totalAfn = calculateTotalForCustomAmount(customAmount);
        const totalUsd = calculateUsdForCustomAmount(totalAfn);
        
        setProduct({
          ...customProduct,
          customAmount: customAmount,
          basePrice: customAmount,
          price: customAmount,
          totalAmountInProductCurrency: totalAfn,
          totalAmountInUSD: totalUsd
        });
      } else {
        setProduct(null);
      }
    }
  };

  const handlePopularAmountSelect = (amount) => {
    console.log("Selected popular amount:", amount);
    
    setLocalCustomAfn("");
    setCustomAfn("");
    setAmountValidationError("");
    
    if (amount.product) {
      setProduct(amount.product);
    }
    setSelectedPopularAmount(amount);
    
    onSelectPopularAmount?.(amount);
    

    setTimeout(() => {
      onContinue?.();
    }, 300);
  };

  const handleCustomAmountContinue = () => {
    // Check if amount meets minimum requirement
    const amountValue = parseFloat(localCustomAfn);
    if (isNaN(amountValue) || amountValue < MINIMUM_CUSTOM_AMOUNT) {
      setAmountValidationError(`Minimum custom amount is ${MINIMUM_CUSTOM_AMOUNT} AFN`);
      Alert.alert("Invalid Amount", `Minimum custom amount is ${MINIMUM_CUSTOM_AMOUNT} AFN`);
      return;
    }
    
    if (hasCustomAmount && customProduct) {
      console.log("Continuing with custom amount:", {
        customAfn: localCustomAfn,
        customProduct: customProduct,
        basePrice: parseFloat(localCustomAfn),
        totalAfn: customAmountTotal,
        totalUsd: customAmountUSD
      });

      const customAmount = parseFloat(localCustomAfn) || 0;
      const customProductWithAmount = {
        ...customProduct,
        customAmount: customAmount,
        basePrice: customAmount,
        price: customAmount,
        totalAmountInProductCurrency: customAmountTotal,
        totalAmountInUSD: customAmountUSD
      };
      
      setProduct(customProductWithAmount);
      
      onContinue?.();
    } else {
      console.log("Cannot continue - missing custom amount or product:", {
        hasCustomAmount,
        customProduct,
        localCustomAfn
      });
      Alert.alert("Error", "Please enter a valid amount");
    }
  };

  const handleBundleContinue = () => {
    if (product && serviceType === 'bundle') {
      console.log("Proceeding to bundle payment:", product);
      onContinue?.();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {serviceType === 'recharge' ? (
          <>
            <Text style={TopUpStyles.sectionTitle}>{t('enterAmount')}</Text>
            
            <View style={[
              TopUpStyles.customRow,
              {
                borderColor: amountValidationError ? '#EF4444' : (isFocused ? Colors.primary : '#2e2e2eff'),
                backgroundColor: '#FFFFFF',
                shadowColor: amountValidationError ? '#EF4444' : Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isFocused ? 0.15 : 0,
                shadowRadius: isFocused ? 10 : 0,
                elevation: isFocused ? 3 : 0,
              }
            ]}>
              <Text style={TopUpStyles.currencyTag}>AFN</Text>
              <TextInput
                value={localCustomAfn}
                onChangeText={handleCustomAmountChange}
                placeholder="0"
                keyboardType="decimal-pad"
                style={TopUpStyles.customInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              
              {hasCustomAmount && !loadingData && !amountValidationError && (
                <View style={TopUpStyles.usdEquivalentContainer}>
                  <Text style={[TopUpStyles.usdEquivalentText, { fontSize: 12, opacity: 0.7 }]}>
                    ≈ ${customAmountUSD.toFixed(2)} USD
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[TopUpStyles.clearBtn, { opacity: localCustomAfn ? 1 : 0.5 }]}
                disabled={!localCustomAfn}
                onPress={handleClearAmount} 
              >
                <Ionicons name="close-circle" size={18} color="#A3A3A3" />
              </TouchableOpacity>
            </View>

            {/* Amount Validation Error Message */}
            {amountValidationError ? (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={{ 
                  color: '#EF4444', 
                  fontSize: 12, 
                  fontFamily: 'dmsansRegular',
                  marginLeft: 4
                }}>
                  {amountValidationError}
                </Text>
              </View>
            ) : null}

            {/* Minimum Amount Info */}
            {!amountValidationError && !hasCustomAmount && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ 
                  color: '#6B7280', 
                  fontSize: 12, 
                  fontFamily: 'dmsansRegular'
                }}>
                  Minimum custom amount: {MINIMUM_CUSTOM_AMOUNT} AFN
                </Text>
              </View>
            )}

            {hasCustomAmount && !amountValidationError && (
              <View style={{ marginTop: 24 }}>
                <PrimaryButton
                  label={t('continue')}
                  onPress={handleCustomAmountContinue}
                />
              </View>
            )}

            {showPopularAmounts && (
              <View style={TopUpStyles.quickAmountsContainer}>
                <Text style={TopUpStyles.quickAmountsTitle}>{t('popularAmounts')}</Text>
                
                {loadingRechargeProducts ? (
                  <SkeletonLoader type="amount" />
                ) : (
                  <View style={TopUpStyles.quickAmountsList}>
                    {rechargeAmounts.map((amount, index) => {
                      const isSelected = selectedPopularAmount?.id === amount.id;
                      
                      return (
                        <AnimatedAmountItem
                          key={amount.id}
                          amount={amount}
                          isSelected={isSelected}
                          onPress={handlePopularAmountSelect}
                          index={index}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <BundleProductSelection
            country={country}
            localNumber={localNumber}
            product={product}
            setProduct={setProduct}
            onContinue={handleBundleContinue}
            onActivateBundle={onBundleActivated}
          />
        )}
      </ScrollView>
    </View>
  );
}

export default StepAmount;