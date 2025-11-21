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

    return (
      <TouchableOpacity
        style={[DataStyles.bundleCard, active && DataStyles.bundleCardActive]}
        onPress={() => setProduct(item)}
        activeOpacity={0.85}
      >
        <View style={DataStyles.bundleHeader}>
          {operatorLogo && (
            <Image source={operatorLogo} style={DataStyles.operatorLogo} />
          )}
          <View style={DataStyles.bundleInfo}>
            <Text style={[DataStyles.bundleName, active && { color: Colors.primary }]}>
              {item.productName?.en || item.productName}
            </Text>
            <Text style={[DataStyles.bundleDesc, active && { color: Colors.primary }]}>
              {item.description || "High-speed internet bundle"}
            </Text>
          </View>
        </View>
        <View style={DataStyles.bundleFooter}>
          <Text style={[DataStyles.bundlePrice, active && { color: Colors.primary }]}>
            {item.price} AFN
          </Text>
          {active && (
            <Ionicons name="checkmark-circle" color={Colors.primary} size={20} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginTop: 12 }}>
     

      <Text style={DataStyles.smallLabel}>Bundle Category</Text>
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
            <Ionicons name="wifi-outline" size={48} color="#999" />
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