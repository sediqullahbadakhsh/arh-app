import Animated from "react-native-reanimated";
import TopUpStyles from "./TopupStyle";
import React, { useState, useEffect } from "react";
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
  Modal,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../../components/PrimaryButton";
import { useTranslation } from "react-i18next";
import { getDataProducts, getProductsCustomer, getBundleCategories, getBundleTypes } from "../../services/merchantApi";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";
import { scale } from "../../utils/normalizeSize";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  // Skeleton Loader Styles
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

const OPERATOR_LOGOS = {
  'AWCC': require('../../../assets/mnos/awcc.png'),
  'Roshan': require('../../../assets/mnos/roshan.png'),
  'MTN': require('../../../assets/mnos/mtn.png'),
  'Salaam': require('../../../assets/mnos/salaam.png'),
  'Etisalat': require('../../../assets/mnos/etisalat.png'),
  'default': require('../../../assets/mnos/awcc.png'),
};

const getOperatorLogo = (operatorName) => {
  if (!operatorName || typeof operatorName !== 'string') {
    return OPERATOR_LOGOS.default;
  }
  
  try {
    const normalizedName = operatorName.toLowerCase();
    
    if (normalizedName.includes('awcc')) return OPERATOR_LOGOS.AWCC;
    if (normalizedName.includes('roshan')) return OPERATOR_LOGOS.Roshan;
    if (normalizedName.includes('mtn')) return OPERATOR_LOGOS.MTN;
    if (normalizedName.includes('salaam')) return OPERATOR_LOGOS.Salaam;
    if (normalizedName.includes('etisalat')) return OPERATOR_LOGOS.Etisalat;
    
    return OPERATOR_LOGOS.default;
  } catch (error) {
    return OPERATOR_LOGOS.default;
  }
};

const extractFeatures = (description) => {
  if (!description) return [];
  
  const features = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('gb') || desc.includes('gigabyte')) {
    const gbMatch = desc.match(/(\d+)\s*gb/);
    if (gbMatch) {
      features.push(`${gbMatch[1]} GB Data`);
    }
  }
  
  if (desc.includes('day') || desc.includes('validity')) {
    const dayMatch = desc.match(/(\d+)\s*day/);
    if (dayMatch) {
      features.push(`${dayMatch[1]} Days`);
    } else {
      features.push('30 Days');
    }
  }
  
  if (desc.includes('4g') || desc.includes('lte')) {
    features.push('4G LTE');
  } else if (desc.includes('3g')) {
    features.push('3G');
  }
  
  if (desc.includes('high speed') || desc.includes('fast')) {
    features.push('High Speed');
  }
  
  if (features.length === 0) {
    features.push('Internet Bundle', 'Mobile Data');
  }
  
  return features.slice(0, 3); 
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
          defaultSource={OPERATOR_LOGOS.default}
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
    const features = extractFeatures(item.description);

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
  onBundleActivated
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [rechargeProducts, setRechargeProducts] = useState([]);
  const [loadingRechargeProducts, setLoadingRechargeProducts] = useState(false);
  const [customProduct, setCustomProduct] = useState(null);
  const [selectedPopularAmount, setSelectedPopularAmount] = useState(null);
  const [localCustomAfn, setLocalCustomAfn] = useState(customAfn || "");

  useEffect(() => {
    setLocalCustomAfn(customAfn || "");
  }, [customAfn]);

  useEffect(() => {
    if (localCustomAfn && localCustomAfn.trim() !== "" && product && !product.custom) {
      setProduct(null);
      setSelectedPopularAmount(null);
    }
  }, [localCustomAfn]);

  const calculateTotalAmount = (baseAmount, productItem = null) => {
    const amount = parseFloat(baseAmount) || 0;
    const targetProduct = productItem || product || customProduct;
    
    if (!targetProduct) {
      return amount; 
    }

    let totalAmount = amount;
    
    if (targetProduct.slabDetails?.percentage) {
      totalAmount += amount * (targetProduct.slabDetails.percentage / 100);
    }
    
    if (targetProduct.serviceSlabDetails?.percentage) {
      totalAmount += amount * (targetProduct.serviceSlabDetails.percentage / 100);
    }
    
    return totalAmount;
  };

  const calculateUsdFromTotalAfn = (totalAfn) => {
    if (!exchangeRate) return 0;
    const usdAmount = totalAfn * exchangeRate;
    return parseFloat(usdAmount.toFixed(2));
  };

  useEffect(() => {
    const fetchRechargeProducts = async () => {
      if (!country?.id) return;
      
      try {
        setLoadingRechargeProducts(true);
        
        const filter = { 
          countryId: country.id,
        };
        
        const res = await getProductsCustomer(filter);
        
        if (res?.data) {
          const rechargeProds = res.data.filter(product => {
            const isDataBundle = 
              product.productName?.toLowerCase().includes('data') ||
              product.productName?.toLowerCase().includes('bundle') ||
              (product.productTypeDetails?.productType?.en?.toLowerCase().includes('data') ||
               product.productTypeDetails?.productType?.en?.toLowerCase().includes('bundle'));
               
            return !isDataBundle && parseFloat(product.price) > 0;
          });
          
          console.log(`Loaded ${rechargeProds.length} recharge products`);
          setRechargeProducts(rechargeProds);

          const customTopupProduct = res.data.find(p => 
            (p.productName?.toLowerCase().includes('custom') || 
             p.productName?.toLowerCase().includes('topup')) && 
            parseFloat(p.price) === 0
          );
          
          if (customTopupProduct) {
            setCustomProduct(customTopupProduct);
          }
        }
      } catch (error) {
        console.error("Error fetching recharge products:", error);
      } finally {
        setLoadingRechargeProducts(false);
      }
    };

    if (serviceType === 'recharge' && country?.id) {
      fetchRechargeProducts();
    }
  }, [country, serviceType]);

  const rechargeAmounts = React.useMemo(() => {
    if (rechargeProducts.length > 0) {
      return rechargeProducts
        .filter(product => parseFloat(product.price) > 0)
        .map(product => {
          const basePrice = parseFloat(product.price);
          const totalAfn = calculateTotalAmount(basePrice, product);
          const totalUsd = calculateUsdFromTotalAfn(totalAfn);
          
          return {
            id: product.id,
            afn: basePrice,
            totalAfn: totalAfn,
            usd: totalUsd,
            productName: product.productName,
            product: product,
            slabPercentage: product.slabDetails?.percentage || 0,
            serviceSlabPercentage: product.serviceSlabDetails?.percentage || 0
          };
        })
        .sort((a, b) => a.afn - b.afn);
    }
    
    const defaultAmounts = [50, 100, 150, 250, 500, 1000];
    return defaultAmounts.map(amount => ({
      id: amount.toString(),
      afn: amount,
      totalAfn: amount,
      usd: calculateUsdAmount(amount),
      productName: `${amount} AFN Topup`,
      product: null,
      slabPercentage: 0,
      serviceSlabPercentage: 0
    }));
  }, [rechargeProducts, calculateTotalAmount, calculateUsdFromTotalAfn, calculateUsdAmount]);

  const customAmountTotal = React.useMemo(() => {
    if (!localCustomAfn || localCustomAfn.trim() === "") return 0;
    
    const baseAmount = parseFloat(localCustomAfn);
    if (isNaN(baseAmount)) return 0;
    
    return calculateTotalAmount(baseAmount, customProduct);
  }, [localCustomAfn, customProduct]);

  const hasCustomAmount = localCustomAfn && localCustomAfn.trim() !== "" && !isNaN(parseFloat(localCustomAfn));

  const handleClearAmount = () => {
    setLocalCustomAfn("");
    setCustomAfn(""); 
    setProduct(null);
    setSelectedPopularAmount(null);
  };

  const handleCustomAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setLocalCustomAfn(cleanedText);
    setCustomAfn(cleanedText);
    setSelectedPopularAmount(null);
    
    if (cleanedText && customProduct) {
      console.log("Setting custom product for amount:", cleanedText);
      setProduct({
        ...customProduct,
        customAmount: parseFloat(cleanedText) || 0
      });
    }
  };

  const handlePopularAmountSelect = (amount) => {
    console.log("Selected popular amount:", amount);
    
    setLocalCustomAfn("");
    setCustomAfn("");
    
    if (amount.product) {
      setProduct(amount.product);
    }
    setSelectedPopularAmount(amount);
    
    onSelectPopularAmount(amount);
  };

  const handleCustomAmountContinue = () => {
    if (hasCustomAmount && customProduct) {
      console.log("Continuing with custom amount:", {
        customAfn: localCustomAfn,
        customProduct: customProduct,
        totalAfn: customAmountTotal,
        usd: calculateUsdFromTotalAfn(customAmountTotal)
      });

      const customProductWithAmount = {
        ...customProduct,
        customAmount: parseFloat(localCustomAfn) || 0,
        price: localCustomAfn 
      };
      
      setProduct(customProductWithAmount);
      
      onContinue();
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
      onContinue();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* <View style={TopUpStyles.serviceTypeToggle}>
        <TouchableOpacity
          style={[
            TopUpStyles.toggleOption,
            serviceType === 'recharge' && TopUpStyles.toggleOptionActive
          ]}
          onPress={() => setServiceType('recharge')}
        >
          <Text style={[
            TopUpStyles.toggleText,
            serviceType === 'recharge' && TopUpStyles.toggleTextActive
          ]}>
            {t('recharge')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            TopUpStyles.toggleOption,
            serviceType === 'bundle' && TopUpStyles.toggleOptionActive
          ]}
          onPress={() => setServiceType('bundle')}
        >
          <Text style={[
            TopUpStyles.toggleText,
            serviceType === 'bundle' && TopUpStyles.toggleTextActive
          ]}>
            {t('bundle')}
          </Text>
        </TouchableOpacity>
      </View> */}

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
                borderColor: isFocused ? Colors.primary : '#2e2e2eff',
                backgroundColor: '#FFFFFF',
                shadowColor: Colors.primary,
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
              
              {hasCustomAmount && !loadingData && (
                <View style={TopUpStyles.usdEquivalentContainer}>
                  <Text style={[TopUpStyles.usdEquivalentText, { fontSize: 12, opacity: 0.7 }]}>
                    ≈ ${calculateUsdFromTotalAfn(customAmountTotal).toFixed(2)} USD
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

            {hasCustomAmount && (
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
                    {rechargeAmounts.map((amount) => {
                      const isSelected = selectedPopularAmount?.id === amount.id;
                      
                      return (
                        <TouchableOpacity
                          key={amount.id}
                          style={[
                            TopUpStyles.quickAmountItem,
                            isSelected && TopUpStyles.quickAmountItemSelected
                          ]}
                          onPress={() => handlePopularAmountSelect(amount)}
                        >
                          <View style={TopUpStyles.amountInfo}>
                            <Text style={[
                              TopUpStyles.amountValue,
                              isSelected && TopUpStyles.amountValueSelected
                            ]}>
                              {amount.afn} AFN
                            </Text>
                           
                            <Text style={[
                              TopUpStyles.amountSubtext,
                              isSelected && TopUpStyles.amountSubtextSelected
                            ]}>
                              ${amount.usd.toFixed(2)} USD
                            </Text>
                          </View>
                        </TouchableOpacity>
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