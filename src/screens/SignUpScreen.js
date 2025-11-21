import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { scale } from '../utils/normalizeSize';

export default function SignUpScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pass2, setPass2] = useState('');

    const handleSignUp = () => {
        navigation.navigate('CountrySelect', {
            name,
            email,
            password,
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <AuthHeader title={'Sign Up'} onBack={() => navigation.goBack()} />

            <View style={styles.container}>
                <InputField value={name} onChangeText={setName} placeholder="Name" />
                <InputField value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
                <PasswordField value={password} onChangeText={setPassword} placeholder="Password" />
                <PasswordField value={pass2} onChangeText={setPass2} placeholder="Re-Enter Password" />

                <PrimaryButton label="Sign Up" onPress={handleSignUp} style={{ marginVertical: 24 }} />

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>Or Continue with</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                    <SocialButton
                        label="Google"
                        icon={<AntDesign name="google" size={20} color="#4285F4" />}
                        onPress={() => { }}
                    />
                    <View style={{ width: 16 }} />
                    <SocialButton
                        label="Facebook"
                        icon={<Ionicons name="logo-facebook" size={22} color="#1877F2" />}
                        onPress={() => { }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale.wp(6.2),
    paddingTop: scale.hp(3.1),
    backgroundColor: Colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale.hp(3.1),
    marginTop: scale.hp(1.05),
  },
  divider: {
    flex: 1,
    height: scale.hp(0.13),
    backgroundColor: Colors.divider,
  },
  dividerText: {
    marginHorizontal: scale.wp(3.1),
    color: '#9E9E9E',
    fontSize: scale.hp(1.8),
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scale.hp(4.2),
  },
});
