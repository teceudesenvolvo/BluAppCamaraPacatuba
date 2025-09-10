import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const CadastroScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);

    const onBackToLogin = () => {
        navigation.navigate('Login');
    }

    const handleNextStep = () => {
        setStep(2);
    };

    const handleRegister = () => {
        // Lógica de cadastro final aqui
        console.log("Cadastro concluído!");
        navigation.navigate('MainApp');

    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            onBackToLogin();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#080A6C', '#080A6C']}
                style={styles.gradient}
            >
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <View style={styles.topContainer}>
                    <Image
                        source={require('../assets/logo-pacatuba.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <KeyboardAvoidingView
                    style={styles.bottomContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {step === 1 ? (
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nome</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nome Sobrenome"
                                        placeholderTextColor="#ccc"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Telefone</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="(85) 9 0000-0000"
                                        placeholderTextColor="#ccc"
                                        keyboardType="phone-pad"
                                    />
                                </View>
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
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Conf. Senha</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="*****"
                                        placeholderTextColor="#ccc"
                                        secureTextEntry
                                    />
                                </View>
                                <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                                    <Text style={styles.buttonText}>Próximo</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>CEP</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="61600-000"
                                        placeholderTextColor="#ccc"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Endereço</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Rua: Exemplo"
                                        placeholderTextColor="#ccc"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Bairro</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Centro"
                                        placeholderTextColor="#ccc"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Cidade</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pacatuba"
                                        placeholderTextColor="#ccc"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Estado</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ceará"
                                        placeholderTextColor="#ccc"
                                    />
                                </View>
                                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                                    <Text style={styles.buttonText}>Cadastrar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 16,
    },
    topContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
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
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 50,
        alignItems: 'center',
    },
    formContainer: {
        width: '100%',
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
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#FFB800',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
    }
});

export default CadastroScreen;
