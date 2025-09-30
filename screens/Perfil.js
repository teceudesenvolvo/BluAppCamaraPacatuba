import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: 'Nome',
        lastName: 'Sobrenome',
        address: 'Rua: Tal',
        number: '100',
        neighborhood: 'Centro',
        city: 'Pacatuba',
        state: 'Ceará',
    });

    const handleEditPress = () => {
        setIsEditing(!isEditing);
    };

    const handleLogout = () => {
        // Lógica para deslogar o usuário (se houver)
        // Navega de volta para a tela de login
        navigation.navigate('Login');
    };

    const handleInputChange = (field, value) => {
        setProfileData({ ...profileData, [field]: value });
    };

    return (
        <View style={styles.container}>
            {/* Cabeçalho */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleEditPress}>
                    <Text style={styles.editButtonText}>{isEditing ? 'Salvar' : 'Editar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutButtonText}>Sair</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Seção do Perfil */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGVyZmlsfGVufDB8fDB8fHww' }}
                            style={styles.avatarImage}
                        />
                        <View style={styles.editIconContainer}>
                            <Ionicons name="pencil" size={18} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.userStatus}>Visitante</Text>
                    <Text style={styles.userName}>Nome Sobrenome</Text>
                </View>

                {/* Seção de Informações do Perfil */}
                <View style={styles.infoSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Sobrenome</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.lastName}
                            onChangeText={(text) => handleInputChange('lastName', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Endereço</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.address}
                            onChangeText={(text) => handleInputChange('address', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Número</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.number}
                            onChangeText={(text) => handleInputChange('number', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bairro</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.neighborhood}
                            onChangeText={(text) => handleInputChange('neighborhood', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Cidade</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.city}
                            onChangeText={(text) => handleInputChange('city', text)}
                            editable={isEditing}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estado</Text>
                        <TextInput
                            style={styles.input}
                            value={profileData.state}
                            onChangeText={(text) => handleInputChange('state', text)}
                            editable={isEditing}
                        />
                    </View>
                </View>
                <View style={{ height: 100, textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
                    <Text>Desenvolvido por Blu Tecnologias</Text>
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
    header: {
        paddingTop: 50,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#080A6C',
        fontSize: 16,
        fontWeight: 'bold',
        paddingVertical: 15,
        paddingLeft: 10,
    },
    logoutButton: {
        paddingVertical: 15,
        paddingRight: 10,
    },
    logoutButtonText: {
        color: '#ff4d4d',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: '15%',
    },
    profileSection: {
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 20,
        width: '100%',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#080A6C',
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
        marginTop: 5,
        paddingHorizontal: 20,
        paddingTop: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    inputGroup: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
    },
    label: {
        fontSize: 13,
        color: '#333',
    },
    input: {
        fontSize: 16,
        color: '#999',
        marginTop: 5,
    },
});

export default ProfileScreen;
