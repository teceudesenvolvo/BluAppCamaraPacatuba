import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Logo  from '../assets/logo-pacatuba.png';

// CORRE\u00c7\u00c3O CR\u00cdTICA: Importando AUTH (mai\u00fasculo) para corresponder \u00e0 exporta\u00e7\u00e3o em firebaseConfig.js
import { AUTH } from '../firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onRegister = () => {
        // Navega para a tela de Cadastro
        navigation.navigate('Cadastro');
    }

    const onLogin = async () => {
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // VERIFICA\u00c7\u00c3O ATUALIZADA para AUTH (mai\u00fasculo)
            if (!AUTH) { 
                // Caso o Firebase n\u00e3o tenha sido inicializado corretamente.
                console.error("Inst\u00e2ncia de Auth n\u00e3o dispon\u00edvel.");
                setError('Erro de inicializa\u00e7\u00e3o. Tente novamente.');
                setLoading(false);
                return;
            }
            
            // Tenta fazer login com email e senha, usando AUTH
            await signInWithEmailAndPassword(AUTH, email, password);
            
            // Sucesso: A tela App.js ir\u00e1 detectar a mudan\u00e7a de estado e navegar para MainApp automaticamente.
            console.log("Login bem-sucedido. O AppWrapper far\u00e1 a navega\u00e7\u00e3o.");
            navigation.replace('MainApp') 

            // Se voc\u00ea precisar de navega\u00e7\u00e3o imediata, descomente:


        } catch (e) {
            console.error("Erro durante o login:", e.code, e.message);
            
            // Mapeamento de erros comuns para mensagens amig\u00e1veis
            switch (e.code) {
                case 'auth/invalid-email':
                    setError('O formato do email \u00e9 inv\u00e1lido.');
                    break;
                case 'auth/user-disabled':
                    setError('Este usu\u00e1rio foi desabilitado.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential': 
                    setError('Email ou senha incorretos.');
                    break;
                default:
                    setError('Ocorreu um erro no login. Verifique suas credenciais.');
            }
        } finally {
            setLoading(false);
        }
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
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* O KeyboardAvoidingView \u00e9 usado para evitar que o teclado cubra os inputs */}
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
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="*****"
                            placeholderTextColor="#ccc"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity>
                        <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
                    </TouchableOpacity>
                    
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={onLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerBtn} onPress={onRegister}>
                        <Text style={styles.registerText}>N\u00e3o possui uma conta? <Text style={styles.registerLink}>Cadastre-se</Text></Text>
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
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
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
    buttonDisabled: {
        backgroundColor: '#FFD780', // Cor mais clara quando desabilitado
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
