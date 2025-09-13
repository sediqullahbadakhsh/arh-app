import { SafeAreaView, StyleSheet, Text, View } from "react-native"
import { Colors } from "../theme/colors"
import ServiceHeader from "../components/ServiceHeader"



const MerchantRechargeScreen = ({ navigation })=>{




    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
          <ServiceHeader title="Recharge" onBack={()=>navigation.goBack()} />
<View style={styles.mainView}><Text>what is your name</Text></View>
          
          </SafeAreaView>
}




const styles = StyleSheet.create({
    mainView :{
        paddingHorizontal: 24,
    paddingTop: 24,
    }
})

export default MerchantRechargeScreen