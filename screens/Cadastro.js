import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import Logo  from '../assets/logo-sf-branco-app.png';

// CORREÇÃO CRÍTICA: Mudança de 'auth' e 'db' (minúsculas) para 'AUTH' e 'DB' (maiúsculas) 
// para corresponder ao que é exportado em firebaseConfig.js.
import { AUTH, DB } from '../firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database'; 

// --- FUNÇÕES DE MÁSCARA ---

/**
 * Aplica a máscara de telefone (XX) X XXXX-XXXX
 */
const maskPhone = (value) => {
    value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
    
    // (XX) X XXXX-XXXX
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d{4})(\d{4})$/, "$1-$2");
    
    // Se for celular (9 dígitos no número)
    if (value.length > 14) {
        value = value.replace(/(\d{1})(\s)(\d{4})/, "$1 $3");
    }
    return value;
};

/**
 * Aplica a máscara de CEP (XXXXX-XXX)
 */
const maskCep = (value) => {
    value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
    if (value.length > 8) value = value.slice(0, 8); // Limita a 8 dígitos
    value = value.replace(/^(\d{5})(\d)/, "$1-$2"); // Coloca o hífen após o 5º dígito
    return value;
};

/**
 * Aplica a máscara de CPF (XXX.XXX.XXX-XX)
 */
const maskCpf = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, ""); // Remove tudo o que não é dígito
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{2})$/, "$1-$2");
    return value;
};

/**
 * Aplica a máscara de RG (formato simples, pode ser ajustado)
 */
const maskRg = (value) => {
    if (!value) return "";
    // Remove caracteres não alfanuméricos e limita o tamanho
    value = value.replace(/[^a-zA-Z0-9]/g, "");
    if (value.length > 12) value = value.slice(0, 12);
    return value;
};

const SEXO_OPTIONS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];


const CadastroScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [sexo, setSexo] = useState('');
    const [isSexoDropdownOpen, setIsSexoDropdownOpen] = useState(false);
    
    // Estados para os dados do formul\u00e1rio
    const [name, setName] = useState(''); // formulário
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');
    const [estadoCivil, setEstadoCivil] = useState('');

    const [cep, setCep] = useState('');
    const [address, setAddress] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [isCepLoading, setIsCepLoading] = useState(false);


    // --- LÓGICA DE BUSCA VIA CEP ---
    useEffect(() => {
        const fetchAddressByCep = async () => {
            const cleanedCep = cep.replace(/\D/g, '');
            // Busca apenas se tiver 8 dígitos
            if (cleanedCep.length !== 8) return;
            
            setIsCepLoading(true);
            setError('');

            try {
                const apiUrl = `https://viacep.com.br/ws/${cleanedCep}/json/`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.erro) { // inválido
                    setError('CEP n\u00e3o encontrado ou inv\u00e1lido.');
                    
                    // Limpa os campos se o CEP for inv\u00e1lido
                    setAddress('');
                    setNeighborhood('');
                    setCity('');
                    setState('');
                    
                } else {
                    // Preenche automaticamente os campos
                    setAddress(data.logradouro || '');
                    setNeighborhood(data.bairro || '');
                    setCity(data.localidade || '');
                    setState(data.uf || '');
                    setError('');
                }
                
            } catch (e) {
                console.error('Erro ao buscar CEP:', e);
                setError('Erro de conex\u00e3o ao buscar CEP.');
            } finally {
                setIsCepLoading(false);
            }
        };

        // Adiciona um pequeno delay para evitar chamadas excessivas à API
        const handler = setTimeout(() => {
            fetchAddressByCep();
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [cep]);


    const handleNextStep = () => {
        setError('');
        
        if (step === 1) {
            // Validação básica do Passo 1
            if (!name || !sexo || !phone || !email || !password || !confirmPassword) {
                setError('Por favor, preencha todos os campos.');
                return;
            }
            if (password !== confirmPassword) {
                setError('As senhas n\u00e3o coincidem.');
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            setStep(2);
        }
    };

    const handleRegister = async () => {
        setError('');
        setSuccessMessage('');
        
        // Validação básica do Passo 2
        if (!cpf || !rg || !estadoCivil || !cep || !address || !neighborhood || !city || !state) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);

        try {
            // 1. Criação do usuário no Firebase Authentication
            // AGORA USANDO A CONSTANTE AUTH CORRETA
            const userCredential = await createUserWithEmailAndPassword(AUTH, email, password);
            const user = userCredential.user;
            
            // 2. Coleta de dados adicionais // adicionais
            const userData = {
                id: user.uid,
                email: user.email,
                name,
                sexo,
                phone: phone.replace(/\D/g, ''), // Salva apenas dígitos
                cpf: cpf.replace(/\D/g, ''),       // Salva apenas dígitos
                rg: rg.replace(/[^a-zA-Z0-9]/g, ''), // Salva apenas alfanuméricos
                estadoCivil,                cep: cep.replace(/\D/g, ''),     // Salva apenas dígitos
                address,
                neighborhood,
                city,
                state,
                createdAt: new Date().toISOString()
            };

            // 3. Salvando dados adicionais no Realtime Database (RTDB)
            // AGORA USANDO A CONSTANTE DB CORRETA
            const userRef = ref(DB, 'users/' + user.uid);
            await set(userRef, userData);
            
            setSuccessMessage('Cadastro realizado e dados salvos! Você será redirecionado.');
            
            // Redireciona para a tela principal e remove as telas de autenticação do histórico
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainApp' }], // Altere para o nome da sua tela principal
                });
            }, 2000);

        } catch (e) {
            console.error("Erro durante o cadastro:", e);
             switch (e.code) {
                case 'auth/email-already-in-use':
                    setError('Este email j\u00e1 est\u00e1 em uso. Tente fazer login.');
                    break;
                case 'auth/invalid-email': // inválido
                    setError('O formato do email \u00e9 inv\u00e1lido.');
                    break;
                case 'auth/weak-password':
                    setError('Senha muito fraca. Escolha uma senha com pelo menos 6 caracteres.');
                    break;
                default:
                    // Captura e exibe qualquer erro desconhecido, incluindo o de Firebase App não inicializado
                    setError(`Ocorreu um erro no cadastro: ${e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setError('');
        } else {
            navigation.goBack(); 
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
                        source={Logo}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <KeyboardAvoidingView
                    style={styles.bottomContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

                        {step === 1 ? (
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Nome</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nome Sobrenome"
                                        placeholderTextColor="#ccc"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Sexo</Text>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setIsSexoDropdownOpen(!isSexoDropdownOpen)}
                                    >
                                        <Text style={sexo ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                                            {sexo || 'Selecione seu sexo'}
                                        </Text>
                                    </TouchableOpacity>
                                    {isSexoDropdownOpen && (
                                        <View style={styles.dropdownOptionsContainer}>
                                            {SEXO_OPTIONS.map((option, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.dropdownOption}
                                                    onPress={() => {
                                                        setSexo(option);
                                                        setIsSexoDropdownOpen(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownOptionText}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Telefone</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="(XX) X XXXX-XXXX"
                                        placeholderTextColor="#ccc"
                                        keyboardType="numeric"
                                        value={maskPhone(phone)} // dígitos
                                        onChangeText={text => setPhone(text.replace(/\D/g, ''))} // Armazena apenas dígitos
                                        maxLength={15} // Tamanho máximo da máscara
                                    />
                                </View>
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
                                        placeholder="Min. 6 caracteres"
                                        placeholderTextColor="#ccc"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Conf. Senha</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Repita a senha"
                                        placeholderTextColor="#ccc"
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={styles.button} 
                                    onPress={handleNextStep}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Próximo</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.formContainer}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>CPF</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="000.000.000-00"
                                        placeholderTextColor="#ccc"
                                        keyboardType="numeric"
                                        value={maskCpf(cpf)}
                                        onChangeText={setCpf}
                                        maxLength={14}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>RG</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00.000.000-0"
                                        placeholderTextColor="#ccc"
                                        value={maskRg(rg)}
                                        onChangeText={setRg}
                                        maxLength={12}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Estado Civil</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Solteiro(a), Casado(a), etc."
                                        placeholderTextColor="#ccc"
                                        value={estadoCivil}
                                        onChangeText={setEstadoCivil}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>CEP</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00000-000"
                                        placeholderTextColor="#ccc"
                                        keyboardType="numeric"
                                        value={maskCep(cep)}
                                        onChangeText={setCep} // máscara
                                        maxLength={9} // Tamanho máximo da máscara
                                    />
                                    {isCepLoading && <ActivityIndicator style={styles.loadingCep} size="small" color="#080A6C" />}
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Endereço</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Rua, Av., etc."
                                        placeholderTextColor="#ccc"
                                        value={address}
                                        onChangeText={setAddress}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Bairro</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Centro"
                                        placeholderTextColor="#ccc"
                                        value={neighborhood}
                                        onChangeText={setNeighborhood}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Cidade</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pacatuba"
                                        placeholderTextColor="#ccc"
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Estado (UF)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="CE"
                                        placeholderTextColor="#ccc"
                                        value={state}
                                        onChangeText={setState}
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={[styles.button, (loading || isCepLoading) && styles.buttonDisabled]} 
                                    onPress={handleRegister}
                                    disabled={loading || isCepLoading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Cadastrar</Text>
                                    )}
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
        width: 500,
        height: 350,
        top: 0,
        borderRadius: 20,
        zIndex: -1,
        position: 'absolute',
    },
    bottomContainer: {
        marginTop: `50%`,
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
        position: 'relative', // Para posicionar o loading do CEP
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
    loadingCep: {
        position: 'absolute',
        right: 15,
        bottom: 15,
    },
    errorText: {
        color: '#ff4d4d',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
        padding: 10,
        backgroundColor: '#ffe6e6',
        borderRadius: 8,
    },
    successText: {
        color: 'green',
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
        marginTop: 20,
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
    // Estilos para o dropdown de sexo
    dropdownPlaceholderText: {
        color: '#ccc',
        fontSize: 16,
    },
    dropdownSelectedText: {
        marginTop: 15,
        color: '#333',
        fontSize: 16,
    },
    dropdownOptionsContainer: {
        marginTop: 5,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        width: '100%',
    },
    dropdownOption: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#333',
    }
});

export default CadastroScreen;
