import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Importa\u00e7\u00e3o das inst\u00e2ncias (AUTH e DB est\u00e3o corretas)
import { AUTH, DB } from '../firebaseConfig'; 
import { signOut } from 'firebase/auth';
import { ref, onValue, update } from 'firebase/database'; 

// --- Fun\u00e7\u00f5es Utilit\u00e1rias ---

/**
 * Converte um URI de arquivo (obtido pelo ImagePicker) para uma string Base64.
 * @param {string} uri - URI do arquivo local.
 * @returns {Promise<string>} Base64 da imagem.
 */
const uriToBase64 = async (uri) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove o prefixo de mimetype (e.g., 'data:image/jpeg;base64,')
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Erro na convers\u00e3o de URI para Base64:", e);
        throw new Error("Falha ao processar a imagem.");
    }
};

const ProfileScreen = ({ navigation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        avatarBase64: null, // Avatar em Base64
    });

    // Usa AUTH (mai\u00fasculo)
    const user = AUTH?.currentUser;
    // Usa DB (mai\u00fasculo)
    const userRef = user ? ref(DB, `users/${user.uid}`) : null;

    // 1. Efeito para buscar dados do perfil em tempo real
    useEffect(() => {
        if (!user || !userRef) {
            setIsLoading(false);
            return;
        }


        // Listener de dados em tempo real
        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Mapeia os dados do RTDB para o estado local
                setProfileData({
                    name: data.name || '',
                    email: data.email || user.email,
                    phone: data.phone || '',
                    cep: data.cep || '',
                    address: data.address || '',
                    neighborhood: data.neighborhood || '',
                    city: data.city || '',
                    state: data.state || '',
                    avatarBase64: data.avatarBase64 || null,
                });
                console.log("Dados de perfil carregados com sucesso!");
            } else {
                // Caso o usu\u00e1rio esteja autenticado, mas n\u00e3o tenha dados no RTDB (nunca completou o cadastro)
                setProfileData(prev => ({ ...prev, email: user.email }));
                console.warn("Dados de perfil n\u00e3o encontrados no Realtime Database. Usando email da autentica\u00e7\u00e3o.");
            }
            setIsLoading(false);
        }, (error) => {
            // TRATAMENTO DEFENSIVO PARA LOGOUT
            // Verifica se o erro \u00e9 de permiss\u00e3o. Se for, e o usu\u00e1rio estiver sendo deslogado,
            // registramos de forma mais suave, pois \u00e9 o comportamento esperado.
            if (error.message.includes('permission_denied')) {
                console.warn("AVISO: Listener do Realtime Database foi encerrado devido \u00e0 perda de permiss\u00e3o (normal ap\u00f3s logout).");
            } else {
                console.error("Erro fatal ao buscar dados do perfil:", error);
            }
            setIsLoading(false);
        });

        // Limpa o listener ao desmontar o componente
        return () => unsubscribe();
    }, [user]); 

    // 2. Fun\u00e7\u00e3o para salvar altera\u00e7\u00f5es
    const handleSave = async () => {
        if (!userRef || isSaving) return;

        setIsSaving(true);
        try {
            // Cria um objeto com apenas os campos edit\u00e1veis para atualizar
            const updates = {
                name: profileData.name,
                phone: profileData.phone,
                cep: profileData.cep,
                address: profileData.address,
                neighborhood: profileData.neighborhood,
                city: profileData.city,
                state: profileData.state,
                // O avatarBase64 j\u00e1 \u00e9 salvo separadamente na fun\u00e7\u00e3o handleImageSelection
            };

            await update(userRef, updates);
            Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
            setIsEditing(false);

        } catch (error) {
            console.error('Erro ao salvar o perfil:', error);
            Alert.alert('Erro', 'N\u00e3o foi poss\u00edvel salvar as altera\u00e7\u00f5es. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPress = () => {
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
        }
    };

    // 3. Fun\u00e7\u00e3o para logout
    const handleLogout = async () => {
        try {
            // Usa AUTH (mai\u00fasculo)
            if (AUTH) {
                await signOut(AUTH);
            }
            // Navega para a tela de Login, assumindo que ela existe na stack de navega\u00e7\u00e3o
            navigation.replace('Login'); 
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert('Erro', 'N\u00e3o foi poss\u00edvel sair. Tente novamente.');
        }
    };

    // 4. Fun\u00e7\u00e3o para sele\u00e7\u00e3o de imagem (C\u00e2mera ou Galeria)
    const handleImageSelection = async (type) => {
        if (!userRef) return;

        const permissionResult = type === 'camera' 
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permiss\u00e3o negada", `\u00c9 necess\u00e1rio permiss\u00e3o para acessar a ${type === 'camera' ? 'c\u00e2mera' : 'galeria'}.`);
            return;
        }

        let result;
        if (type === 'camera') {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
        }

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            try {
                // Converte para Base64
                const base64 = await uriToBase64(uri);

                // Salva o Base64 no Realtime Database (RTDB)
                await update(userRef, { avatarBase64: base64 });
                Alert.alert('Sucesso', 'Foto de perfil atualizada!');
                
                // O listener onValue j\u00e1 ir\u00e1 atualizar o estado 'profileData'
            } catch (e) {
                Alert.alert('Erro', e.message || 'Erro ao converter/salvar imagem.');
            }
        }
    };
    
    // Fun\u00e7\u00e3o wrapper para mostrar op\u00e7\u00f5es
    const handleImageEditPress = () => {
        Alert.alert(
            'Alterar Foto de Perfil',
            'Como voc\u00ea gostaria de definir sua nova foto?',
            [
                { text: 'Abrir C\u00e2mera', onPress: () => handleImageSelection('camera') },
                { text: 'Escolher da Galeria', onPress: () => handleImageSelection('library') },
                { text: 'Cancelar', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };


    const handleInputChange = (field, value) => {
        setProfileData({ ...profileData, [field]: value });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#080A6C" />
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </View>
        );
    }
    
    // URL da imagem de avatar (Base64) ou placeholder
    const avatarSource = profileData.avatarBase64
        ? { uri: `data:image/jpeg;base64,${profileData.avatarBase64}` }
        : { uri: 'https://placehold.co/120x120/cccccc/333333?text=AVATAR' };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleEditPress} disabled={isSaving}>
                    <Text style={styles.editButtonText}>
                        {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Editar'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>Sair</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Se\u00e7\u00e3o do Perfil */}
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={handleImageEditPress}>
                        <Image
                            source={avatarSource}
                            style={styles.avatarImage}
                        />
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{profileData.name || 'Nome do Usu\u00e1rio'}</Text>
                </View>

                {/* Se\u00e7\u00e3o de Informa\u00e7\u00f5es do Perfil */}
                <View style={styles.infoSection}>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={[styles.input, isEditing && styles.inputEditable]}
                            value={profileData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                            editable={isEditing}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, { color: '#999' }]} // Email n\u00e3o \u00e9 edit\u00e1vel aqui
                            value={profileData.email}
                            editable={false}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telefone</Text>
                        <TextInput
                            style={[styles.input, isEditing && styles.inputEditable]}
                            value={profileData.phone}
                            onChangeText={(text) => handleInputChange('phone', text)}
                            editable={isEditing}
                            keyboardType="phone-pad"
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Endereço (Rua/Avenida)</Text>
                        <TextInput
                            style={[styles.input, isEditing && styles.inputEditable]}
                            value={profileData.address}
                            onChangeText={(text) => handleInputChange('address', text)}
                            editable={isEditing}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bairro</Text>
                        <TextInput
                            style={[styles.input, isEditing && styles.inputEditable]}
                            value={profileData.neighborhood}
                            onChangeText={(text) => handleInputChange('neighborhood', text)}
                            editable={isEditing}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CEP</Text>
                        <TextInput
                            style={[styles.input, isEditing && styles.inputEditable]}
                            value={profileData.cep}
                            onChangeText={(text) => handleInputChange('cep', text)}
                            editable={isEditing}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfInput]}>
                            <Text style={styles.label}>Cidade</Text>
                            <TextInput
                                style={[styles.input, isEditing && styles.inputEditable]}
                                value={profileData.city}
                                onChangeText={(text) => handleInputChange('city', text)}
                                editable={isEditing}
                            />
                        </View>
                        <View style={[styles.inputGroup, styles.halfInput]}>
                            <Text style={styles.label}>Estado</Text>
                            <TextInput
                                style={[styles.input, isEditing && styles.inputEditable]}
                                value={profileData.state}
                                onChangeText={(text) => handleInputChange('state', text)}
                                editable={isEditing}
                            />
                        </View>
                    </View>

                </View>
                <View style={styles.footer} >
                    <Text style={styles.footerText}>Desenvolvido por Blu Tecnologias</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        color: '#080A6C',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    editButtonText: {
        color: '#080A6C',
        fontSize: 16,
        fontWeight: 'bold',
        paddingVertical: 15,
    },
    logoutButton: {
        paddingVertical: 15,
    },
    logoutButtonText: {
        color: '#ff4d4d',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 50,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        width: '100%',
        backgroundColor: '#fff',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ddd',
        borderWidth: 3,
        borderColor: '#080A6C',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#FFB800',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userStatus: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    infoSection: {
        width: '100%',
        backgroundColor: '#fff',
        marginTop: 10,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    inputGroup: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
        borderBottomWidth: 0, 
    },
    label: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    input: {
        fontSize: 16,
        color: '#333',
        marginTop: 5,
        paddingVertical: 0,
    },
    inputEditable: {
        color: '#080A6C',
        fontWeight: 'bold',
        // Adiciona um fundo sutil para indicar que \u00e9 edit\u00e1vel
        backgroundColor: '#f9f9ff', 
        borderRadius: 5,
        paddingHorizontal: 5,
    },
    footer: {
        height: 100,
        width: '100%',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    }
});

export default ProfileScreen;
