import React, { useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import Feather from '@expo/vector-icons/Feather';
import { updateCommissionRate } from "../../services/merchantApi";

export default function AgentViewScreen({ navigation, route }) {
  const { agent,refreshAgentList } = route.params || {};
  if (!agent) return null;

  console.log("this is agent information: ", agent)
  const [isCommissionScreen, setIsCommissionScreen] = useState(null)
  const [editCommission, setEditCommision] = useState(false)

  const name = `${agent.firstName} ${agent.lastName}`;

  const [commissionRate, setCommissionRate] = useState(`${agent?.commission_rate}%`)

  const CommissionRateCall = async()=>{
    try {

      if(!commissionRate){
        Alert.alert("Invalid Request","please add Commission Rate first")
        return
      }
      const payload = {
        commission_rate: Number(commissionRate)
      }
      const res = await updateCommissionRate(agent?.user_id, payload)
      refreshAgentList()
      Alert.alert("Commission Update", "Commission Rate Updated Successfully")
      navigation.goBack(-1)
      
    } catch (error) {
      Alert.alert("Failed to set Commission", "Oops, Something Went Wrong!")
      
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Agent Details" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.btnBox}>
   <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AgentCreate")}
          >
            <Text style={styles.addBtnText}>Edit</Text>
          </TouchableOpacity>

             <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsCommissionScreen(true)}
          >
            <Text style={styles.addBtnText}>Commission</Text>
          </TouchableOpacity>
        </View>
      {!isCommissionScreen &&  <View>
          <Row k="username" v={agent?.user?.username} />
        <Row k="Status" v={agent.user?.status === "active" ? "Active" : "Inactive"} />
        <Row k="Phone" v={agent.user?.mobileNumber} />
        <Row k="Email" v={agent.user?.email} />
        <Row k="Alternative Contact" v={agent.alternativeContact} />
        <Row k="Commission Rate" v={agent.commission_rate == null ? "Not Set Yet" : agent?.commission_rate} />
        <Row k="Country" v={agent.countryDetails?.countryName?.en} />
        <Row k="Province" v={agent.provinceDetails?.provinceName?.en} />
        <Row k="District" v={agent.districtDetails?.districtName?.en} />
        <Row k="Location" v={agent.address} />
        </View>}

        {isCommissionScreen && <View style={{   marginTop: 40}}>
          <Text style={{marginBottom: 10}}>Commission Rate</Text>
          <View style={styles.commBox}>
             <TextInput
          style={styles.commInput}
          placeholder={"Enter Commission Rate"}
          placeholderTextColor="#aaa"
          value={commissionRate}
          editable={editCommission}
          pointerEvents={editCommission ? "auto" : "none"}
          onChangeText={(value)=>setCommissionRate(value)}
          keyboardType="number-pad"
        />
        <View style={styles.editIcon}><TouchableOpacity onPress={()=>{
          setCommissionRate("")
          setEditCommision(true)}}><Feather name="edit" size={24} color="black" /></TouchableOpacity></View>
          </View>

         {editCommission && <View style={{display:"flex", flexDirection: "row", marginTop: 25}}>
                <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => CommissionRateCall()}
          >
            <Text style={styles.addBtnText}>Save</Text>
          </TouchableOpacity>
              <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              const commRate = `${agent?.commission_rate}%`
              setCommissionRate(commRate)
              setEditCommision(false)}}
          >
            <Text style={styles.addBtnText}>Cancel</Text>
          </TouchableOpacity>
          </View>}
        </View>}
      </View>
    </SafeAreaView>
  );
}

function Row({ k, v }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.val}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 12 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commBox: {
    width: "100%",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E1E3ED",
    borderRadius: 5,
 
    
  },
  commInput: {
paddingHorizontal: 10,
paddingVertical: 15,
  },
  addBtnText:{color: "white"},
   addBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
  },
   confirmBtn: {
    height: 44,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
   cancelBtn: {
    height: 44,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: Colors.textDark,
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon:{position:"absolute", right: 0, top: "28%", marginRight: 10},
  btnBox:{
    display:"flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    borderRadius: 10
  },
  key: { color: Colors.textSecondary, fontSize: 13 },
  val: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
});
