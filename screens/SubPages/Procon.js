import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DB, AUTH } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';

// Dados de exemplo (mock) para simular as reclamações
const mockReclamacoes = [
    
];

const ProconScreen = ({navigation}) => {
    const [reclamacoes, setReclamacoes] = useState([]);

    useEffect(() => {
        const user = AUTH.currentUser;
        if (!user) return;
        const denunciasRef = ref(DB, 'denuncias-procon');
        const unsubscribe = onValue(denunciasRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setReclamacoes([]);
                return;
            }
            // Filtra apenas as denúncias do usuário logado
            const userDenuncias = Object.entries(data)
                .map(([id, value]) => ({ id, ...value }))
                .filter(d => d.userId === user.uid && d.userEmail === user.email);
            setReclamacoes(userDenuncias);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateComplaint = () => {
        // Lógica para criar uma nova reclamação
        navigation.navigate('RealizarDenuncia');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minhas Reclamações</Text>
                <Text style={styles.headerText}>PROCON - Câmara Municipal de Pacatuba</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {reclamacoes.map(reclamacao => (
                    <View key={reclamacao.id} style={styles.reclamacaoCard}>
                        <View style={styles.cardHeader}>
                        <Text style={styles.cardDescricao}>{reclamacao.assuntoDenuncia || '-'}</Text>
                            <Text style={styles.cardProtocolo}>Protocolo: {reclamacao.protocolo}</Text>
                            <Text style={styles.cardServico}>{reclamacao.companyName || '-'}</Text>
                            <Text style={styles.cardServico}>{reclamacao.detalhesServico || '-'}</Text>

                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.createButton}>
                    <Text style={styles.createButtonText}>Criar Reclamação</Text>
                </View>
                <TouchableOpacity style={styles.plusButton} onPress={handleCreateComplaint}>
                    <Icon name="add" size={30} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    headerText: {
        fontSize: 12,
        color: '#888',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        padding: 20,
    },
    reclamacaoCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 10,
    },
    cardProtocolo: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#080A6C',
    },
    cardServico: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    cardDescricao: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 20,
        position: 'absolute',
        bottom: '10%',
        right: 0,
    },
    createButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        borderBottomEndRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    plusButton: {
        backgroundColor: '#3E4095',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
});

export default ProconScreen;
