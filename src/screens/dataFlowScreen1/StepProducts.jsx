import React from "react";
import { 
  Image, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  FlatList, 
  TextInput 
} from "react-native";
import { getMnoLogo } from "../../utils/getMnoLogo";
import DataStyles from "./DataStyles";
import { Ionicons } from "@expo/vector-icons";
import { codeToFlag } from "../../utils/flag";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";

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
}) {
  const operatorLogo = getMnoLogo(getSetaraganMnoId(summary.localNumber));

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
           <View style={DataStyles.bundleFooter}>
          <Text style={[DataStyles.bundlePrice, active && { color: Colors.primary }]}>
            {item.price} AFN
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
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                DataStyles.categoryText, 
                selectedCategory?.id === category.id && DataStyles.categoryTextActive
              ]}>
                {category.category_name?.en || category.category_name || "Unnamed Category"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={DataStyles.smallLabel}>Bundle Type</Text>
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
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                DataStyles.categoryText, 
                selectedType?.id === type.id && DataStyles.categoryTextActive
              ]}>
                {type.productType?.en || type.productType || "Unnamed Type"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
              {selectedCategory || selectedType 
                ? "No bundles available for selected filters" 
                : "No bundles available"
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
                <Text style={DataStyles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {product && (
        <View style={DataStyles.summaryCard}>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Mobile Number</Text>
            <Text style={DataStyles.summaryValue}>
              {summary.dial} {formatLocal(summary.localNumber)}
            </Text>
          </View>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Selected Plan</Text>
            <Text style={DataStyles.summaryValue}>
              {product.productName?.en || product.productName}
            </Text>
          </View>
          <View style={[DataStyles.summaryRow, DataStyles.summaryTotal]}>
            <Text style={[DataStyles.summaryKey, { fontWeight: "700" }]}>
              Total Amount
            </Text>
            <Text style={[DataStyles.summaryValue, { color: Colors.primary, fontWeight: "700" }]}>
              {product.price} AFN
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default StepProducts;