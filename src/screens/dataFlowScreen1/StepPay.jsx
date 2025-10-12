import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import DataStyles from "./DataStyles";
import { Colors } from "../../theme/colors";


function StepPay({ summary, onEditProduct }) {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ marginTop: 12 }}>
        <Text style={DataStyles.sectionTitle}>Payment Summary</Text>
        
        <View style={DataStyles.summaryCard}>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Mobile Number</Text>
            <Text style={DataStyles.summaryValue}>{summary.mobile}</Text>
          </View>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Selected Plan</Text>
            <Text style={DataStyles.summaryValue}>{summary.product?.productName}</Text>
          </View>
          <View style={DataStyles.summaryRow}>
            <Text style={DataStyles.summaryKey}>Plan Description</Text>
            <Text style={DataStyles.summaryValue}>{summary.product?.description}</Text>
          </View>
          <View style={[DataStyles.summaryRow, DataStyles.summaryTotal]}>
            <Text style={[DataStyles.summaryKey, { fontWeight: "700" }]}>
              Total Amount
            </Text>
            <Text style={[DataStyles.summaryValue, { color: Colors.primary, fontWeight: "700" }]}>
              {summary.amount} AFN
            </Text>
          </View>
          <TouchableOpacity onPress={onEditProduct} style={{ marginTop: 8 }}>
            <Text style={[DataStyles.editLink, { alignSelf: "flex-end" }]}>
              Change bundle
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[DataStyles.smallLabel, { marginTop: 16, textAlign: 'center' }]}>
          The amount will be deducted from your wallet balance
        </Text>
      </View>
    </ScrollView>
  );
}

export default StepPay;
