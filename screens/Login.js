import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const LoginScreen = ({navigation}) => {
    const onRegister = () => {
        navigation.navigate('Cadastro');
    }
    const onLogin = () => {
        navigation.navigate('MainApp', { screen: 'Inicio' });
    }
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#080A6C', '#080A6C']}
                style={styles.gradient}
            >
                <View style={styles.topContainer}>
                    <Image
                        source={require('../assets/logo-pacatuba.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* O KeyboardAvoidingView é usado para evitar que o teclado cubra os inputs */}
                <KeyboardAvoidingView
                    style={styles.bottomContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@dominio.com"
                            placeholderTextColor="#ccc"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="*****"
                            placeholderTextColor="#ccc"
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity>
                        <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={onLogin}>
                        <Text style={styles.buttonText}>Entrar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerBtn} onPress={onRegister}>
                        <Text style={styles.registerText}>Não possui uma conta? <Text style={styles.registerLink}>Cadastre-se</Text></Text>
                    </TouchableOpacity>
                    <View style={styles.spaceBottom} >
                        <Text style={styles.spaceBottomTxt}>Desenvolvido por Blu Tecnologias</Text>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080A6C',
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    topContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    logo: {
        width: 150,
        height: 150,
    },
    bottomContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 50,
        alignItems: 'center',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    forgotPassword: {
        color: '#080A6C',
        textDecorationLine: 'underline',
        marginBottom: 30,
        marginTop: -10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#FFB800',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#666',
    },
    registerLink: {
        color: '#080A6C',
        fontWeight: 'bold',
    },
    spaceBottom: {
        width: 'auto',
        paddingTop: 100,
        height: 100,
    },
    spaceBottomTxt: {
        color: '#ccccccff',
    }
});

export default LoginScreen;
