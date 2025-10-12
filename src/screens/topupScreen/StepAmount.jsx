import Animated from "react-native-reanimated";
import TopUpStyles from "./TopupStyle";
import { useState } from "react";
import { Colors } from "../../theme/colors";
import { TouchableOpacity, View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrimaryButton from "../../components/PrimaryButton";

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
  continueButtonAnim,
  onContinue,
  canContinue,
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const rechargeAmounts = [
    { afn: 50, usd: calculateUsdAmount(50, exchangeRate, slabPercentage) },
    { afn: 100, usd: calculateUsdAmount(100, exchangeRate, slabPercentage) },
    { afn: 150, usd: calculateUsdAmount(150, exchangeRate, slabPercentage) },
    { afn: 250, usd: calculateUsdAmount(250, exchangeRate, slabPercentage) },
    { afn: 500, usd: calculateUsdAmount(500, exchangeRate, slabPercentage) },
    { afn: 1000, usd: calculateUsdAmount(1000, exchangeRate, slabPercentage) },
  ];

  // Check if user has entered custom amount
  const hasCustomAmount = customAfn && customAfn.trim() !== "";
  
  // Handle popular amount selection - navigate immediately
  const handlePopularAmountSelect = (amount) => {
    onSelectPopularAmount(amount);
    // Navigate immediately after selecting popular amount
    setTimeout(() => {
      if (canContinue) {
        onContinue();
      }
    }, 100);
  };

  // Safe animation value - fallback to 1 if continueButtonAnim is undefined
  const safeAnimationValue = continueButtonAnim || new Animated.Value(1);

  return (
    <View style={{ marginTop: 12 }}>
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
            Recharge
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
            Bundle
          </Text>
        </TouchableOpacity>
      </View>

      {serviceType === 'recharge' ? (
        <>
          <Text style={TopUpStyles.sectionTitle}>Enter Amount</Text>
          
          {/* Custom Amount Input */}
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
              value={customAfn}
              onChangeText={setCustomAfn}
              placeholder="0"
              keyboardType="decimal-pad"
              style={TopUpStyles.customInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            
            {customAfn && !loadingData && (
              <View style={TopUpStyles.usdEquivalentContainer}>
                <Text style={TopUpStyles.usdEquivalentText}>
                  ≈ ${usd} USD
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[TopUpStyles.clearBtn, { opacity: customAfn ? 1 : 0.5 }]}
              disabled={!customAfn}
              onPress={() => {
                setCustomAfn("");
                setProduct(null);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#A3A3A3" />
            </TouchableOpacity>
          </View>

          {/* Show Continue Button when custom amount is entered */}
          {hasCustomAmount && canContinue && (
            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                label="Continue"
                onPress={onContinue}
              />
            </View>
          )}

          {/* Show Popular Amounts only when no custom amount is entered */}
          {showPopularAmounts && !hasCustomAmount && (
            <View style={TopUpStyles.quickAmountsContainer}>
              <Text style={TopUpStyles.quickAmountsTitle}>Popular amounts</Text>
              <View style={TopUpStyles.quickAmountsList}>
                {rechargeAmounts.map((amount) => {
                  const isSelected = afn === amount.afn;
                  
                  return (
                    <TouchableOpacity
                      key={amount.afn}
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
                          ${amount.usd} USD
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Show Continue Button for other cases (without animation to avoid errors) */}
          {showContinueButton && !hasCustomAmount && canContinue && (
            <View style={{ marginTop: 24 }}>
              <PrimaryButton
                label="Continue"
                onPress={onContinue}
              />
            </View>
          )}
        </>
      ) : (
        <View style={TopUpStyles.comingSoonContainer}>
          <Ionicons name="time-outline" size={64} color={Colors.primary} />
          <Text style={TopUpStyles.comingSoonTitle}>Coming Soon</Text>
          <Text style={TopUpStyles.comingSoonText}>
            Bundle packages will be available soon. Stay tuned for exciting data and call bundles!
          </Text>
        </View>
      )}
    </View>
  );
}

export default StepAmount;