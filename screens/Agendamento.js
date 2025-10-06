import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MaskInput from 'react-native-mask-input';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Importações Firebase para o ambiente React (modular SDK)
import { AUTH, DB } from '../firebaseConfig';
import { setLogLevel } from 'firebase/firestore';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- MOCKS DE DADOS ---
const MOCK_SERVICOS = [
    { id: 's2', nome: 'Balcão do Cidadão' },
    { id: 's3', nome: 'Procuradoria da Mulher' },
    { id: 's4', nome: 'Ouvidoria Municipal' },
    { id: 's5', nome: 'Atendimento Jurídico' },
];

const MOCK_HORARIOS = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
];

// --- COMPONENTE PRINCIPAL ---
const App = () => {
    // --- ESTADOS DO FIREBASE ---
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // --- ESTADOS DO APLICATIVO ---
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState(null); 
    const [selectedItem, setSelectedItem] = useState(null); 
    
    // Dados do formulário
    const [date, setDate] = useState('');
    const [time, setTime] = useState(null);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [motivo, setMotivo] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [error, setError] = useState('');

    // --- ESTADO DINÂMICO DE VEREADORES ---
    const [vereadores, setVereadores] = useState([]);
    const [vereadoresLoading, setVereadoresLoading] = useState(false);
    const [vereadoresError, setVereadoresError] = useState('');

    // Adicione um estado para as datas disponíveis
    const [datasDisponiveis, setDatasDisponiveis] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState('');
    const [showDataPicker, setShowDataPicker] = useState(false);

    // --- 1. SETUP FIREBASE E AUTENTICAÇÃO (USANDO firebaseConfig.js) ---
    useEffect(() => {
        setLogLevel('debug');
        setIsAuthReady(true); // Considera pronto, pois AUTH e DB já estão configurados
    }, []);

    // --- 2. BUSCA DE DADOS DO PERFIL ---
    useEffect(() => {
        // Certifique-se de que DB e userId estão prontos
        if (DB && userId && isAuthReady) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Caminho privado: /artifacts/{appId}/users/{userId}/user_data/contact_info
            const userDocRef = doc(DB, 
                `artifacts/${appId}/users/${userId}/user_data/contact_info`
            );

            // Reseta o profileLoading ao iniciar o listener, caso o ID tenha mudado
            setProfileLoading(true); 

            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNome(data.nome || '');
                    setTelefone(data.telefone || '');
                } else {
                    // Cria um documento inicial se não existir
                    setDoc(userDocRef, { 
                            nome: `Visitante #${userId.substring(0, 4)}`, 
                            telefone: '' 
                        }, { merge: true })
                        .catch(e => console.error('Erro ao criar documento inicial:', e));
                    // Mantém os campos vazios na UI até serem preenchidos ou atualizados pelo snapshot
                    setNome(''); 
                    setTelefone('');
                }
                setProfileLoading(false); 
            }, (error) => {
                console.error('Erro ao carregar dados do perfil:', error);
                setProfileLoading(false);
            });

            return () => unsubscribe();
        } else if (!isAuthReady) {
            // Se a autenticação não estiver pronta, mantenha o profileLoading como true até que 'isAuthReady' seja true
            setProfileLoading(true); 
        }
    }, [DB, userId, isAuthReady]);

    // --- CARREGAMENTO DINÂMICO DOS VEREADORES ---
    useEffect(() => {
        if (mode === 'VEREADOR') {
            setVereadoresLoading(true);
            setVereadoresError('');
            fetch('https://cmpacatuba.ce.gov.br/dadosabertosexportar?d=vereadores&a=&f=json&itens_por_pagina=20')
                .then(res => res.json())
                .then(data => {
                    setVereadores(Array.isArray(data) ? data : []);
                    setVereadoresLoading(false);
                })
                .catch(() => {
                    setVereadoresError('Erro ao carregar vereadores. Tente novamente.');
                    setVereadoresLoading(false);
                });
        }
    }, [mode]);

    // Gere as próximas 30 datas úteis (sem finais de semana)
    useEffect(() => {
        const hoje = new Date();
        const datas = [];
        let count = 0;
        let dia = new Date(hoje);
        while (datas.length < 30 && count < 60) {
            if (dia.getDay() !== 0 && dia.getDay() !== 6) {
                // Formato ISO para o value, e pt-BR para o label
                const value = dia.toISOString().split('T')[0];
                const label = dia.toLocaleDateString('pt-BR');
                datas.push({ value, label });
            }
            dia.setDate(dia.getDate() + 1);
            count++;
        }
        setDatasDisponiveis(datas);
        setDataSelecionada(datas[0]?.value || '');
    }, []);

    // --- FUNÇÕES DE NAVEGAÇÃO E LÓGICA DO APP ---
    const handleSelectItem = (item, type) => {
        setMode(type);
        setSelectedItem(item);
        setStep(2);
        setError('');
    };

    const handleFinalizeScheduling = () => {
        if (!nome || !telefone || !dataSelecionada || !time || !motivo) {
            // Usa Alert do React Native em vez de alert()
            Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
            setError('Por favor, preencha todos os campos obrigatórios (Nome e telefone são preenchidos automaticamente pelo seu perfil).');
            return;
        }

        setLoading(true);
        setError('');
        
    // Simulação de envio de dados
        setTimeout(() => {
            setLoading(false);
            setStep(3); 
            // Lógica para salvar o agendamento no Firestore seria adicionada aqui.
        }, 1500);
    };

    const handleNewScheduling = () => {
        setStep(1);
        setMode(null);
        setSelectedItem(null);
        setDate('');
        setTime(null);
        setMotivo('');
        setError('');
    };

    // --- RENDERIZAÇÃO POR ETAPAS ---

    // Etapa 1: Seleção de Modo e Item
    const renderStepOne = () => (
        <View style={styles.card}>
            <Text style={styles.headerText}>1. Escolha a Opção</Text>
            
            <View style={styles.modeContainer}>
                <TouchableOpacity 
                    style={[styles.modeButton, mode === 'VEREADOR' && styles.modeButtonActive]}
                    onPress={() => setMode('VEREADOR')}
                >
                    <Text style={[styles.modeText, mode === 'VEREADOR' && styles.modeTextActive]}>Vereador</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.modeButton, mode === 'SERVICO' && styles.modeButtonActive]}
                    onPress={() => setMode('SERVICO')}
                >
                    <Text style={[styles.modeText, mode === 'SERVICO' && styles.modeTextActive]}>Serviço Público</Text>
                </TouchableOpacity>
            </View>

            {mode && (
                <View style={styles.listContainer}>
                    <Text style={styles.listHeader}>Selecione {mode === 'VEREADOR' ? 'o Vereador' : 'o Serviço'}:</Text>
                    {mode === 'VEREADOR' ? (
                        vereadoresLoading ? (
                            <ActivityIndicator size="small" color="#080A6C" />
                        ) : vereadoresError ? (
                            <Text style={styles.errorText}>{vereadoresError}</Text>
                        ) : (
                            vereadores.map((item) => (
                                <TouchableOpacity
                                    key={String(item.id || item.ID || item.nome || Math.random())}
                                    style={styles.itemButton}
                                    onPress={() => handleSelectItem({
                                        id: item.id || item.ID || item.id,
                                        nome: item.NomeParlamentar
                                    }, mode)}
                                >
                                    <Text style={styles.itemText}>{item.NomeParlamentar}</Text>
                                    <Text style={styles.itemSelectText}> &rarr;</Text>
                                </TouchableOpacity>
                                    
                            ))
                        )
                    ) : (
                        MOCK_SERVICOS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.itemButton}
                                onPress={() => handleSelectItem(item, mode)}
                            >
                                <Text style={styles.itemText}>{item.nome}</Text>
                                <Text style={styles.itemSelectText}> &rarr;</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={{height: 100}}></View>
                </View>
            )}
            
            {/* Exibi\u00e7\u00e3o do User ID (MANDAT\u00d3RIO em apps multiusu\u00e1rio) */}
            {userId && <Text style={styles.userIdText}>ID do Usuário: {userId}</Text>}
            {error && !db && <Text style={styles.errorText}>Erro Fatal: {error}</Text>}
        </View>
    );

    // Etapa 2: Detalhes do Agendamento
    const renderStepTwo = () => (
        <View style={styles.card}>
            <Text style={styles.headerText}>2. Detalhes do Agendamento</Text>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Agendando com:</Text>
                <Text style={styles.infoItem}>{selectedItem?.nome}</Text>
                <Text style={styles.infoSubtitle}>Tipo: {mode === 'VEREADOR' ? 'Vereador' : 'Servi\u00e7o P\u00fablico'}</Text>
            </View>

            <Text style={styles.label}>Data Desejada</Text>
            <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDataPicker(!showDataPicker)}>
                <Text style={{ color: dataSelecionada ? '#1F2937' : '#9CA3AF', fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                    {datasDisponiveis.find(d => d.value === dataSelecionada)?.label || 'Selecione a data'}
                </Text>
                <Icon name="arrow-drop-down" size={24} color="#333" style={{ position: 'absolute', right: 12, top: 12 }} />
            </TouchableOpacity>
            {showDataPicker && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#D1D5DB' }}>
                    {datasDisponiveis.map((d) => (
                        <TouchableOpacity
                            key={d.value + '-' + d.label}
                            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                            onPress={() => {
                                setDataSelecionada(d.value);
                                setShowDataPicker(false);
                            }}
                        >
                            <Text style={{ fontSize: 16, color: '#1F2937' }}>{d.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Horários Disponíveis</Text>
            <View style={styles.timeSlotsContainer}>
                {MOCK_HORARIOS.map((slot) => (
                    <TouchableOpacity
                        key={'horario-' + slot}
                        style={[styles.timeSlot, time === slot && styles.timeSlotActive]}
                        onPress={() => setTime(slot)}
                    >
                        <Text style={[styles.timeSlotText, time === slot && styles.timeSlotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {profileLoading ? (
                <View style={styles.loadingProfileContainer}>
                    <ActivityIndicator size="small" color="#080A6C" />
                    <Text style={styles.loadingProfileText}>Carregando dados do perfil...</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.label}>Seu Nome Completo (Preenchido Automaticamente)</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="Nome"
                        value={nome}
                        editable={false} 
                    />

                    <Text style={styles.label}>Telefone / WhatsApp (Preenchido Automaticamente)</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="(00) 99999-9999"
                        value={telefone}
                        editable={false}
                    />
                    <Text style={styles.profileHint}>
                        Para alterar nome ou telefone, você precisa editar seu perfil.
                    </Text>
                </>
            )}

            <Text style={styles.label}>Motivo do Contato / Assunto</Text>
            <TextInput
                style={styles.textarea}
                placeholder="Breve descrição do motivo do agendamento"
                value={motivo}
                onChangeText={setMotivo}
                multiline
                numberOfLines={4}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
                style={[styles.finalizeButton, (loading || profileLoading) && styles.finalizeButtonDisabled]}
                onPress={handleFinalizeScheduling}
                disabled={loading || profileLoading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#080A6C" />
                ) : (
                    <Text style={styles.finalizeButtonText}>Confirmar Agendamento</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                <Text style={styles.backButtonText}>&larr; Voltar para a Seleção</Text>
            </TouchableOpacity>
            <View style={{height: 130}}></View>
        </View>
    );
    
    // Etapa 3: Confirma\u00e7\u00e3o
    const renderStepThree = () => (
        <View style={styles.card}>
            <Text style={styles.confirmationTitle}>Agendamento Realizado com Sucesso!</Text>
            <Text style={styles.confirmationSubtitle}>
                Seu agendamento com <Text style={styles.confirmationHighlight}>{selectedItem?.nome}</Text> foi registrado.
                Aguarde a confirmação e detalhes finais via telefone ou e-mail.
            </Text>

            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Detalhes:</Text>
                <Text style={styles.summaryText}>&bull; Data: {datasDisponiveis.find(d => d.value === dataSelecionada)?.label} - {time}</Text>
                <Text style={styles.summaryText}>&bull; Assunto: {motivo}</Text>
                <Text style={styles.summaryText}>&bull; Contato: {telefone} (<Text style={{fontWeight: 'bold'}}>{nome}</Text>)</Text>
            </View>

            <TouchableOpacity 
                style={styles.finalizeButton}
                onPress={handleNewScheduling}
            >
                <Text style={styles.finalizeButtonText}>Fazer Novo Agendamento</Text>
            </TouchableOpacity>
        </View>
    );

    // --- RENDERIZA\u00c7\u00c3O PRINCIPAL ---
    const renderContent = () => {
        if (!isAuthReady) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#080A6C" />
                    <Text style={styles.loadingText}>Iniciando o sistema...</Text>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
            );
        }
        if (step === 1) return renderStepOne();
        if (step === 2) return renderStepTwo();
        if (step === 3) return renderStepThree();
        return null; 
    };

    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.mainTitle}>Portal de Agendamentos</Text>
                <Text style={styles.subTitle}>Passo {step} de 3</Text>
            </View>
        
        <ScrollView contentContainerStyle={styles.container}>
            
            <View style={styles.contentWrapper}>
                {renderContent()}
            </View>
        </ScrollView>
        </View>
    );
};

// --- ESTILOS REACT NATIVE ---
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F3F4F6', // light gray background
    },
    header: {
        paddingTop: 88, 
        paddingBottom: 20,
        paddingLeft: 20,
        alignItems: 'left',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 4,
        textAlign: `left`,
    },
    subTitle: {
        fontSize: 16,
        color: '#1f1f1f', // Accent Yellow
    },
    contentWrapper: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 80,
        height: '100%',
    },
    card: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 15,
        color: '#8c8c8c',
        marginBottom: 20,
        textAlign: 'left',
    },
    modeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginHorizontal: -4,
    },
    modeButton: {
        flex: 1,
        padding: 16,
        marginHorizontal: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#080A6C',
        backgroundColor: 'white',
        alignItems: 'center',
    },
    modeButtonActive: {
        backgroundColor: '#080A6C',
    },
    modeText: {
        fontSize: 13,
        color: '#080A6C',
    },
    modeTextActive: {
        color: '#fff',
    },
    listContainer: {
        paddingTop: 8,
    },
    listHeader: {
        fontSize: 14,
        color: '#4B5563', // Gray-600
        marginBottom: 12,
    },
    itemButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Gray-50
        padding: 16,
        borderRadius: 8,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#04810dff',
    },
    itemText: {
        fontSize: 13,
        color: '#1F2937', // Gray-800
        flex: 1,
    },
    itemSelectText: {
        color: '#04810dff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    userIdText: {
        marginTop: 20,
        fontSize: 10,
        color: '#9CA3AF', // Gray-400
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: '#e6f0ff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#080A6C',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#080A6C',
        marginBottom: 4,
    },
    infoItem: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    infoSubtitle: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 4,
    },
    label: {
        fontSize: 16,
        color: '#374151', // Gray-700
        fontWeight: '600',
        marginBottom: 4,
        marginTop: 12,
    },
    input: {
        height: 48,
        backgroundColor: '#F3F4F6', // Gray-100
        borderRadius: 8,
        paddingTop: 15,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginBottom: 12,
    },
    inputDisabled: {
        backgroundColor: '#E5E7EB', // Gray-200
        color: '#6B7280', // Gray-500
        borderColor: '#9CA3AF',
    },
    profileHint: {
        fontSize: 12,
        color: '#080A6C',
        textAlign: 'left',
        width: '100%',
        marginBottom: 12,
    },
    textarea: {
        minHeight: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginBottom: 16,
        textAlignVertical: 'top', 
    },
    timeSlotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        marginTop: 8,
    },
    timeSlot: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: 'white',
    },
    timeSlotActive: {
        backgroundColor: '#FFB800',
        borderColor: '#FFB800',
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151', 
    },
    timeSlotTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#DC2626', // Red-600
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    finalizeButton: {
        height: 48,
        backgroundColor: '#080A6C',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    finalizeButtonDisabled: {
        backgroundColor: '#080A6C',
        opacity: 0.7,
    },
    finalizeButtonText: {
        color: '#fff',
        fontSize: 15,
    },
    backButton: {
        marginTop: 16,
        padding: 8,
        alignSelf: 'center',
    },
    backButtonText: {
        color: '#080A6C',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    confirmationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#080A6C',
        textAlign: 'center',
        marginBottom: 16,
    },
    confirmationSubtitle: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    confirmationHighlight: {
        fontWeight: 'bold',
        color: '#FFB800',
    },
    summaryBox: {
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981', // Green-500
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#080A6C',
    },
    loadingProfileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    loadingProfileText: {
        marginLeft: 8,
        color: '#080A6C',
        fontWeight: '600',
    },
});

export default App;
