import React, { useState, useEffect, useMemo } from "react";
import { Image, Text, TouchableOpacity, View, ScrollView, FlatList, TextInput } from "react-native";
import { getMnoLogo } from "../../utils/getMnoLogo";
import DataStyles from "./DataStyles";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";
import { getDataProductsCustomer } from "../../services/merchantApi";

function StepProducts({
  country,
  category,
  setCategory,
  search,
  setSearch,
  products,
  product,
  setProduct,
  onEditNumber,
  summary,
  productCategories,
}) {
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Extract unique product types from products
  useEffect(() => {
    if (products && products.length > 0) {
      const uniqueTypes = [];
      const seenTypes = new Set();
      
      products.forEach(product => {
        if (product.productTypeDetails && product.productTypeDetails.id && !seenTypes.has(product.productTypeDetails.id)) {
          seenTypes.add(product.productTypeDetails.id);
          uniqueTypes.push({
            id: product.productTypeDetails.id,
            productType: product.productTypeDetails.productType || "Unknown Type",
            description: product.productTypeDetails.description || ""
          });
        }
      });
      
      console.log("Extracted product types:", uniqueTypes);
      setProductTypes(uniqueTypes);
      
      if (uniqueTypes.length > 0) {
        setSelectedProductType(uniqueTypes[0]);
      }
    }
  }, [products]);

  // Filter products based on selected product type and search
  useEffect(() => {
    let filtered = products;
    
    // Filter by product type
    if (selectedProductType?.id) {
      filtered = filtered.filter(product => 
        product.productTypeId === selectedProductType.id
      );
    }
    
    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.price?.toString().includes(q)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedProductType, search]);

  const renderItem = ({ item }) => {
    const active = product?.id === item.id;
    const operatorLogo = getMnoLogo(getSetaraganMnoId(summary.localNumber));

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
              {item.productName}
            </Text>
            <Text style={[DataStyles.bundleDesc, active && { color: Colors.primary }]}>
              {item.description || "High-speed internet bundle"}
            </Text>
            {item.productTypeDetails && (
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
                Type: {getProductTypeName(item.productTypeDetails)}
              </Text>
            )}
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

  const getCategoryName = (categoryItem) => {
    if (!categoryItem) return "";
    
    if (typeof categoryItem.category_name === 'string') {
      return categoryItem.category_name;
    } else if (categoryItem.category_name?.en) {
      return categoryItem.category_name.en;
    } else if (categoryItem.category_name) {
      const firstKey = Object.keys(categoryItem.category_name)[0];
      return categoryItem.category_name[firstKey];
    }
    
    return categoryItem.name || "Unnamed Category";
  };

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

  return (
    <View>


 
      {productTypes.length > 0 && (
        <>
  
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={DataStyles.categoriesScroll}>
            <View style={DataStyles.categoriesContainer}>
              {productTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[DataStyles.categoryChip, selectedProductType?.id === type.id && DataStyles.categoryChipActive]}
                  onPress={() => setSelectedProductType(type)}
                >
                  <Text style={[DataStyles.categoryText, selectedProductType?.id === type.id && DataStyles.categoryTextActive]}>
                    {getProductTypeName(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <Text style={DataStyles.smallLabel}>Search Bundles</Text>
      <View style={DataStyles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={DataStyles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search bundle or price..."
          style={DataStyles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={DataStyles.bundleSeparator} />}
        contentContainerStyle={{ paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={DataStyles.emptyProducts}>
            <Ionicons name="wifi-outline" size={48} color="#999" />
            <Text style={DataStyles.emptyProductsText}>
              {productTypes.length > 0 ? "No bundles available for this type" : "No bundles available"}
            </Text>
          </View>
        }
      />

      {product && (
        <View style={DataStyles.summaryCard}>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Mobile Number</Text>
            <TouchableOpacity onPress={onEditNumber}>
              <Text style={[DataStyles.summaryValue, { color: Colors.primary }]}>
                {summary.dial} {formatLocal(summary.localNumber)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Selected Plan</Text>
            <Text style={DataStyles.summaryValue}>{product.productName}</Text>
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