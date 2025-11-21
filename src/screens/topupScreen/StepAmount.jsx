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
import { getProductCategories, getDataProductsCustomer, activateDataBundleCustomer } from "../../services/merchantApi";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";
import { scale } from "../../utils/normalizeSize";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    paddingHorizontal: 4,
  },
  categoryChip: {
    paddingHorizontal: 24,
    paddingVertical: 14,
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
};

const ModalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary + '15',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  
  return features.slice(0, 3); // Limit to 3 features
};

function ComingSoonModal({ visible, onClose, selectedProduct, localNumber }) {
  const features = [
    "Instant bundle activation",
    "Real-time data allocation",
    "Automatic balance update",
    "Seamless network integration"
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true} 
    >
      <View style={ModalStyles.overlay}>
        <View style={ModalStyles.modalContainer}>
          <View style={ModalStyles.modalHeader}>
            <View style={ModalStyles.iconContainer}>
              <Ionicons name="time-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={ModalStyles.modalTitle}>Coming Soon!</Text>
            <Text style={ModalStyles.modalSubtitle}>
              Bundle activation feature will be available soon
            </Text>
          </View>
          
          <View style={ModalStyles.modalContent}>
            <View style={ModalStyles.featureList}>
              {features.map((feature, index) => (
                <View key={index} style={ModalStyles.featureItem}>
                  <View style={ModalStyles.featureIcon}>
                    <Ionicons name="checkmark" size={14} color={Colors.primary} />
                  </View>
                  <Text style={ModalStyles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <View style={ModalStyles.modalActions}>
              <TouchableOpacity 
                style={ModalStyles.secondaryButton}
                onPress={onClose}
              >
                <Text style={ModalStyles.secondaryButtonText}>Got It</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={ModalStyles.primaryButton}
                onPress={onClose}
              >
                <Text style={ModalStyles.primaryButtonText}>Notify Me</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BundleProductSelection({
  country,
  localNumber,
  product,
  setProduct,
  onContinue,
  onActivateBundle
}) {
  const [productTypes, setProductTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [productType, setProductType] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState(null);

useEffect(() => {
  const fetchProductTypes = async () => {
    try {
      console.log("Fetching product types...");
      const allProductsRes = await getDataProductsCustomer({
        countryId: country?.id
      });
      
      if (allProductsRes?.data) {
        const uniqueProductTypes = [];
        const seenTypes = new Set();
        
        allProductsRes.data.forEach(product => {
          // STRICTER BUNDLE FILTERING - Only show actual bundles
          const isDataBundle = 
            product.productName?.toLowerCase().includes('data') ||
            product.productName?.toLowerCase().includes('bundle') ||
            product.description?.toLowerCase().includes('data') ||
            product.description?.toLowerCase().includes('bundle') ||
            (product.productTypeDetails?.productType?.en?.toLowerCase().includes('data') ||
             product.productTypeDetails?.productType?.en?.toLowerCase().includes('bundle')) ||
            // Add more specific bundle indicators
            product.productCategory?.toLowerCase().includes('data') ||
            product.productCategory?.toLowerCase().includes('bundle');
          
          // EXCLUDE RECHARGE PRODUCTS
          const isRecharge = 
            product.productName?.toLowerCase().includes('topup') ||
            product.productName?.toLowerCase().includes('recharge') ||
            product.productName?.toLowerCase().includes('credit') ||
            product.description?.toLowerCase().includes('topup') ||
            product.description?.toLowerCase().includes('recharge') ||
            product.description?.toLowerCase().includes('credit');
          
          if (isDataBundle && !isRecharge && product.productTypeDetails && product.productTypeDetails.id && !seenTypes.has(product.productTypeDetails.id)) {
            seenTypes.add(product.productTypeDetails.id);
            uniqueProductTypes.push({
              id: product.productTypeDetails.id,
              productType: product.productTypeDetails.productType || "Data Bundle",
              description: product.productTypeDetails.description || ""
            });
          }
        });
        
        setProductTypes(uniqueProductTypes);
        
        if (uniqueProductTypes.length > 0) {
          setProductType(uniqueProductTypes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      Alert.alert("Error", "Failed to load product types");
    }
  };

  if (country?.id) {
    fetchProductTypes();
  }
}, [country]);

useEffect(() => {
  const getProducts = async () => {
    if (!country?.id) return;
    
    try {
      setLoading(true);
      const filter = {
        countryId: country.id
      };
      
      const res = await getDataProductsCustomer(filter);
      
      // FILTER ONLY BUNDLE PRODUCTS
      let filteredProducts = (res?.data || []).filter(product => {
        const isDataBundle = 
          product.productName?.toLowerCase().includes('data') ||
          product.productName?.toLowerCase().includes('bundle') ||
          product.description?.toLowerCase().includes('data') ||
          product.description?.toLowerCase().includes('bundle') ||
          (product.productTypeDetails?.productType?.en?.toLowerCase().includes('data') ||
           product.productTypeDetails?.productType?.en?.toLowerCase().includes('bundle'));
        
        const isRecharge = 
          product.productName?.toLowerCase().includes('topup') ||
          product.productName?.toLowerCase().includes('recharge') ||
          product.productName?.toLowerCase().includes('credit');
        
        return isDataBundle && !isRecharge;
      });
      
      // Additional filtering by product type
      if (productType?.id) {
        filteredProducts = filteredProducts.filter(product => 
          product.productTypeId === productType.id
        );
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  getProducts();
}, [country, productType]);

  const filteredProducts = products.filter((p) =>
    !search.trim() || 
    p.productName?.toLowerCase().includes(search.trim().toLowerCase()) ||
    p.description?.toLowerCase().includes(search.trim().toLowerCase()) ||
    p.price?.toString().includes(search.trim())
  );

  const getProductTypeName = (typeItem) => {
    if (!typeItem) return "";
    
    if (typeof typeItem.productType === 'string') {
      return typeItem.productType;
    } else if (typeItem.productType?.en) {
      return typeItem.productType.en;
    } else if (typeItem.productType) {
      const firstKey = Object.keys(typeItem.productType)[0];
      return typeItem.productType[firstKey];
    }
    
    return typeItem.name || "Unknown Type";
  };

  const operatorLogo = React.useMemo(() => {
    try {
      const operatorId = getSetaraganMnoId(localNumber);
      return getOperatorLogo(operatorId);
    } catch (error) {
      return OPERATOR_LOGOS.default;
    }
  }, [localNumber]);

  const handleProductSelect = async (selectedProduct) => {
    if (activating) return;
    
    setProduct(selectedProduct);
    setSelectedProductInfo({
      productName: selectedProduct.productName,
      localNumber: localNumber
    });

    setActivating(true);
    setTimeout(() => {
      setShowComingSoon(true);
      setActivating(false);
    }, 500);
  };

  const handleCloseComingSoon = () => {
    setShowComingSoon(false);
    setProduct(null);
    setSelectedProductInfo(null);
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
              {item.productName}
            </Text>
            <Text style={[ProductStyles.bundleDesc, active && { color: Colors.primary }]}>
              {item.description || "High-speed internet data bundle"}
            </Text>
            
            {features.length > 0 && (
              <View style={ProductStyles.bundleFeatures}>
                {features.map((feature, index) => (
                  <View key={index} style={ProductStyles.featureTag}>
                    <Text style={ProductStyles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        
        <View style={ProductStyles.bundleFooter}>
          <View>
            <Text style={[ProductStyles.bundlePrice, active && { color: Colors.primary }]}>
              {item.price} AFN
            </Text>
            <Text style={ProductStyles.bundleDuration}>
              {item.description?.toLowerCase().includes('day') ? 'Validity period' : '30 Days'}
            </Text>
          </View>
          
          {active ? (
            <View style={ProductStyles.selectedBadge}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
              <Text style={ProductStyles.selectedBadgeText}>Selected</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ComingSoonModal
        visible={showComingSoon}
        onClose={handleCloseComingSoon}
        selectedProduct={selectedProductInfo}
        localNumber={localNumber}
      />

      {productTypes.length > 0 && (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={ProductStyles.categoriesScroll}
          >
            <View style={ProductStyles.categoriesContainer}>
              {productTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    ProductStyles.categoryChip, 
                    productType?.id === type.id && ProductStyles.categoryChipActive
                  ]}
                  onPress={() => setProductType(type)}
                  disabled={activating}
                >
                  <Text style={[
                    ProductStyles.categoryText, 
                    productType?.id === type.id && ProductStyles.categoryTextActive
                  ]}>
                    {getProductTypeName(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {loading ? (
        <View style={ProductStyles.loadingContainer}>
          <Ionicons name="refresh" size={32} color={Colors.primary} />
          <Text style={ProductStyles.loadingText}>Loading available bundles...</Text>
        </View>
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
                {search ? "No bundles found for your search" : "No bundles available for this category"}
              </Text>
              <Text style={[ProductStyles.emptyProductsText, { fontSize: 14, marginTop: 8 }]}>
                Try selecting a different category or search term
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const forceRefreshProducts = () => {
    console.log("🔄 Manual refresh triggered");
    setRefreshKey(prev => prev + 1);
    setLastRefresh(Date.now());
  };

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
        console.log(`🔄 Fetching fresh recharge products (refresh #${refreshKey})`);
        
        const filter = { 
          countryId: country.id,
          forceRefresh: refreshKey
        };
        
        const res = await getDataProductsCustomer(filter, { force: true });
        
        if (res?.data) {
          const rechargeProds = res.data.filter(product => {
            const isDataBundle = 
              product.productName?.toLowerCase().includes('data') ||
              product.productName?.toLowerCase().includes('bundle') ||
              (product.productTypeDetails?.productType?.en?.toLowerCase().includes('data') ||
               product.productTypeDetails?.productType?.en?.toLowerCase().includes('bundle'));
               
            return !isDataBundle && parseFloat(product.price) > 0;
          });
          
          console.log(`✅ Loaded ${rechargeProds.length} recharge products`);
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
        console.error("❌ Error fetching recharge products:", error);
      } finally {
        setLoadingRechargeProducts(false);
      }
    };

    if (serviceType === 'recharge' && country?.id) {
      fetchRechargeProducts();
    }
  }, [country, serviceType, refreshKey]);

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

  const handleBundleActivated = () => {
    setProduct(null);
    if (onBundleActivated) {
      onBundleActivated();
    }
  };

  const getSlabBreakdown = (productItem = null) => {
    const targetProduct = productItem || product;
    if (!targetProduct) return null;

    const slabPercent = targetProduct.slabDetails?.percentage || 0;
    const servicePercent = targetProduct.serviceSlabDetails?.percentage || 0;
    
    if (slabPercent === 0 && servicePercent === 0) return null;

    return { slabPercent, servicePercent };
  };

  const renderSlabInfo = (productItem = null) => {
    const breakdown = getSlabBreakdown(productItem);
    if (!breakdown) return null;

    const { slabPercent, servicePercent } = breakdown;
    
    return (
      <View style={AdditionalStyles.slabInfoContainer}>
        {slabPercent > 0 && (
          <Text style={AdditionalStyles.slabInfoText}>
            Revenue Slab: +{slabPercent}%
          </Text>
        )}
        {servicePercent > 0 && (
          <Text style={AdditionalStyles.slabInfoText}>
            Service Slab: +{servicePercent}%
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={TopUpStyles.serviceTypeToggle}>
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
      </View>


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

            {/* {hasCustomAmount && customProduct && renderSlabInfo(customProduct)} */}

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
                  <View style={ProductStyles.emptyProducts}>
                    <Ionicons name="refresh" size={32} color="#999" />
                    <Text style={ProductStyles.emptyProductsText}>Loading amounts...</Text>
                  </View>
                ) : (
                  <View style={TopUpStyles.quickAmountsList}>
                    {rechargeAmounts.map((amount) => {
                      const isSelected = selectedPopularAmount?.id === amount.id;
                      const hasSlabs = amount.slabPercentage > 0 || amount.serviceSlabPercentage > 0;
                      const showTotalAmount = amount.totalAfn > amount.afn;
                      
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
            onContinue={onContinue}
            onActivateBundle={handleBundleActivated}
          />
        )}
      </ScrollView>
    </View>
  );
}

const AdditionalStyles = {
  slabInfoContainer: {
    marginTop: scale.hp(1),
    padding: scale.hp(1),
    backgroundColor: '#f8f9fa',
    borderRadius: scale.hp(1),
    borderLeftWidth: scale.wp(0.75),
    borderLeftColor: Colors.primary,
  },
  slabInfoText: {
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    marginBottom: scale.hp(0.25),
  },
  amountTotal: {
    fontSize: scale.hp(1.4),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amountTotalSelected: {
    color: Colors.white,
  },
  slabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: scale.wp(2),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.5),
    marginTop: scale.hp(0.5),
  },
  slabBadgeSelected: {
    backgroundColor: Colors.primary + '40',
  },
  slabBadgeText: {
    fontSize: scale.hp(1.25),
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: scale.wp(0.5),
  },
  slabBadgeTextSelected: {
    color: Colors.white,
  },

};

export default StepAmount;