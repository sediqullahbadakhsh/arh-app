import { Text, View, SafeAreaView  } from "react-native"

import { Colors } from "../../theme/colors";
import ServiceHeader from "../../components/ServiceHeader";



const AboutAppScreen = ({navigation})=>{
     const goBack = () => ( navigation.goBack());
       return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
         <ServiceHeader title="About App" onBack={goBack} />
         
         <View>
           <Text>Needs to provide the content</Text>
       </View></SafeAreaView>



}



export default AboutAppScreen