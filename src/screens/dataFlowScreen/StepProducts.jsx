import { Image, Text, TouchableOpacity, View, ScrollView, FlatList, TextInput } from "react-native";
import { getMnoLogo } from "../../utils/getMnoLogo";
import DataStyles from "./DataStyles";
import { Ionicons } from "@expo/vector-icons";
import { codeToFlag } from "../../utils/flag";
import { Colors } from "../../theme/colors";
import { getSetaraganMnoId } from "../../utils/getCompanyIdForSetaragan";
import formatLocal from "../../utils/formatLocal";



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
}) {
  const categories = ["Data", "Voice", "SMS", "Combo"];

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
      {/* <View style={DataStyles.editHeader}>
        <Text style={DataStyles.sectionTitle}>Choose a Bundle</Text>
        <TouchableOpacity onPress={onEditNumber}>
          <Text style={DataStyles.editLink}>Change number</Text>
        </TouchableOpacity>
      </View>

      <Text style={DataStyles.smallLabel}>Country</Text>
      <View style={DataStyles.countryBadge}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>
          {codeToFlag(country?.countryCode)}
        </Text>
        <Text style={{ fontWeight: "600", color: Colors.textPrimary }}>
          {country?.countryName}
        </Text>
      </View> */}

      <Text style={DataStyles.smallLabel}>Bundle Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={DataStyles.categoriesScroll}>
        <View style={DataStyles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[DataStyles.categoryChip, category === cat && DataStyles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[DataStyles.categoryText, category === cat && DataStyles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
        data={products}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={DataStyles.bundleSeparator} />}
        contentContainerStyle={{ paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={DataStyles.emptyProducts}>
            <Ionicons name="wifi-outline" size={48} color="#999" />
            <Text style={DataStyles.emptyProductsText}>No bundles available</Text>
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