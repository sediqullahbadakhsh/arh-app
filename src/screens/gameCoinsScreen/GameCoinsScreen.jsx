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
} from "react-native";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import ServiceHeader from "../../components/ServiceHeader";
import { useTranslation } from "react-i18next";
import { 
  getAllGameCategories,
  getAllGamesProductsForUser,
} from "../../services/merchantApi";
import { scale } from "../../utils/normalizeSize";
import { useQuery } from "@tanstack/react-query"; 


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


const SkeletonLoader = ({ showHeader = true }) => {
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = (width - (scale.wp(5) * 2) - scale.wp(2)) / 2;
  
  const SkeletonPulse = ({ style }) => (
    <View style={[styles.skeletonPulse, style]} />
  );


  const renderSkeletonHeader = () => (
    <View style={styles.skeletonHeader}>
      <SkeletonPulse style={styles.skeletonBackButton} />
      <SkeletonPulse style={styles.skeletonHeaderTitle} />
      <SkeletonPulse style={styles.skeletonRefreshButton} />
    </View>
  );


  const renderSkeletonSearch = () => (
    <View style={styles.skeletonSearchContainer}>
      <SkeletonPulse style={styles.skeletonSearchIcon} />
      <SkeletonPulse style={styles.skeletonSearchInput} />
    </View>
  );


  const renderSkeletonCategories = () => (
    <View style={styles.skeletonCategoriesContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <SkeletonPulse 
          key={`skeleton-category-${item}`}
          style={styles.skeletonCategoryItem}
        />
      ))}
    </View>
  );


  const renderSkeletonProductCard = () => (
    <View style={[styles.skeletonProductCard, { width: CARD_WIDTH }]}>
      <SkeletonPulse style={styles.skeletonProductImage} />
      <View style={styles.skeletonProductContent}>
        <SkeletonPulse style={styles.skeletonProductName} />
        <SkeletonPulse style={styles.skeletonProductPrice} />
        <SkeletonPulse style={styles.skeletonProductButton} />
      </View>
    </View>
  );


  const renderSkeletonProductRow = () => (
    <View style={styles.skeletonProductRow}>
      <View style={styles.skeletonProductContainer}>
        {renderSkeletonProductCard()}
      </View>
      <View style={styles.skeletonProductContainer}>
        {renderSkeletonProductCard()}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {showHeader && renderSkeletonHeader()}
      {renderSkeletonSearch()}
      {renderSkeletonCategories()}
      
      <FlatList
        data={[1, 2, 3, 4]}
        renderItem={() => renderSkeletonProductRow()}
        keyExtractor={(item) => `skeleton-row-${item}`}
        contentContainerStyle={styles.skeletonProductsList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.skeletonProductsHeader}>
            <SkeletonPulse style={styles.skeletonSectionTitle} />
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.skeletonFooter}>
            <SkeletonPulse style={styles.skeletonLoadMore} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (scale.wp(5) * 2) - scale.wp(2)) / 2;
const ITEMS_PER_PAGE = 10;

export default function GameCoinsCustomerScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { customer } = route?.params || {};
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chunkedProducts, setChunkedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  // API filters state
  const [apiFilters, setApiFilters] = useState({
    search: '',
    productCategoryId: null,
  });

  // Refs
  const flatListRef = useRef(null);
  const isMountedRef = useRef(true);
  const isLoadingMoreRef = useRef(false);

  // Categories query
  const { 
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['gameCategories'],
    queryFn: getAllGameCategories,
  });

  // Products query with pagination
  const { 
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ['gameProducts', apiFilters, page],
    queryFn: () => getAllGamesProductsForUser({
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
  }, [categoriesError, productsError, t]);

  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData?.data || []);
    }
  }, [categoriesData]);

  // Handle products data and pagination
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
        // First page - replace all products
        setAllProducts(newProducts || []);
      } else {
        // Subsequent pages - append products
        setAllProducts(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = (newProducts || []).filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewProducts];
        });
      }
      
      // Update pagination info
      if (meta) {
        setTotalPages(meta.pages || 1);
        setHasMore(page < meta.pages);
      } else {
        // Fallback logic if no meta data
        const hasMoreItems = (newProducts || []).length >= ITEMS_PER_PAGE;
        setHasMore(hasMoreItems);
      }
      
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [productsData, page]);

  // Update chunked products whenever allProducts changes
  useEffect(() => {
    setChunkedProducts(chunkArray(allProducts, 2));
  }, [allProducts]);

  // Update API filters when search or category changes
  const updateApiFilters = useCallback((newFilters) => {
    console.log("Updating filters, resetting to page 1");
    setApiFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
    // Reset to page 1 when filters change
    setPage(1);
    setHasMore(true);
    setAllProducts([]);
    // Scroll to top when filters change
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchText) => {
      updateApiFilters({ 
        search: searchText,
        productCategoryId: selectedCategory?.id || null,
      });
    }, 500),
    [selectedCategory, updateApiFilters]
  );

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    const newCategory = selectedCategory?.id === category.id ? null : category;
    setSelectedCategory(newCategory);
    
    // Update API filters with new category
    updateApiFilters({ 
      productCategoryId: newCategory?.id || null,
      search: searchQuery,
    });
  };

  // Load more products
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
    
    // Increment page to trigger new query
    const nextPage = page + 1;
    setPage(nextPage);
  }, [hasMore, loadingMore, productsLoading, page, totalPages]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    updateApiFilters({ 
      search: '',
      productCategoryId: selectedCategory?.id || null,
    });
  };

  // Clear all filters
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
    navigation.navigate("GameActivationCustomer", { 
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
        {typeof item.categoryName === 'object' 
          ? item.categoryName.en || item.categoryName[Object.keys(item.categoryName)[0]]
          : item.categoryName || item.name}
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
            <Ionicons name="game-controller" size={65} color={Colors.primary} />
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName || item.name}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice} numberOfLines={1}>
               {item.totalAmountInUSD?.toFixed(2) || item.price?.toFixed(2) || "0.00"} USD
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

  // Loading More Skeleton Product Card
  const renderLoadingMoreProductCard = () => (
    <View style={[styles.loadingMoreCard, { width: CARD_WIDTH }]}>
      <View style={styles.loadingMoreImage} />
      <View style={styles.loadingMoreContent}>
        <View style={styles.loadingMoreText} />
        <View style={[styles.loadingMoreText, { width: '70%' }]} />
        <View style={styles.loadingMoreButton} />
      </View>
    </View>
  );

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

  // Loading More Row
  const renderLoadingMoreRow = () => (
    <View style={styles.rowContainer}>
      <View style={[styles.productContainer, styles.firstInRow]}>
        {renderLoadingMoreProductCard()}
      </View>
      <View style={[styles.productContainer, styles.lastInRow]}>
        {renderLoadingMoreProductCard()}
      </View>
    </View>
  );

  // Render footer with loading indicator or skeleton
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          {renderLoadingMoreRow()}
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
    
    if (!hasMore && allProducts.length > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={styles.noMoreText}>
            {t("noMoreProducts") || "No more products"}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmptyState = () => {
    if (productsLoading && page === 1) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="game-controller-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyStateTitle}>
          {apiFilters.search || apiFilters.productCategoryId 
            ? t("noGamesFound") || "No Games Found"
            : t("noGamesAvailable") || "No Games Available"}
        </Text>
        <Text style={styles.emptyStateText}>
          {apiFilters.search 
            ? t("noResultsForSearch") || `No results for "${apiFilters.search}"`
            : apiFilters.productCategoryId
            ? t("noGamesInCategory") || "No games found in this category"
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
    
    if (!loadingMore && hasMore && !productsLoading) {
      console.log("Conditions met, calling loadMoreProducts");
      loadMoreProducts();
    }
  }, [loadingMore, hasMore, productsLoading, loadMoreProducts]);

  const hasActiveFilters = apiFilters.search || apiFilters.productCategoryId;
  const isLoading = categoriesLoading || (productsLoading && page === 1);
  const totalProducts = allProducts.length;

  // Show skeleton loader on initial load
  if (isLoading) {
    return <SkeletonLoader showHeader={true} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ServiceHeader 
        title={t("gameCoins") || "Game Coins"} 
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
          placeholder={t("searchGames") || "Search games..."}
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
  skeletonPulse: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.wp(4),
    paddingVertical: scale.hp(2),
    backgroundColor: Colors.background,
  },
  skeletonBackButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonHeaderTitle: {
    width: scale.wp(40),
    height: 24,
    borderRadius: 4,
  },
  skeletonRefreshButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skeletonSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: scale.wp(4),
    paddingHorizontal: scale.wp(3),
    paddingVertical: scale.hp(1.2),
    borderRadius: scale.wp(2.5),
  },
  skeletonSearchIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skeletonSearchInput: {
    flex: 1,
    height: 20,
    marginLeft: scale.wp(2),
    borderRadius: 4,
  },
  skeletonCategoriesContainer: {
    flexDirection: 'row',
    marginHorizontal: scale.wp(4),
    marginTop: scale.hp(1),
    marginBottom: scale.hp(2)
  },
  skeletonCategoryItem: {
    width: scale.wp(25),
    height: scale.hp(3.5),
    borderRadius: scale.wp(10),
    marginRight: scale.wp(2),
  },
  skeletonProductsList: {
    paddingHorizontal: scale.wp(4),
    paddingBottom: scale.hp(2),
  },
  skeletonProductsHeader: {
    marginBottom: scale.hp(2),
  },
  skeletonSectionTitle: {
    width: scale.wp(40),
    height: 20,
    borderRadius: 4,
  },
  skeletonProductRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale.hp(2),
  },
  skeletonProductContainer: {
    width: (Dimensions.get('window').width - (scale.wp(5) * 2) - scale.wp(2)) / 2,
  },
  skeletonProductCard: {
    backgroundColor: "#fff",
    borderRadius: scale.wp(3),
    padding: scale.wp(2.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonProductImage: {
    width: '100%',
    height: scale.wp(30),
    borderRadius: scale.wp(2),
    marginBottom: scale.hp(1),
  },
  skeletonProductContent: {
    flex: 1,
  },
  skeletonProductName: {
    width: '90%',
    height: 16,
    borderRadius: 4,
    marginBottom: scale.hp(0.8),
  },
  skeletonProductPrice: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    marginBottom: scale.hp(1.2),
  },
  skeletonProductButton: {
    width: '100%',
    height: 36,
    borderRadius: scale.wp(2),
  },
  skeletonFooter: {
    alignItems: 'center',
    paddingVertical: scale.hp(2),
  },
  skeletonLoadMore: {
    width: scale.wp(30),
    height: scale.hp(4),
    borderRadius: scale.wp(3),
  },
  
  // Loading More Styles
  loadingMoreCard: {
    backgroundColor: "#fff",
    borderRadius: scale.wp(3),
    padding: scale.wp(2.5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingMoreImage: {
    width: '100%',
    height: scale.wp(30),
    borderRadius: scale.wp(2),
    backgroundColor: '#F5F5F5',
    marginBottom: scale.hp(1),
  },
  loadingMoreContent: {
    flex: 1,
  },
  loadingMoreText: {
    height: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: scale.hp(0.8),
  },
  loadingMoreButton: {
    width: '100%',
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: scale.wp(2),
  },
  
  // Existing Styles
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
    paddingVertical: scale.hp(2),
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