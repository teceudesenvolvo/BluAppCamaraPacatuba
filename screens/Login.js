import React, { useState } from 'react';
// Imports React Native
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
// Nota: O caminho da imagem deve ser ajustado para o ambiente de execução
import Logo from '../assets/logo-pacatuba.png'; 

// Importando AUTH e o método de login por email/senha
import { AUTH } from '../firebaseConfig'; 
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onRegister = () => {
        // Simula a navegação para a tela de Cadastro
        // navigation.navigate('Cadastro');
        console.log('Navegar para Cadastro');
    }

    // Apenas login com Email e Senha (signInWithEmailAndPassword)
    const onLogin = async () => {
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!AUTH) { 
                console.error("Instância de Auth não disponível. Verifique firebaseConfig.");
                setError('Erro de inicialização. Tente novamente.');
                setLoading(false);
                return;
            }
            
            // Este método é o único usado para autenticação, excluindo o login anônimo.
            await signInWithEmailAndPassword(AUTH, email, password);
            
            // Sucesso
            navigation.replace('MainApp') 
            console.log('Login bem-sucedido! Redirecionando...');

        } catch (e) {
            console.error("Erro durante o login:", e.code, e.message);
            
            switch (e.code) {
                case 'auth/invalid-email':
                    setError('O formato do e-mail é inválido.');
                    break;
                case 'auth/user-disabled':
                    setError('Este usuário foi desabilitado.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential': 
                    setError('E-mail ou senha incorretos.');
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
                {/* 1. CONTAINER SUPERIOR (BLU) - Altura fixa para performance */}
                <View style={styles.topContainer}>
                    <Image
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* 2. KEYBOARD AVOIDING VIEW (BRANCO) - Com flex: 1 para redimensionamento suave */}
                <KeyboardAvoidingView
                    style={styles.kavContainer}
                    // O keyboardVerticalOffset pode ser usado para ajuste fino, se necessário
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 50} 
                >
                    {/* Wrapper para o conteúdo do formulário (Inputs e Botões) */}
                    <View style={styles.inputContentWrapper}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
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
                                placeholder="Senha"
                                placeholderTextColor="#ccc"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize="none"
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
                            <Text style={styles.registerText}>Não possui uma conta? <Text style={styles.registerLink}>Cadastre-se</Text></Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Rodapé fixo no final do KAV */}
                    <View style={styles.footer}>
                        <Text style={styles.footerTxt}>Desenvolvido por Blu Tecnologias</Text>
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
    // *** OTIMIZAÇÃO CRÍTICA: TOP CONTAINER COM ALTURA FIXA ***
    topContainer: {
        height: 220, // Altura fixa para evitar recálculo de flex
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    logo: {
        width: 150,
        height: 150,
        marginTop: 40,
    },
    // *** OTIMIZAÇÃO CRÍTICA: KAV CONTAINER COM FLEX: 1 E BG BRANCO ***
    kavContainer: {
        flex: 1, // Permite que o KAV se redimensione rapidamente
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        marginTop: 60, 
        // Alinhamento do conteúdo centralizado
        alignItems: 'center', 
    },
    inputContentWrapper: {
        width: '100%',
        paddingHorizontal: 30,
        paddingTop: 40,
        // Usamos marginBottom para empurrar o footer para baixo caso haja espaço
        marginBottom: 40, 
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
        textAlign: 'right',
        width: '100%',
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
        backgroundColor: '#FFD780',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#666',
        textAlign: 'center',
        width: '100%',
    },
    registerLink: {
        color: '#080A6C',
        fontWeight: 'bold',
    },
    footer: {
        width: '100%',
        // O footer fica no final do KAV
        alignItems: 'center',
        paddingBottom: 10,
    },
    footerTxt: {
        color: '#ccccccff',
        fontSize: 12,
    }
});

export default LoginScreen;
