import { SafeAreaView, Text, View } from "react-native"
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";
import { MaterialCommunityIcons,Ionicons  } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


const SecurityScreen = ({navigation})=>{
    const goBack = () => ( navigation.goBack());
               return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
                 <ServiceHeader title="Security" onBack={goBack} />
                 
                 <View style={{display: "flex", marginTop: 40, paddingHorizontal: 30 }}>
                  <View style={{paddingHorizontal: 10, borderRadius: 10, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: "#E1E3ED", display: "flex", flexDirection: "row", alignItems: "center", justifyContent:"space-between"}}>
<View style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
  <MaterialCommunityIcons name="fingerprint" size={24} color="red" />
<Text style={{marginLeft: 10}}>Biometric Setup</Text>
</View>
<View style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
  <MaterialCommunityIcons name="toggle-switch-off-outline" size={24} color="red" />
</View>


                  </View>
                                    <View style={{paddingHorizontal: 10, borderRadius: 10, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: "#E1E3ED", display: "flex", flexDirection: "row", alignItems: "center", justifyContent:"space-between"}}>
<View style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
  <MaterialIcons name="key" size={24} color="red" /> 
<Text style={{marginLeft: 10}}>Change Login Password</Text>
</View>



                  </View>
                  

               </View>
               </SafeAreaView>



}



export default SecurityScreen