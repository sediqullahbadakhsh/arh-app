import React from "react";
import { 
  Image, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  FlatList, 
  TextInput,
  ActivityIndicator 
} from "react-native";
import { getMnoLogo } from "../../utils/getMnoLogo";
import DataStyles from "./DataStyles";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";
import { useTranslation } from "react-i18next";

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
  loading,
  mobilePrefix,
}) {
  const operatorLogo = getMnoLogo(getSetaraganMnoId(summary.localNumber));
  const { t } = useTranslation();

  const getOperatorFromPrefix = (prefix) => {
    const prefixMap = {
      '70': 'AWCC',
      '71': 'AWCC',
      '72': 'MTN',
      '73': 'Etisalat',
      '74': 'Salaam',
      '76': 'Roshan',
      '77': 'Roshan',
      '78': 'Etisalat',
      '79': 'Salaam'
    };
    return prefixMap[prefix] || t('unknownOperator');
  };

  const getOperatorLogoFromPrefix = (prefix) => {
    const operatorMap = {
      '70': require('../../../assets/mnos/awcc.png'),
      '71': require('../../../assets/mnos/awcc.png'),
      '72': require('../../../assets/mnos/mtn.png'),
      '73': require('../../../assets/mnos/etisalat.png'),
      '74': require('../../../assets/mnos/salaam.png'),
      '76': require('../../../assets/mnos/roshan.png'),
      '77': require('../../../assets/mnos/roshan.png'),
      '78': require('../../../assets/mnos/etisalat.png'),
      '79': require('../../../assets/mnos/salaam.png')
    };
    return operatorMap[prefix] || require('../../../assets/mnos/awcc.png');
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
      : t('allOperators');
    
    const operatorLogo = item.prefix 
      ? getOperatorLogoFromPrefix(item.prefix.toString())
      : null;

    return (
      <TouchableOpacity
        style={[DataStyles.bundleCard, active && DataStyles.bundleCardActive]}
        onPress={() => setProduct(item)}
        activeOpacity={0.85}
      >
        <View style={DataStyles.bundleHeader}>
          {IMAGE_URL ? (
            <Image 
              source={{ uri: IMAGE_URL }} 
              style={DataStyles.operatorLogo}
              onError={(e) => {
                console.log('Image failed to load:', IMAGE_URL);
                console.log('Error:', e.nativeEvent.error);
              }}
            />
          ) : operatorLogo ? (
            <Image 
              source={operatorLogo} 
              style={DataStyles.operatorLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={[DataStyles.operatorLogo, { 
              backgroundColor: Colors.lightGray,
              justifyContent: 'center',
              alignItems: 'center'
            }]}>
              <Ionicons name="cube-outline" size={24} color={Colors.primary} />
            </View>
          )}
          <View style={DataStyles.bundleInfo}>
            <Text style={[DataStyles.bundleName, active && { color: Colors.primary }]}>
              {item.productName?.en || item.productName}
            </Text>
            

            {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="phone-portrait-outline" size={14} color="#666" />
              <Text style={{ 
                fontSize: 12, 
                color: '#666', 
                marginLeft: 4,
                backgroundColor: '#f0f0f0',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4
              }}>
                {operatorName} {item.prefix ? `(0${item.prefix})` : ''}
              </Text>
            </View> */}
            
            {item.description && (
              <Text style={DataStyles.bundleDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={DataStyles.bundleFooter}>
              <Text style={[DataStyles.bundlePrice, active && { color: Colors.primary }]}>
                {parseFloat(item.price).toFixed(2)} AFN
              </Text>
              {active && (
                <Ionicons name="checkmark-circle" color={Colors.primary} size={20} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginTop: 0 }}>
      <Text style={DataStyles.smallLabel}>{t("bundleCategory")}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={DataStyles.categoriesScroll}
      >
        <View style={DataStyles.categoriesContainer}>
          {bundleCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                DataStyles.categoryChip, 
                selectedCategory?.id === category.id && DataStyles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategory(category);
                setProduct(null); 
              }}
            >
              <Text style={[
                DataStyles.categoryText, 
                selectedCategory?.id === category.id && DataStyles.categoryTextActive
              ]}>
                {category.categoryName?.en || category.categoryName || "Unnamed Category"}
              </Text>
         
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={DataStyles.smallLabel}>{t("bundleType")}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={DataStyles.categoriesScroll}
      >
        <View style={DataStyles.categoriesContainer}>
          {bundleTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                DataStyles.categoryChip, 
                selectedType?.id === type.id && DataStyles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedType(type);
                setProduct(null);
              }}
            >
              <Text style={[
                DataStyles.categoryText, 
                selectedType?.id === type.id && DataStyles.categoryTextActive
              ]}>
                {type.typeName?.en || type.typeName || "Unnamed Type"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={DataStyles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={DataStyles.searchIcon} />
        <TextInput
          placeholder={t("searchProducts")}
          value={search}
          onChangeText={setSearch}
          style={DataStyles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      {product ? (
        <View>
          <View style={[DataStyles.bundleCard, DataStyles.bundleCardActive]}>
            <View style={DataStyles.bundleHeader}>
              {product.image ? (
                <Image 
                  source={{ 
                    uri: product.image.startsWith('http') 
                      ? product.image 
                      : `http://3.67.144.22/backend/uploads/product_images/${encodeURIComponent(product.image)}`
                  }} 
                  style={DataStyles.operatorLogo}
                />
              ) : (
                <View style={[DataStyles.operatorLogo, { 
                  backgroundColor: Colors.lightGray,
                  justifyContent: 'center',
                  alignItems: 'center'
                }]}>
                  <Ionicons name="cube-outline" size={24} color={Colors.primary} />
                </View>
              )}
              <View style={DataStyles.bundleInfo}>
                <Text style={[DataStyles.bundleName, { color: Colors.primary }]}>
                  {product.productName?.en || product.productName}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="phone-portrait-outline" size={14} color="#666" />
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#666', 
                    marginLeft: 4,
                    backgroundColor: '#f0f0f0',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4
                  }}>
                    {product.prefix 
                      ? getOperatorFromPrefix(product.prefix.toString()) 
                      : t('allOperators')
                    } {product.prefix ? `(0${product.prefix})` : ''}
                  </Text>
                </View>
                
                {product.description && (
                  <Text style={DataStyles.bundleDesc} numberOfLines={2}>
                    {product.description}
                  </Text>
                )}
                
                <View style={DataStyles.bundleFooter}>
                  <Text style={[DataStyles.bundlePrice, { color: Colors.primary }]}>
                    {parseFloat(product.price).toFixed(2)} AFN
                  </Text>
                  <Ionicons name="checkmark-circle" color={Colors.primary} size={20} />
                </View>
              </View>
            </View>
          </View>

          <View style={[DataStyles.summaryCard, { marginTop: 16 }]}>
            <View style={DataStyles.summaryRow}>
              <Text style={DataStyles.summaryKey}>{t('mobileNumber')}</Text>
              <Text style={DataStyles.summaryValue}>
                {summary.dial} {formatLocal(summary.localNumber)}
              </Text>
            </View>
            <View style={DataStyles.summaryRow}>
              <Text style={DataStyles.summaryKey}>{t('selectedPlan')}</Text>
              <Text style={DataStyles.summaryValue}>
                {product.productName?.en || product.productName}
              </Text>
            </View>
            {product.description && (
              <View style={DataStyles.summaryRow}>
                <Text style={DataStyles.summaryKey}>{t('description')}</Text>
                <Text style={DataStyles.summaryValue}>
                  {product.description}
                </Text>
              </View>
            )}
            <View style={[DataStyles.summaryRow, DataStyles.summaryTotal]}>
              <Text style={[DataStyles.summaryKey, { fontWeight: "700" }]}>
                {t('totalAmount')}
              </Text>
              <Text style={[DataStyles.summaryValue, { color: Colors.primary, fontWeight: "700" }]}>
                {parseFloat(product.price).toFixed(2)} AFN
              </Text>
            </View>
            <TouchableOpacity onPress={onEditNumber} style={{ marginTop: 8 }}>
              <Text style={[DataStyles.editLink, { alignSelf: "flex-end" }]}>
                {t('changeNumber')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setProduct(null)} 
              style={{ marginTop: 12, alignSelf: 'flex-end' }}
            >
              <Text style={[DataStyles.editLink, { color: Colors.error }]}>
                {t('changeProduct')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        loading ? (
          <View style={DataStyles.emptyProducts}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={DataStyles.emptyProductsText}>{t('loadingProducts')}</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={DataStyles.bundleSeparator} />}
            contentContainerStyle={{ paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={DataStyles.emptyProducts}>
                <Ionicons name="cube-outline" size={48} color="#999" />
                <Text style={DataStyles.emptyProductsText}>
                  {mobilePrefix 
                    ? t('noProductsForPrefix', { prefix: mobilePrefix })
                    : selectedCategory || selectedType 
                      ? t('noProductsForFilters') 
                      : t('noProductsAvailable')
                  }
                </Text>
                {(selectedCategory || selectedType) && (
                  <TouchableOpacity
                    style={DataStyles.clearFiltersButton}
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedType(null);
                    }}
                  >
                    <Text style={DataStyles.clearFiltersText}>{t('clearFilters')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )
      )}
    </View>
  );
}

export default StepProducts;