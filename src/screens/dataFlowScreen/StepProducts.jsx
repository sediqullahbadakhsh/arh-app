import React from "react";
import { 
  Image, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  FlatList, 
  TextInput,
  StyleSheet 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

const OPERATOR_NAMES = {
  '70': 'AWCC',
  '71': 'AWCC',
  '72': 'MTN',
  '73': 'Etisalat',
  '74': 'Salaam',
  '76': 'Roshan',
  '77': 'Roshan',
  '78': 'Etisalat',
  '79': 'Salaam',
  'default': 'All Operators'
};

const OPERATOR_LOGOS = {
  '70': require('../../../assets/mnos/awcc.png'),
  '71': require('../../../assets/mnos/awcc.png'),
  '72': require('../../../assets/mnos/mtn.png'),
  '73': require('../../../assets/mnos/etisalat.png'),
  '74': require('../../../assets/mnos/salaam.png'),
  '76': require('../../../assets/mnos/roshan.png'),
  '77': require('../../../assets/mnos/roshan.png'),
  '78': require('../../../assets/mnos/etisalat.png'),
  '79': require('../../../assets/mnos/salaam.png'),
  'default': require('../../../assets/mnos/awcc.png'),
};

const getOperatorFromPrefix = (prefix) => {
  return OPERATOR_NAMES[prefix] || OPERATOR_NAMES.default;
};

const getOperatorLogoFromPrefix = (prefix) => {
  return OPERATOR_LOGOS[prefix] || OPERATOR_LOGOS.default;
};

function StepProducts({
  country,
  bundleCategories,
  selectedCategory,
  setSelectedCategory,
  bundleTypes,
  selectedType,
  setSelectedType,
  search,
  setSearch,
  products,
  product,
  setProduct,
  onEditNumber,
  summary,
  isLoading = false,
  isLoadingProducts = false,
  mobilePrefix = null,
}) {
  const { t } = useTranslation();
  const operatorLogo = getOperatorLogoFromPrefix(getSetaraganMnoId(summary.localNumber));

  const CategorySkeleton = () => (
    <View style={styles.categoriesContainer}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.categoryChipSkeleton}>
          <View style={styles.skeletonLine} />
        </View>
      ))}
    </View>
  );

  const ProductCardSkeleton = () => (
    <View style={styles.cardSkeletonContainer}>
      <View style={styles.cardSkeleton}>
        <View style={styles.cardSkeletonHeader}>
          <View style={styles.cardSkeletonImage} />
          <View style={styles.cardSkeletonContent}>
            <View style={[styles.skeletonLine, { width: '70%', height: scale.hp(2) }]} />
            <View style={[styles.skeletonLine, { width: '50%', height: scale.hp(1.7), marginTop: scale.hp(0.8) }]} />
          </View>
        </View>
        <View style={styles.cardSkeletonFooter}>
          <View style={[styles.skeletonLine, { width: '40%', height: scale.hp(1.7) }]} />
          <View style={styles.skeletonPrice} />
        </View>
      </View>
    </View>
  );

  const handleProductSelect = (item) => {
    if (product && product.id === item.id) {
      setProduct(null);
    } else {
      setProduct(item);
    }
  };

  const renderItem = ({ item }) => {
    const active = product?.id === item.id;
    let IMAGE_URL = null;
    if (item.image) {
      if (item.image.startsWith('http')) {
        IMAGE_URL = item.image;
      } else {
        const encodedImage = encodeURIComponent(item.image);
        IMAGE_URL = `http://3.67.144.22/backend/uploads/product_images/${encodedImage}`;
      }
    }

    const operatorName = item.prefix 
      ? getOperatorFromPrefix(item.prefix.toString())
      : OPERATOR_NAMES.default;
    
    const operatorLogo = item.prefix 
      ? getOperatorLogoFromPrefix(item.prefix.toString())
      : null;

    const hasDiscount = item.originalPrice && item.totalAmountInUSD;
    const discountPercentage = hasDiscount 
      ? Math.round(((item.originalPrice - item.totalAmountInUSD) / item.originalPrice) * 100)
      : 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          active && styles.productCardActive,
          item.isPopular && styles.popularCard
        ]}
        onPress={() => handleProductSelect(item)}
        activeOpacity={0.7}
      >
        {item.isPopular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={scale.hp(1.5)} color="#FFD700" />
            <Text style={styles.popularBadgeText}>{t('popular')}</Text>
          </View>
        )}

        {hasDiscount && discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.logoContainer}>
            {IMAGE_URL ? (
              <Image 
                source={{ uri: IMAGE_URL }} 
                style={styles.operatorLogo}
                resizeMode="contain"
              />
            ) : operatorLogo ? (
              <Image 
                source={operatorLogo} 
                style={styles.operatorLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoColorBackground}>
                <Ionicons name="cube-outline" size={scale.hp(3.5)} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.productDetails}>
            <Text style={[styles.productName, active && styles.productNameActive]}>
              {item.productName?.en || item.productName}
            </Text>
  
            {/* <View style={styles.operatorInfoContainer}>
              <View style={styles.operatorTag}>
                <Ionicons name="phone-portrait-outline" size={scale.hp(1.5)} color="#CD0202" />
                <Text style={styles.operatorTagText}>
                  {operatorName} {item.prefix ? `(0${item.prefix})` : ''}
                </Text>
              </View>
            </View> */}

            {item.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {(item.dataAmount || item.validity) && (
              <View style={styles.featuresContainer}>
                {item.dataAmount && (
                  <View style={styles.featureTag}>
                    <Ionicons name="wifi-outline" size={scale.hp(1.7)} color="#CD0202" />
                    <Text style={styles.featureText}>{item.dataAmount}</Text>
                  </View>
                )}
                {item.validity && (
                  <View style={styles.featureTag}>
                    <Ionicons name="calendar-outline" size={scale.hp(1.7)} color="#CD0202" />
                    <Text style={styles.featureText}>{item.validity}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>
                    ${item.originalPrice}
                  </Text>
                )}
                <Text style={[styles.price, active && styles.priceActive]}>
                  ${item.totalAmountInUSD} {t('usd')}
                </Text>
                <Text style={styles.priceSubtext}>{t('oneTimePayment')}</Text>
              </View>
              
              <View style={styles.selectionIndicator}>
                {active ? (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={scale.hp(2.5)} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.unselectedIndicator}>
                    <Ionicons name="add-outline" size={scale.hp(2.5)} color="#CD0202" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedProduct = () => {
    const active = true;
    const item = product;
    let IMAGE_URL = null;
    if (item.image) {
      if (item.image.startsWith('http')) {
        IMAGE_URL = item.image;
      } else {
        const encodedImage = encodeURIComponent(item.image);
        IMAGE_URL = `http://3.67.144.22/backend/uploads/product_images/${encodedImage}`;
      }
    }

    const operatorName = item.prefix 
      ? getOperatorFromPrefix(item.prefix.toString())
      : OPERATOR_NAMES.default;
    
    const operatorLogo = item.prefix 
      ? getOperatorLogoFromPrefix(item.prefix.toString())
      : null;

    const hasDiscount = item.originalPrice && item.totalAmountInUSD;
    const discountPercentage = hasDiscount 
      ? Math.round(((item.originalPrice - item.totalAmountInUSD) / item.originalPrice) * 100)
      : 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          styles.productCardActive,
          item.isPopular && styles.popularCard
        ]}
        onPress={() => setProduct(null)}
        activeOpacity={0.7}
      >
        {item.isPopular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={scale.hp(1.5)} color="#FFD700" />
            <Text style={styles.popularBadgeText}>{t('popular')}</Text>
          </View>
        )}

        {hasDiscount && discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercentage}%</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.logoContainer}>
            {IMAGE_URL ? (
              <Image 
                source={{ uri: IMAGE_URL }} 
                style={styles.operatorLogo}
                resizeMode="contain"
              />
            ) : operatorLogo ? (
              <Image 
                source={operatorLogo} 
                style={styles.operatorLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoColorBackground}>
                <Ionicons name="cube-outline" size={scale.hp(3.5)} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.productDetails}>
            <Text style={[styles.productName, styles.productNameActive]}>
              {item.productName?.en || item.productName}
            </Text>
            

            {/* <View style={styles.operatorInfoContainer}>
              <View style={styles.operatorTag}>
                <Ionicons name="phone-portrait-outline" size={scale.hp(1.5)} color="#CD0202" />
                <Text style={styles.operatorTagText}>
                  {operatorName} {item.prefix ? `(0${item.prefix})` : ''}
                </Text>
              </View>
            </View> */}

            {item.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {(item.dataAmount || item.validity) && (
              <View style={styles.featuresContainer}>
                {item.dataAmount && (
                  <View style={styles.featureTag}>
                    <Ionicons name="wifi-outline" size={scale.hp(1.7)} color="#CD0202" />
                    <Text style={styles.featureText}>{item.dataAmount}</Text>
                  </View>
                )}
                {item.validity && (
                  <View style={styles.featureTag}>
                    <Ionicons name="calendar-outline" size={scale.hp(1.7)} color="#CD0202" />
                    <Text style={styles.featureText}>{item.validity}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>
                    ${item.originalPrice}
                  </Text>
                )}
                <Text style={[styles.price, styles.priceActive]}>
                  ${item.totalAmountInUSD} {t('usd')}
                </Text>
                <Text style={styles.priceSubtext}>{t('oneTimePayment')}</Text>
              </View>
              
              <View style={styles.selectionIndicator}>
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark" size={scale.hp(2.5)} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginTop: 0 }}>
      {isLoading ? (
        <CategorySkeleton />
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScroll}
        >
          <View style={styles.categoriesContainer}>
            {bundleCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory?.id === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory?.id === category.id && styles.categoryTextActive
                ]}>
                  {category.categoryName?.en || category.categoryName || t('unnamedCategory')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <Text style={styles.sectionLabel}>{t('bundleType')}</Text>
      
      {isLoading ? (
        <CategorySkeleton />
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScroll}
        >
          <View style={styles.categoriesContainer}>
            {bundleTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.categoryChip,
                  selectedType?.id === type.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedType?.id === type.id && styles.categoryTextActive
                ]}>
                  {type.typeName?.en || type.typeName || t('unnamedType')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={scale.hp(2.5)} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchBundles')}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={scale.hp(2.5)} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoadingProducts ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4].map((item) => (
            <ProductCardSkeleton key={item} />
          ))}
        </View>
      ) : (
        <>
          {!product ? (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              ListEmptyComponent={
                <View style={styles.emptyProducts}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="cube-outline" size={scale.hp(6)} color="#FFFFFF" />
                  </View>
                  <Text style={styles.emptyProductsTitle}>
                    {mobilePrefix 
                      ? t('noBundlesForPrefix', { prefix: mobilePrefix, operator: getOperatorFromPrefix(mobilePrefix) })
                      : t('noBundlesFound')
                    }
                  </Text>
                  <Text style={styles.emptyProductsText}>
                    {selectedCategory || selectedType 
                      ? t('tryDifferentFilters') 
                      : mobilePrefix
                        ? t('tryDifferentNumberPrefix')
                        : t('noBundlesAvailable')
                    }
                  </Text>
                  {(selectedCategory || selectedType || mobilePrefix) && (
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={() => {
                        setSelectedCategory(null);
                        setSelectedType(null);
                        setSearch('');
                      }}
                    >
                      <Text style={styles.clearFiltersText}>{t('clearAllFilters')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          ) : (
            <View style={styles.selectedProductContainer}>
              {renderSelectedProduct()}
            </View>
          )}
          
          {product && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="phone-portrait-outline" size={scale.hp(2.5)} color="#FFFFFF" />
                  </View>
                  <View style={styles.summaryTextContainer}>
                    <Text style={styles.summaryLabel}>{t('mobileNumber')}</Text>
                    <Text style={styles.summaryValue}>
                      {formatLocal(summary.localNumber)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onEditNumber}>
                    <Ionicons name="create-outline" size={scale.hp(2.5)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.summaryRow}>
                  <View style={styles.summaryIcon}>
                    <Ionicons name="cube-outline" size={scale.hp(2.5)} color="#FFFFFF" />
                  </View>
                  <View style={styles.summaryTextContainer}>
                    <Text style={styles.summaryLabel}>{t('selectedPlan')}</Text>
                    <Text style={styles.summaryValue}>
                      {product.productName?.en || product.productName}
                    </Text>
                  </View>
                </View>
                
                {/* {product.prefix && (
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryIcon}>
                      <Ionicons name="cellular-outline" size={scale.hp(2.5)} color="#FFFFFF" />
                    </View>
                    <View style={styles.summaryTextContainer}>
                      <Text style={styles.summaryLabel}>{t('operator')}</Text>
                      <Text style={styles.summaryValue}>
                        {getOperatorFromPrefix(product.prefix.toString())}
                      </Text>
                    </View>
                  </View>
                )} */}
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('totalAmount')}</Text>
                  <Text style={styles.totalAmount}>${product.totalAmountInUSD} {t('usd')}</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1),
  },
  categoriesScroll: {
    marginTop: scale.hp(1),
  },
  categoryChip: {
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(1.2),
    borderRadius: scale.hp(2.5),
    marginRight: scale.wp(2.5),
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#CD0202',
    borderColor: '#CD0202',
  },
  categoryText: {
    fontSize: scale.hp(1.7),
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryChipSkeleton: {
    paddingHorizontal: scale.wp(5),
    paddingVertical: scale.hp(1.2),
    borderRadius: scale.hp(2.5),
    marginRight: scale.wp(2.5),
    backgroundColor: '#f0f0f0',
    minWidth: scale.wp(20),
  },
  sectionLabel: {
    fontSize: scale.hp(2),
    fontWeight: '600',
    color: '#333',
    marginTop: scale.hp(2.5),
    marginBottom: scale.hp(1.5),
    marginLeft: scale.wp(4),
  },
  
  prefixIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: scale.wp(4),
    marginTop: scale.hp(1),
    marginBottom: scale.hp(1),
    padding: scale.wp(3),
    borderRadius: scale.hp(1.5),
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  prefixIconContainer: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale.wp(3),
  },
  prefixTextContainer: {
    flex: 1,
  },
  prefixLabel: {
    fontSize: scale.hp(1.5),
    color: '#1976D2',
    fontWeight: '500',
    marginBottom: scale.hp(0.5),
  },
  prefixValue: {
    fontSize: scale.hp(1.8),
    color: '#0D47A1',
    fontWeight: '600',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: scale.hp(2.5),
    marginHorizontal: scale.wp(4),
    marginVertical: scale.hp(2),
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1.5),
  },
  searchIcon: {
    marginRight: scale.wp(2.5),
  },
  searchInput: {
    flex: 1,
    fontSize: scale.hp(2),
    color: '#333',
  },
  
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2),
    marginHorizontal: scale.wp(4),
    marginVertical: scale.hp(1),
    padding: scale.wp(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale.hp(0.5),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(1.5),
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  productCardActive: {
    borderColor: '#CD0202',
    shadowColor: '#CD0202',
    shadowOpacity: 0.2,
    shadowRadius: scale.hp(2),
    elevation: 12,
  },
  popularCard: {
    borderLeftWidth: scale.wp(1),
    borderLeftColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: scale.hp(1.5),
    right: scale.wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: scale.wp(2.5),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.5),
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: scale.hp(1.5),
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: scale.wp(1),
  },
  discountBadge: {
    position: 'absolute',
    top: scale.hp(1.5),
    left: scale.wp(3),
    backgroundColor: '#FF4757',
    paddingHorizontal: scale.wp(2.5),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.hp(1.5),
    zIndex: 1,
  },
  discountBadgeText: {
    fontSize: scale.hp(1.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: scale.wp(2.5),
  },
  operatorLogo: {
    width: scale.wp(17),
    height: scale.wp(17),
    borderRadius: scale.hp(1.5),
  },
  logoColorBackground: {
    width: scale.wp(17),
    height: scale.wp(17),
    borderRadius: scale.hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CD0202',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: scale.hp(2.2),
    fontWeight: '600',
    color: '#333',
    marginBottom: scale.hp(0.8),
  },
  productNameActive: {
    color: '#CD0202',
  },
  
  operatorInfoContainer: {
    marginBottom: scale.hp(1),
  },
  operatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(205, 2, 2, 0.1)',
    paddingHorizontal: scale.wp(2.5),
    paddingVertical: scale.hp(0.6),
    borderRadius: scale.hp(1),
    alignSelf: 'flex-start',
  },
  operatorTagText: {
    fontSize: scale.hp(1.5),
    color: '#CD0202',
    fontWeight: '500',
    marginLeft: scale.wp(1),
  },
  
  productDescription: {
    fontSize: scale.hp(1.7),
    color: '#666',
    marginBottom: scale.hp(1.5),
    lineHeight: scale.hp(2.5),
  },
  featuresContainer: {
    flexDirection: 'row',
    marginBottom: scale.hp(2),
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(205, 2, 2, 0.1)',
    paddingHorizontal: scale.wp(2.5),
    paddingVertical: scale.hp(0.8),
    borderRadius: scale.hp(1.5),
    marginRight: scale.wp(2),
  },
  featureText: {
    fontSize: scale.hp(1.5),
    color: '#CD0202',
    fontWeight: '500',
    marginLeft: scale.wp(1),
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  originalPrice: {
    fontSize: scale.hp(1.7),
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: scale.hp(0.3),
  },
  price: {
    fontSize: scale.hp(2.8),
    fontWeight: '700',
    color: '#333',
  },
  priceActive: {
    color: '#CD0202',
  },
  priceSubtext: {
    fontSize: scale.hp(1.5),
    color: '#999',
    marginTop: scale.hp(0.3),
  },
  selectionIndicator: {
    marginLeft: scale.wp(4),
  },
  selectedIndicator: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CD0202',
  },
  unselectedIndicator: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    borderWidth: 2,
    borderColor: '#CD0202',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(205, 2, 2, 0.1)',
  },
  activeBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale.hp(0.4),
    backgroundColor: '#CD0202',
    borderBottomLeftRadius: scale.hp(2),
    borderBottomRightRadius: scale.hp(2),
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: scale.wp(4),
  },
  listContainer: {
    paddingVertical: scale.hp(1),
    paddingBottom: scale.hp(5),
  },
  
  selectedProductContainer: {
    marginTop: scale.hp(1),
  },
  
  skeletonList: {
    paddingHorizontal: scale.wp(4),
    paddingTop: scale.hp(1),
  },
  cardSkeletonContainer: {
    marginVertical: scale.hp(1),
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale.hp(2),
    padding: scale.wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale.hp(0.3) },
    shadowOpacity: 0.1,
    shadowRadius: scale.hp(1),
    elevation: 4,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(2),
  },
  cardSkeletonImage: {
    width: scale.wp(15),
    height: scale.wp(15),
    borderRadius: scale.hp(1.5),
    backgroundColor: '#f0f0f0',
    marginRight: scale.wp(4),
  },
  cardSkeletonContent: {
    flex: 1,
  },
  cardSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPrice: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: '#f0f0f0',
  },
  skeletonLine: {
    backgroundColor: '#f0f0f0',
    borderRadius: scale.hp(0.5),
  },
  
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale.hp(7.5),
    paddingHorizontal: scale.wp(8),
  },
  emptyIconContainer: {
    width: scale.wp(25),
    height: scale.wp(25),
    borderRadius: scale.wp(12.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale.hp(3),
    backgroundColor: '#CD0202',
  },
  emptyProductsTitle: {
    fontSize: scale.hp(2.5),
    fontWeight: '700',
    color: '#333',
    marginBottom: scale.hp(1),
  },
  emptyProductsText: {
    fontSize: scale.hp(2),
    color: '#666',
    textAlign: 'center',
    lineHeight: scale.hp(3),
    marginBottom: scale.hp(3),
  },
  clearFiltersButton: {
    backgroundColor: '#CD0202',
    paddingHorizontal: scale.wp(6),
    paddingVertical: scale.hp(1.5),
    borderRadius: scale.hp(2.5),
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: scale.hp(2),
    fontWeight: '600',
  },
  
  summaryCard: {
    backgroundColor: '#CD0202',
    borderRadius: scale.hp(2.5),
    marginHorizontal: scale.wp(4),
    marginTop: scale.hp(3),
    marginBottom: scale.hp(2),
    shadowColor: '#CD0202',
    shadowOffset: { width: 0, height: scale.hp(1) },
    shadowOpacity: 0.3,
    shadowRadius: scale.hp(2),
    elevation: 16,
  },
  summaryContent: {
    padding: scale.wp(6),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(2.5),
  },
  summaryIcon: {
    width: scale.wp(10),
    height: scale.wp(10),
    borderRadius: scale.wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: scale.wp(3),
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: scale.hp(1.7),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: scale.hp(0.5),
  },
  summaryValue: {
    fontSize: scale.hp(2.2),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scale.hp(2.5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLabel: {
    fontSize: scale.hp(2.2),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: scale.hp(3.2),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StepProducts;