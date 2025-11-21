import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Share,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { DUMMY_REPORTS, REPORT_META } from "../../constants/reports";
import { getStatementReport } from "../../services/merchantApi";
import { formatDateTime } from "../../utils/formatDate";
import { scale } from "../../utils/normalizeSize";
import { useTranslation } from "react-i18next";

export default function ReportListScreen({ navigation, route }) {
  const { t } = useTranslation();
  const type = route.params?.type;
  const meta = REPORT_META[type] || { title: t('report') };
  const data = useMemo(() => DUMMY_REPORTS[type] || [], [type]);

  const [open, setOpen] = useState(false);
  const [row, setRow] = useState(null);

  const [statements, setStatements] = useState([])

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

  useEffect(()=>{
    const getStatement = async()=>{
      const res = await getStatementReport()
      console.log("💖💖💖: ", res)
      setStatements(res?.data)
    }

    getStatement()
  },[])

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
          <Text style={styles.titleLine}>{item.transactionId || item.id}</Text>
          <Text style={styles.sub}>{formatDateTime(item.createdAt)} - {item?.transactionType}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title={t('statementReport')} onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <FlatList
          data={statements}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t('statementReportDetail')}</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    paddingTop: scale.hp(1),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale.hp(1.55),
  },
  sep: {
    height: scale.hp(0.13),
    backgroundColor: "#EEE",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: scale.wp(8.3),
    height: scale.wp(8.3),
    borderRadius: scale.wp(4.15),
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale.wp(3.1),
  },
  titleLine: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.8),
    fontWeight: "600",
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.55),
    marginTop: scale.hp(0.25),
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: scale.wp(6.2),
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: scale.hp(1.8),
    padding: scale.hp(1.8),
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale.hp(1.05),
  },
  modalTitle: {
    fontSize: scale.hp(2.1),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scale.hp(0.8),
  },
  k: {
    color: Colors.textSecondary,
    fontSize: scale.hp(1.7),
  },
  v: {
    color: Colors.textPrimary,
    fontSize: scale.hp(1.7),
    maxWidth: "60%",
  },
});