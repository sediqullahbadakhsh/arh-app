import { SafeAreaView, Text, View } from "react-native"
import ServiceHeader from "../../components/ServiceHeader";
import { Colors } from "../../theme/colors";



const AboutUsScreen = ({navigation})=>{
      const goBack = () => ( navigation.goBack());
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="About Us" onBack={goBack} />
      
      <View>
        <Text>Needs to provide the content</Text>
    </View></SafeAreaView>



}



export default AboutUsScreen