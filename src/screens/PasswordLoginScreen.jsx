import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../theme/colors";
import AuthHeader from "../components/AuthHeader";
import PasswordField from "../components/PasswordField";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../auth/AuthProvider";
import RoundedInput from "../components/RoundedInput";
import InputField from "../components/InputField";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Checkbox from "../components/Checkbox";
import { useUser } from "../context/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { ScrollView } from "react-native";
export default function PasswordLoginScreen({ route, navigation }) {
  const { target = "" } = route.params || {}; 
   const { user, setUser } = useUser();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState( "");
  const [rememberMe, setRememberMe]  = useState(false)
  const [busy, setBusy] = useState(false);
  const auth = useAuth();


 useEffect(() => {
  const getRememberMeDetails = async () => {
    try {
      const storedData = await AsyncStorage.getItem("rememberMe");
      if (!storedData) return;

      const credentials = JSON.parse(storedData);

      if (!credentials?.email || !credentials?.password) return;

      setEmail(credentials.email);
      setPassword(credentials.password);
      setRememberMe(true);
    } catch (error) {
      console.error("Failed to fetch rememberMe data:", error);
    }
  };

  getRememberMeDetails();
}, []);

const onLogin = async () => {
  try {
    setBusy(true);

    const res = await auth.loginPassword({ identifier: email, password });
    console.log(res, "this is agent login res👏👏😜");

    const userInfo = {
      token: res.access_token,
      role: res.role,
      roleId: res.role_id,
      id: res.id,
      username: res.username,
      accountType: res?.accountType,
    };

    if (rememberMe) {
      const credentials = {
        email,
        password,
      };
      await AsyncStorage.setItem("rememberMe", JSON.stringify(credentials));
    } else {

      await AsyncStorage.removeItem("rememberMe");
    }

    await AsyncStorage.setItem("user", JSON.stringify(userInfo));
    setUser(userInfo);

    navigation.replace("Tabs");
  } catch (e) {
    Alert.alert("Login", e?.message || "Unable to sign in");
  } finally {
    setBusy(false);
  }
};


  const canSubmit = password.trim().length > 0 && !busy;
  const [hidden, setHidden] = useState(true);
  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title={"Sign in to your\nAccount"} onBack={() => navigation.goBack()} />
   <KeyboardAwareScrollView
  contentContainerStyle={{ flexGrow: 1 }}
  enableOnAndroid
  extraScrollHeight={20}
  keyboardShouldPersistTaps="handled"
>
    <View style={{ flex: 1 }}>
         <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
               showsVerticalScrollIndicator={false}
            >  
        <View style={styles.container}>
        
       <View style={{marginTop: 40}}>
          <View style={{marginBottom: 20}}> 
            <Text style={{marginBottom: 6, fontSize: 16}}>Email</Text>
            <RoundedInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@example.com"
              keyboardType="email-address"
              rightIcon={<Ionicons name="mail-outline" size={24} color="#344054" />}
                returnKeyType="done"
  onSubmitEditing={canSubmit ? onLogin : undefined}
            />
          </View>
         <View>
<Text style={{marginBottom: 6, fontSize: 16}}>Password</Text>
            <RoundedInput
            value={password}
            onChangeText={setPassword}
             placeholder="xxxxxxx"
            secureTextEntry={hidden}
            rightIcon={
                <TouchableOpacity onPress={() => setHidden(!hidden)}>
                    <Ionicons 
                        name={hidden ? 'eye-off-outline' : 'eye-outline'} 
                        size={22} 
                        color="#A9A9A9" 
                    />
                </TouchableOpacity>
            }
        
           returnKeyType="done"
           onSubmitEditing={canSubmit ? onLogin : undefined}
        />

          
         </View>
       </View>
       <View style={{display: "flex", flexDirection: "row", marginTop: 8, justifyContent: "space-between" }}>
        <View style={{display: "flex", justifyContent: "flex-start", flexDirection: "row", alignItems: "center"}}>
          <Checkbox checked={rememberMe} onToggle={()=>{setRememberMe((prev)=>!prev)}}/>
          <Text style={{fontFamily: "mdsansRegular", fontSize: 14,marginLeft: 8, color: Colors.textTitle}}>Remember Me</Text>
        </View>
        <View><Text style={{fontFamily: "mdsansMedium", fontSize: 14, color: "#E48D08"}}>Forget Password?</Text></View>
       </View>

          <View style={{marginTop: 60}}>
            <PrimaryButton
            label={busy ? "Signing in..." : "Login"}
            onPress={onLogin}
            disabled={!canSubmit}
            style={{ marginTop: 8 }}
          />
          </View>
        </View>
        </ScrollView></View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 24,
    backgroundColor: Colors.pageBackColor,
  },
  infoTxt: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
});
