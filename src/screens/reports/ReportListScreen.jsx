import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { DUMMY_REPORTS, REPORT_META } from "../../constants/reports";

export default function ReportListScreen({ navigation, route }) {
  const type = route.params?.type;
  const meta = REPORT_META[type] || { title: "Report" };
  const data = useMemo(() => DUMMY_REPORTS[type] || [], [type]);

  const [open, setOpen] = useState(false);
  const [row, setRow] = useState(null);

  const openRow = (item) => {
    setRow(item);
    setOpen(true);
  };
  const close = () => setOpen(false);

  const shareRow = async () => {
    if (!row) return;
    const message = Object.entries(row)
      .map(([k, v]) => `${labelize(k)}: ${v}`)
      .join("\n");
    try {
      await Share.share({ message });
    } catch {}
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => openRow(item)}
      activeOpacity={0.85}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color={Colors.primary}
          />
        </View>
        <View>
          <Text style={styles.titleLine}>{item.ref || item.id}</Text>
          <Text style={styles.sub}>{item.date}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title={meta.title} onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Detail modal with Share */}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{meta.title} Detail</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={shareRow}
                  style={{ padding: 6, marginRight: 4 }}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={Colors.textPrimary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={close} style={{ padding: 6 }}>
                  <Ionicons name="close" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {row ? (
              <View>
                {Object.entries(row).map(([k, v]) => (
                  <View key={k} style={styles.kv}>
                    <Text style={styles.k}>{labelize(k)}</Text>
                    <Text style={styles.v}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function labelize(s) {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\bid\b/i, "ID")
    .replace(/\bmsisdn\b/i, "Mobile");
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sep: { height: 1, backgroundColor: "#EEE" },
  left: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleLine: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
  sub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  // modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 24,
  },
  modal: { backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  k: { color: Colors.textSecondary, fontSize: 13 },
  v: { color: Colors.textPrimary, fontSize: 13, maxWidth: "60%" },
});
