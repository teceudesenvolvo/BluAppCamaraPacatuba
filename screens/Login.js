import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Lógica de autenticação
        console.log('Entrar com:', email, password);
        navigation.navigate('Inicio');
    };

    const handleRegister = () => {
        navigation.navigate('Cadastro');
    };

    return (
        <LinearGradient
            colors={['#080A6C', '#3E4095']}
            style={styles.container}
        >
            <StatusBar style="light" />
            <KeyboardAvoidingView
                style={{ flex: 1, width: '100%' }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Logo da Câmara Municipal */}
                    <Image
                        source={require('../assets/logo-pacatuba.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    {/* Campos de Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@dominio.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="*****"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Botões de Ação */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
                            <Text style={styles.buttonText}>Cadastrar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Entrar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: width * 0.7,
        height: width * 0.7 * (250 / 600),
        marginBottom: 50,
    },
    inputContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 50,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginRight: 10,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    button: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    registerButton: {
        backgroundColor: '#00BFFF',
    },
    loginButton: {
        backgroundColor: '#FFA500',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
