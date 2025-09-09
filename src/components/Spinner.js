import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function WhiteSpinner({ size = "small" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
