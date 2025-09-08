import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PerfilScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Image
                    source={{ uri: 'https://img.freepik.com/fotos-gratis/retrato-de-homem-branco-isolado_53876-40306.jpg?semt=ais_hybrid&w=740&q=80' }} // Substitua pela imagem de perfil real
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>Nome do Usuário</Text>
                <Text style={styles.profileEmail}>email@exemplo.com</Text>
            </View>

            <View style={styles.profileActions}>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="person-outline" size={24} color="#080A6C" />
                    <Text style={styles.actionText}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="lock-closed-outline" size={24} color="#080A6C" />
                    <Text style={styles.actionText}>Mudar Senha</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="settings-outline" size={24} color="#080A6C" />
                    <Text style={styles.actionText}>Configurações</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.logoutButton]}>
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                    <Text style={[styles.actionText, styles.logoutText]}>Sair</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        padding: 20,
        marginTop: '10%',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 50,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: '#080A6C',
        marginBottom: 10,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    profileEmail: {
        fontSize: 16,
        color: '#666',
    },
    profileActions: {
        width: '100%',
        paddingHorizontal: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    actionText: {
        marginLeft: 15,
        fontSize: 18,
        color: '#080A6C',
    },
    logoutButton: {
        marginTop: 20,
        backgroundColor: '#FFB800',
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PerfilScreen;
