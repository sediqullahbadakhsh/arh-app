import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import ServiceHeader from "../../components/ServiceHeader";
import { useTranslation } from "react-i18next";
import { 
  getAllSocialCategories,
  getAllSocailProductsForUser,
} from "../../services/merchantApi";
import { scale } from "../../utils/normalizeSize";
import { useQuery } from "@tanstack/react-query"; 

// Skeleton Components
const SkeletonRect = ({ width, height, borderRadius = 4, style = {} }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

const SkeletonCircle = ({ size }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [animation]);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E1E9EE',
        opacity,
      }}
    />
  );
};

// Skeleton Screen Component
const SocialSkeletonScreen = () => {
  const CARD_WIDTH = (Dimensions.get('window').width - (scale.wp(5) * 2) - scale.wp(2)) / 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonRect width={scale.wp(30)} height={scale.hp(3)} />
        <SkeletonCircle size={scale.wp(8)} />
      </View>

      {/* Search Bar Skeleton */}
      <View style={[styles.searchContainer, { backgroundColor: '#f0f0f0' }]}>
        <SkeletonCircle size={scale.wp(5)} />
        <SkeletonRect width="70%" height={scale.hp(2)} style={{ marginLeft: scale.wp(2) }} />
        <SkeletonCircle size={scale.wp(5)} />
      </View>

      {/* Categories Skeleton */}
      <View style={styles.categoriesSkeleton}>
        <View style={styles.categoriesRow}>
          {[1, 2, 3, 4].map((item) => (
            <SkeletonRect 
              key={`category-${item}`}
              width={scale.wp(25)}
              height={scale.hp(3.5)}
              borderRadius={scale.wp(10)}
              style={{ marginRight: scale.wp(2) }}
            />
          ))}
        </View>
      </View>

      {/* Product Grid Skeleton */}
      <FlatList
        data={[1, 2, 3, 4]}
        renderItem={({ item }) => (
          <View style={styles.rowContainer}>
            {[1, 2].map((subItem) => (
              <View key={`product-${item}-${subItem}`} style={styles.productContainer}>
                <View style={styles.productCardSkeleton}>
                  <SkeletonRect 
                    width="100%" 
                    height={scale.wp(30)} 
                    borderRadius={scale.wp(2)}
                    style={{ marginBottom: scale.hp(1) }}
                  />
                  <SkeletonRect width="80%" height={scale.hp(1.8)} />
                  <SkeletonRect 
                    width="60%" 
                    height={scale.hp(1.8)} 
                    style={{ marginTop: scale.hp(0.5) }}
                  />
                  <SkeletonRect 
                    width="100%" 
                    height={scale.hp(3.5)} 
                    borderRadius={scale.wp(2)}
                    style={{ marginTop: scale.hp(1) }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => `row-${item}`}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const chunkArray = (array, chunkSize) => {
  const results = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (scale.wp(5) * 2) - scale.wp(2)) / 2;
const ITEMS_PER_PAGE = 10;

export default function SocialMerchantScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { customer } = route?.params || {};
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [chunkedProducts, setChunkedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  
  const [apiFilters, setApiFilters] = useState({
    search: '',
    productCategoryId: null,
  });

  const flatListRef = useRef(null);
  const isMountedRef = useRef(true);
  const isLoadingMoreRef = useRef(false);

  const { 
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['socialCategories'],
    queryFn: getAllSocialCategories,
  });

  const { 
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['socialProducts', apiFilters, page],
    queryFn: () => getAllSocailProductsForUser({
      ...apiFilters,
      page: page,
      limit: ITEMS_PER_PAGE,
    }),
    keepPreviousData: true,
    onSuccess: (data) => {
      console.log("Products Query Success:", {
        page: page,
        meta: data?.meta,
        dataLength: data?.data?.length || 0,
        hasMore: data?.meta ? page < data.meta.pages : false
      });
    },
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      Alert.alert(t("error"), t("failedToLoadCategories"));
    }

    if (productsError) {
      console.error("Error fetching products:", productsError);
      Alert.alert(t("error"), t("failedToLoadProducts"));
    }
  }, [categoriesError, productsError]);

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData?.data || []);
    }
  }, [categoriesData]);

  useEffect(() => {
    if (productsData?.data && isMountedRef.current) {
      const newProducts = productsData.data;
      const meta = productsData.meta;
      
      console.log("Products Data Received:", {
        page: page,
        itemsCount: newProducts?.length || 0,
        meta: meta,
        currentPage: meta?.page || 1,
        totalPages: meta?.pages || 1,
        hasMore: meta ? page < meta.pages : false
      });
      
      if (page === 1) {
        setAllProducts(newProducts || []);
      } else {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = (newProducts || []).filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewProducts];
        });
      }
      
      if (meta) {
        setTotalPages(meta.pages || 1);
        setHasMore(page < meta.pages);
      } else {
        const hasMoreItems = (newProducts || []).length >= ITEMS_PER_PAGE;
        setHasMore(hasMoreItems);
      }
      
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [productsData, page]);

  useEffect(() => {
    setChunkedProducts(chunkArray(allProducts, 2));
    setLoading(categoriesLoading || (productsLoading && page === 1));
  }, [allProducts, categoriesLoading, productsLoading, page]);

  const updateApiFilters = useCallback((newFilters) => {
    console.log("Updating filters, resetting to page 1");
    setApiFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((searchText) => {
      updateApiFilters({ 
        search: searchText,
        productCategoryId: selectedCategory?.id || null,
      });
    }, 500),
    [selectedCategory, updateApiFilters]
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleCategorySelect = (category) => {
    const newCategory = selectedCategory?.id === category.id ? null : category;
    setSelectedCategory(newCategory);
    
    updateApiFilters({ 
      productCategoryId: newCategory?.id || null,
      search: searchQuery,
    });
  };

  const loadMoreProducts = useCallback(async () => {
    console.log("loadMoreProducts called:", {
      hasMore,
      loadingMore,
      isLoadingMoreRef: isLoadingMoreRef.current,
      productsLoading,
      page,
      totalPages
    });
    
    if (!hasMore || isLoadingMoreRef.current || loadingMore || productsLoading) {
      console.log("Skipping load more - condition not met");
      return;
    }
    
    console.log("Loading more products, incrementing page from", page, "to", page + 1);
    
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    
    const nextPage = page + 1;
    setPage(nextPage);
    
  }, [hasMore, loadingMore, productsLoading, page, totalPages]);

  const clearSearch = () => {
    setSearchQuery("");
    updateApiFilters({ 
      search: '',
      productCategoryId: selectedCategory?.id || null,
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    updateApiFilters({
      search: '',
      productCategoryId: null,
    });
  };

  const loadData = async () => {
    console.log("Manual refresh triggered");
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    await Promise.all([
      refetchCategories(),
      refetchProducts(),
    ]);
  };

  const onRefresh = async () => {
    console.log("Pull to refresh triggered");
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    await refetchProducts();
    setRefreshing(false);
  };

  const handleProductSelect = (product) => {
    navigation.navigate("SocialActivationMerchantScreen", { 
      product, 
      customer,
    });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory?.id === item.id && styles.selectedCategoryText
      ]}>
        {typeof item.category_name === 'object' 
          ? item.category_name.en || item.category_name[Object.keys(item.category_name)[0]]
          : item.category_name || item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = (item) => {
    let IMAGE_URL = null;
    if (item.image) {
      if (item.image.startsWith('http')) {
        IMAGE_URL = item.image;
      } else {
        const encodedImage = encodeURIComponent(item.image);
        IMAGE_URL = `http://3.67.144.22/backend/uploads/product_images/${encodedImage}`;
      }
    }
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductSelect(item)}
        activeOpacity={0.7}
      >
        {IMAGE_URL ? (
          <Image 
            source={{ uri: IMAGE_URL }} 
            style={styles.productImage}
            onError={(e) => {
              console.log('Image failed to load:', IMAGE_URL);
            }}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="chatbubble" size={65} color={Colors.primary} />
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || item.name}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice} numberOfLines={1}>
               {item.totalAmountInProductCurrency?.toFixed(2) || item.price?.toFixed(2) || "0.00"} 
            </Text>
          </View>
          
          <View style={styles.activateButton}>
            <Text style={styles.activateButtonText}>
              {t("activate")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRow = ({ item: row, index }) => {
    return (
      <View style={styles.rowContainer}>
        {row.map((product, idx) => (
          <View key={`product-${product.id}-${index}-${idx}`} style={[
            styles.productContainer,
            idx === 0 && styles.firstInRow,
            idx === 1 && styles.lastInRow
          ]}>
            {renderProductItem(product)}
          </View>
        ))}
        {row.length === 1 && (
          <View style={[styles.productContainer, styles.lastInRow, styles.emptyPlaceholder]} />
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.footerText}>
            {t("loadingMore") || "Loading more"}
          </Text>
        </View>
      );
    }
    
    if (hasMore && allProducts.length > 0 && !loadingMore) {
      return (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreProducts}
          disabled={loadingMore}
        >
          <Text style={styles.loadMoreButtonText}>
            {t("loadMore") || "Load More"}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  const renderEmptyState = () => {
    if (productsLoading && page === 1) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyStateTitle}>
          {apiFilters.search || apiFilters.productCategoryId 
            ? t("noSocialFound") || "No social product found"
            : t("noSocialAvailable") || "No social product available"}
        </Text>
        <Text style={styles.emptyStateText}>
          {apiFilters.search 
            ? t("noResultsForSearch") || `No results for "${apiFilters.search}"`
            : apiFilters.productCategoryId
            ? t("noSocialInCategory") || "No social found in this category"
            : t("tryAgainLater") || "Please try again later"}
        </Text>
        
        {(apiFilters.search || apiFilters.productCategoryId) && (
          <TouchableOpacity
            style={[styles.refreshButton, styles.clearFilterButton]}
            onPress={clearAllFilters}
          >
            <Text style={styles.refreshButtonText}>
              {t("clearFilters") || "Clear Filters"}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
        >
          <Text style={styles.refreshButtonText}>{t("refresh") || "Refresh"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleEndReached = useCallback(() => {
    console.log("handleEndReached triggered");
    console.log("Current state:", {
      loadingMore,
      hasMore,
      productsLoading,
      page,
      totalPages,
      totalProducts: allProducts.length
    });
    
    if (!loadingMore && hasMore && !productsLoading) {
      console.log("Conditions met, calling loadMoreProducts");
      loadMoreProducts();
    } else {
      console.log("Conditions NOT met:", {
        loadingMore,
        hasMore,
        productsLoading
      });
    }
  }, [loadingMore, hasMore, productsLoading, loadMoreProducts, page, totalPages, allProducts.length]);

  const hasActiveFilters = apiFilters.search || apiFilters.productCategoryId;
  const isLoading = categoriesLoading || (productsLoading && page === 1);
  const totalProducts = allProducts.length;

  // Show skeleton loader while loading
  if (isLoading && page === 1) {
    return <SocialSkeletonScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t("social") || "Social"} 
        onBack={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("searchSocial") || "Search social..."}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => `category-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            {t("activeFilters") || "Active Filters"}:
          </Text>
          {apiFilters.search && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Search: "{apiFilters.search}"
              </Text>
              <TouchableOpacity onPress={() => handleSearchChange("")}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {apiFilters.productCategoryId && selectedCategory && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Category: {typeof selectedCategory.category_name === 'object' 
                  ? selectedCategory.category_name.en 
                  : selectedCategory.category_name}
              </Text>
              <TouchableOpacity onPress={() => handleCategorySelect(selectedCategory)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearAllButtonText}>
              {t("clearAll") || "Clear All"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {productsLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t("loadingSocial") || "Loading social products..."}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chunkedProducts}
          renderItem={renderRow}
          keyExtractor={(item, index) => `row-${index}-${page}`}
          contentContainerStyle={[
            styles.productsList,
            chunkedProducts.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    marginBottom: 100,
  },
  // Skeleton Styles
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(2),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoriesSkeleton: {
    marginHorizontal: scale.wp(4),
    marginTop: scale.hp(1),
    marginBottom: scale.hp(2),
  },
  categoriesRow: {
    flexDirection: 'row',
  },
  productCardSkeleton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: scale.wp(3),
    padding: scale.wp(2.5),
    shadowColor: "#5cbb74ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minHeight: scale.hp(25),
  },
  // Original Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: scale.wp(4),
    paddingHorizontal: scale.wp(3),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.wp(2.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: scale.wp(2),
    fontSize: scale.hp(1.8),
    color: Colors.textPrimary,
  },
  categoriesContainer: {
    marginHorizontal: scale.wp(4),
    marginTop: scale.hp(1),
    marginBottom: scale.hp(2)
  },
  categoriesList: {
    paddingVertical: scale.hp(0.5),
  },
  categoryItem: {
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1),
    backgroundColor: "#e4d50815",
    borderRadius: scale.wp(10),
    marginRight: scale.wp(2),
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: scale.hp(1.9),
    fontWeight: "500",
    color: "#E48D08",
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "500",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1),
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  activeFiltersText: {
    fontSize: scale.hp(1.5),
    color: Colors.textSecondary,
    marginRight: scale.wp(2),
    marginBottom: scale.hp(0.5),
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(2.5),
    paddingVertical: scale.hp(0.5),
    borderRadius: scale.wp(3),
    marginRight: scale.wp(1.5),
    marginBottom: scale.hp(0.5),
  },
  filterChipText: {
    fontSize: scale.hp(1.4),
    color: "#fff",
    marginRight: scale.wp(1),
  },
  clearAllButton: {
    paddingHorizontal: scale.wp(3),
    paddingVertical: scale.hp(0.5),
    backgroundColor: "#6c757d",
    borderRadius: scale.wp(2),
    marginBottom: scale.hp(0.5),
  },
  clearAllButtonText: {
    fontSize: scale.hp(1.4),
    color: "#fff",
    fontWeight: "500",
  },
  resultsCountContainer: {
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(1),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  resultsCountText: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale.hp(2),
    fontSize: scale.hp(1.8),
    color: Colors.textSecondary,
  },
  productsList: {
    paddingHorizontal: scale.wp(4),
    paddingBottom: scale.hp(2),
    flexGrow: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale.hp(2),
  },
  productContainer: {
    width: CARD_WIDTH,
  },
  firstInRow: {
    marginRight: scale.wp(1),
  },
  lastInRow: {
    marginLeft: scale.wp(1),
  },
  emptyPlaceholder: {
    opacity: 0,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: scale.wp(3),
    borderColor: "#CD0202",
    borderWidth: 1,
    padding: scale.wp(2.5),
    shadowColor: "#5cbb74ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minHeight: scale.hp(25),
  },
  productImage: {
    width: '100%',
    height: scale.wp(30),
    borderRadius: scale.wp(2),
    marginBottom: scale.hp(1),
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: scale.wp(30),
    borderRadius: scale.wp(2),
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scale.hp(1),
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: scale.hp(1.8),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: scale.hp(0.5),
    minHeight: scale.hp(3.5),
  },
  priceContainer: {
    marginBottom: scale.hp(1),
  },
  productPrice: {
    fontSize: scale.hp(1.8),
    fontWeight: "700",
    color: "#E48D08",
    marginBottom: 2,
  },
  activateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: scale.wp(2),
    paddingVertical: scale.hp(1.2),
    borderRadius: scale.wp(2),
    marginTop: 'auto',
  },
  activateButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: scale.wp(1),
    fontSize: scale.hp(1.6),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale.hp(10),
    paddingHorizontal: scale.wp(4),
  },
  emptyStateTitle: {
    fontSize: scale.hp(2.2),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: scale.hp(2),
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: scale.hp(1),
    marginHorizontal: scale.wp(4),
    lineHeight: scale.hp(2.2),
  },
  refreshButton: {
    marginTop: scale.hp(2),
    paddingHorizontal: scale.wp(6),
    paddingVertical: scale.hp(1.5),
    backgroundColor: Colors.primary,
    borderRadius: scale.wp(3),
  },
  clearFilterButton: {
    backgroundColor: "#6c757d",
    marginTop: scale.hp(1),
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale.hp(1.6),
  },
  footerContainer: {
    paddingVertical: scale.hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: scale.wp(2),
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
  },
  loadMoreButton: {
    paddingVertical: scale.hp(1.5),
    paddingHorizontal: scale.wp(6),
    backgroundColor: Colors.primary,
    borderRadius: scale.wp(3),
    alignSelf: 'center',
    marginVertical: scale.hp(2),
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: scale.hp(1.6),
    fontWeight: '600',
    textAlign: 'center',
  },
  noMoreContainer: {
    paddingVertical: scale.hp(2),
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: scale.hp(1.6),
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});