import { SafeAreaView, Text, View } from "react-native"
import ServiceHeader from "../../components/ServiceHeader"
import { Colors } from "../../theme/colors";



const ProfileDetailsScreen = ({navigation})=>{



  const goBack = () => ( navigation.goBack());
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Profile Details" onBack={goBack} />
      
      <View>
        <Text>this is profile screen</Text>
    </View></SafeAreaView>



}



export default ProfileDetailsScreen