import { SafeAreaView, Text, View } from "react-native"
import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";



const ContactUsScreen = ({navigation})=>{
     const goBack = () => ( navigation.goBack());
       return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
         <ServiceHeader title="Contact Us" onBack={goBack} />
         
         <View>
           <Text>Needs to provide the content</Text>
       </View></SafeAreaView>



}



export default ContactUsScreen