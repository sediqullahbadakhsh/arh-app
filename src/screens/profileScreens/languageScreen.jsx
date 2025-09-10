
import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, View } from "react-native";
import ServiceHeader from "../../components/ServiceHeader";
import { Colors } from "../../theme/colors";
import LanguageSelector from "./languageSelector";
import { useUser } from "../../context/userContext";
import { updateLanguage } from "../../services/merchantApi";
const LANGS = [
  { label: "English", value: "english", code: "en", flag: "https://flagcdn.com/w20/gb.png" },
  { label: "Dari", value: "dari", code: "fa", flag: "https://flagcdn.com/w20/af.png" },
  { label: "Pashto", value: "pashto", code: "ps", flag: "https://flagcdn.com/w20/af.png" },
];
export default function LanguageScreen({ navigation }) {
  const [selectedLang, setSelectedLang] = useState(null);
  const {user} = useUser()



  useEffect(()=>{
    const getUserLanguage = async()=>{
        const userInfo = await AsyncStorage.getItem("user");
        let parsed
        console.log(parsed, "this is parsed")
        if(userInfo){
         parsed = JSON.parse(userInfo);
        }

        const langg = LANGS.find((lan)=>lan.value == parsed.language)
        console.log(langg, "this is selecte language")
        setSelectedLang(langg)
    }
getUserLanguage()
    
  },[])
  const changeLanguage = async(lang)=>{
    try {
setSelectedLang(lang)
        const payload = {
            messageLanguage: lang?.value
        }

        const res = await updateLanguage(user?.id, payload)

        Alert.alert("Change Language", "Languaged Changed Successfully")
        
    } catch (error) {
        Alert.alert("failed to Change Language", "Oops, Something Went Wrong!")
        
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ServiceHeader title="Manage Language" onBack={() => navigation.goBack()} />
      <View style={{ padding: 16 }}>
        <LanguageSelector
          selectedLang={selectedLang}
          onChange={changeLanguage}
          langs={LANGS}
        />
      </View>
    </SafeAreaView>
  );
}
