import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import AuthHeader from '../components/AuthHeader';
import InputField from '../components/InputField';
import PasswordField from '../components/PasswordField';
import Checkbox from '../components/Checkbox';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import { Ionicons, AntDesign } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    const handleLogin = () => {
        navigation.replace('Tabs');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <AuthHeader title={'Sign in to your\nAccount'} onBack={() => navigation.goBack()} />

            <View style={styles.container}>
                <InputField
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                />
                <PasswordField value={password} onChangeText={setPassword} placeholder="Password" />

                <View style={styles.rowBetween}>
                    <View style={styles.rememberRow}>
                        <Checkbox checked={remember} onToggle={() => setRemember(!remember)} />
                        <Text style={styles.rememberLabel}>  Remember Me</Text>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgot}>Forget Password?</Text>
                    </TouchableOpacity>
                </View>

                <PrimaryButton label="Login" onPress={handleLogin} style={{ marginVertical: 24 }} />

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>Or login with</Text>
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

                <View style={styles.bottomRow}>
                    <Text style={{ color: '#666', fontSize: 13 }}>Don’t have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.white },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        backgroundColor: Colors.white,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    rememberRow: { flexDirection: 'row', alignItems: 'center' },
    rememberLabel: { color: Colors.textPrimary, fontSize: 13 },
    forgot: { color: Colors.orange, fontSize: 13, fontWeight: '500' },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    divider: { flex: 1, height: 1, backgroundColor: Colors.divider },
    dividerText: { marginHorizontal: 12, color: '#9E9E9E', fontSize: 13 },
    socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
});
