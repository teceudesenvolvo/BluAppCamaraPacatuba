import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';


const { width } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cep, setCep] = useState('');
    const [address, setAddress] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const handleNextStep = () => {
        // Valida\u00e7\u00e3o b\u00e1sica antes de ir para a pr\u00f3xima etapa
        if (step === 1 && name && email && password && confirmPassword) {
            if (password !== confirmPassword) {
                alert("As senhas n\u00e3o coincidem!");
                return;
            }
            setStep(2);
        }
    };

    const handleRegister = () => {
        // L\u00f3gica final de cadastro no \u00faltimo passo
        if (step === 2 && cep && address && neighborhood && city && state) {
            console.log('Dados completos do usu\u00e1rio:', { name, phone, email, password, cep, address, neighborhood, city, state });
            // navigation.navigate('In\u00edcio');
        }
    };

    const handleBack = () => {
        if (step === 1) {
            navigation.goBack();
        } else {
            setStep(1);
        }
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
                keyboardVerticalOffset={20}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Image
                        source={require('../assets/logo-pacatuba.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    {step === 1 ? (
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Nome</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nome Sobrenome"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Telefone</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="(85) 9 0000-0000"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>

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

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Conf. Senha</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="*****"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                                <Text style={styles.buttonText}>Próximo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>CEP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="61600-000"
                                    value={cep}
                                    onChangeText={setCep}
                                    keyboardType="number-pad"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Endere\u00e7o</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Rua: Exemplo"
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Bairro</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Centro"
                                    value={neighborhood}
                                    onChangeText={setNeighborhood}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Cidade</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Pacatuba"
                                    value={city}
                                    onChangeText={setCity}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Estado</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ceará"
                                    value={state}
                                    onChangeText={setState}
                                    placeholderTextColor="#999"
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0,
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingBottom: 50,
    },
    header: {
        width: '100%',
        paddingTop: 50,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
    },
    backButton: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4 * (250 / 600),
        alignSelf: 'center',
        marginTop: 100,
    },
    formContainer: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    inputContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 15,
        height: 45,
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginRight: 10,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: '#333',
    },
    button: {
        width: '100%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#FFA500',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
