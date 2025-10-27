import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../../firebaseConfig';
import { ref, onValue, push, set } from 'firebase/database';

const AtendimentoCard = ({ item }) => (
    <View style={styles.atendimentoCard}>
        <Text style={styles.atendimentoTitle}>{item.dadosSolicitacao?.tipoAtendimento || 'Atendimento'}</Text>
        <Text style={styles.atendimentoText}><Text style={styles.bold}>Assunto:</Text> {item.dadosSolicitacao?.assunto}</Text>
        <Text style={styles.atendimentoText}><Text style={styles.bold}>Data do Fato:</Text> {item.dadosSolicitacao?.dataFato}</Text>
        <Text style={styles.atendimentoStatus}><Text style={styles.bold}>Status:</Text> {item.status || 'Pendente'}</Text>
    </View>
);

const ProcuradoriaMulherScreen = ({ navigation }) => {
    const [atendimentos, setAtendimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFemaleSpecificButtons, setShowFemaleSpecificButtons] = useState(false);

    useEffect(() => {
        // Use onAuthStateChanged for robust auth state listening
        const authUnsubscribe = AUTH.onAuthStateChanged(user => {
            if (user) {
                // 1. Buscar o perfil do usuário para verificar o sexo
                const userProfileRef = ref(DB, `users/${user.uid}`);
                const profileUnsubscribe = onValue(userProfileRef, (profileSnapshot) => {
                    if (profileSnapshot.exists()) {
                        const profileData = profileSnapshot.val();
                        // Condição para mostrar o botão do pânico
                        setShowFemaleSpecificButtons(profileData.sexo === 'feminino');
                    } else {
                        setShowFemaleSpecificButtons(false);
                    }
                });

                // 2. Buscar os atendimentos do usuário
                const atendimentosRef = ref(DB, 'procuradoria-mulher');
                const dbUnsubscribe = onValue(atendimentosRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const userAtendimentos = Object.keys(data)
                            .map(key => ({ id: key, ...data[key] }))
                            .filter(item => item.dadosUsuario?.id === user.uid)
                            .reverse();
                        setAtendimentos(userAtendimentos);
                    } else {
                        setAtendimentos([]);
                    }
                    setLoading(false);
                });

                // Return the database listener cleanup function
                return () => {
                    profileUnsubscribe();
                    dbUnsubscribe();
                };
            } else {
                // No user is signed in
                setAtendimentos([]);
                setLoading(false);
                setShowFemaleSpecificButtons(false);
            }
        });

        return () => authUnsubscribe(); // Cleanup auth listener on component unmount
    }, []);

    const handlePanicButton = async () => {
        Alert.alert(
            "Confirmar Ação",
            "Deseja realmente acionar o Botão do Pânico? Um alerta (sem localização) será enviado.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Acionar",
                    onPress: async () => {
                        const user = AUTH.currentUser;
                        if (!user) {
                            Alert.alert("Erro", "Usuário não autenticado.");
                            return;
                        }

                        // Gerar protocolo
                        const protocolo = `PANICO-${Date.now()}${Math.floor(Math.random() * 1000)}`;

                        // Montar dados do alerta (sem coordenadas)
                        const alertaData = {
                            protocolo,
                            userId: user.uid,
                            userEmail: user.email,
                            timestamp: new Date().toISOString(),
                        };

                        // 5. Salvar no Firebase
                        try {
                            const alertasRef = ref(DB, `procuradoria-mulher-btn-panico/${user.uid}/alertas`);
                            const newAlertaRef = push(alertasRef);
                            await set(newAlertaRef, alertaData);
                            Alert.alert("Alerta Enviado", `Seu pedido de ajuda foi enviado com sucesso. Protocolo: ${protocolo}`);
                        } catch (error) {
                            console.error("Erro ao salvar alerta:", error);
                            Alert.alert("Erro", "Não foi possível enviar o alerta. Tente novamente.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Procuradoria da Mulher</Text>
            </View>

            <FlatList
                data={atendimentos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <AtendimentoCard item={item} />}
                contentContainerStyle={styles.scrollContent}
                ListHeaderComponent={
                    <>
                        {showFemaleSpecificButtons && (
                            <>
                                <TouchableOpacity style={styles.panicButton} onPress={handlePanicButton}>
                                    <Icon name="crisis-alert" size={30} color="#fff" />
                                    <Text style={styles.panicButtonText}>Botão do Pânico</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contactButton} onPress={() => navigation.navigate('ContatoConfianca')}>
                                    <Text style={styles.contactButtonText}>Gerenciar Contato de Confiança</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.card}>
                            <Text style={styles.title}>O que é a Procuradoria da Mulher?</Text>
                            <Text style={styles.bodyText}>
                                A Procuradoria da Mulher é um órgão do Poder Legislativo que atua na defesa dos direitos das mulheres,
                                combatendo a violência e a discriminação de gênero. Ela oferece acolhimento, orientação e encaminhamento
                                para os serviços da rede de proteção.
                            </Text>
                        </View>

                        <Text style={styles.sectionTitle}>Meus Atendimentos</Text>
                        {loading && <ActivityIndicator size="large" color="#b100a8ff" style={{ marginTop: 20 }} />}
                    </>
                }
                ListEmptyComponent={() =>
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhuma solicitação de atendimento encontrada.</Text>
                        </View>
                    )
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('FormProcuradoria')}>
                <Icon name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9eaf9ff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 20,
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    bannerImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 20,
        resizeMode: 'cover',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#b100a8ff',
        marginBottom: 10,
        marginTop: 10,
    },
    bodyText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        textAlign: 'justify',
    },
    panicButton: {
        backgroundColor: '#d32f2f',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    panicButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    contactButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    contactButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    atendimentoCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    atendimentoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#b100a8',
        marginBottom: 5,
    },
    atendimentoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    atendimentoStatus: {
        fontSize: 14,
        color: '#333',
        marginTop: 5,
    },
    bold: {
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 30,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: '12%', // Ajustado para não ficar sobre a tab bar
        backgroundColor: '#b100a8',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
});

export default ProcuradoriaMulherScreen;