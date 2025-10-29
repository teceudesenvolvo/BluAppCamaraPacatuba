import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, KeyboardAvoidingView, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

// Importações Firebase para o ambiente React (modular SDK)
import { AUTH, DB } from '../../firebaseConfig';
import { ref, onValue, push, set } from 'firebase/database';

// --- MOCKS DE DADOS ---
const MOCK_SERVICOS = [
    { id: 's1', nome: 'Atendimento Jurídico', collection: 'atendimento-juridico' },
    { id: 's2', nome: 'Balcão do Cidadão' },
    { id: 's3', nome: 'Ouvidoria Municipal', collection: 'ouvidoria' },
];

// --- OPÇÕES PARA OS SELECTS DOS NOVOS FORMULÁRIOS ---
const ASSUNTOS_JURIDICO = ['Direito Familiar', 'Questões de Vizinhança', 'Regularização de Imóveis', 'Outros'];
const ASSUNTOS_BALCAO = ['Informações gerais', 'Solicitação de Documentos', 'Agendamento', 'Outros'];
const TIPOS_MANIFESTACAO_OUVIDORIA = ['Reclamação', 'Sugestão', 'Denúncia', 'Elogio', 'Crítica', 'Outros'];
const IDENTIFICACAO_OUVIDORIA = ['Identificar-se', 'Anônimo'];


// --- FORMULÁRIO GENÉRICO ---
const initialFormData = {
    // Atendimento Jurídico
    sobreAcontecimento: '', dataAcontecimento: '', cep: '', endereco: '', numero: '', bairro: '', cidade: '', assuntoJuridico: '', descricaoCaso: '',
    // Balcão do Cidadão
    assuntoBalcao: '', descricaoSolicitacao: '',
    // Ouvidoria
    tipoManifestacao: '', identificacao: 'Identificar-se', assuntoOuvidoria: '', descricaoNotificacao: '', dataFato: '', localFato: '', envolvidos: '', anexoUrls: [],
    // Agendamento Vereador
    assuntoVereador: '', horarioPreferencial: '', descricaoSolicitacaoVereador: '',
};

const HORARIOS_PREFERENCIAIS = [
    'Manhã 08:00 - 12:00',
    'Tarde 13:00 - 14:00'
];

const applyDateMask = (value) => {
    if (!value) return '';
    let clean = value.replace(/\D/g, '').slice(0, 8);
  
    if (clean.length > 4) {
      clean = clean.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    } else if (clean.length > 2) {
      clean = clean.replace(/(\d{2})(\d{0,2})/, '$1/$2');
    }
  
    return clean;
};

// --- SUB-COMPONENTES DE FORMULÁRIO (Movidos para fora para evitar re-renderização) ---

const FormAtendimentoJuridico = ({ formData, handleFormChange, openDropdown, setOpenDropdown }) => (
    <>
        <Text style={styles.label}>Sobre o acontecimento</Text>
        <TextInput style={styles.input} value={formData.sobreAcontecimento} onChangeText={text => handleFormChange('sobreAcontecimento', text)} />
        <Text style={styles.label}>Data do Acontecimento</Text>
        <TextInput 
            style={styles.input} 
            placeholder="DD/MM/AAAA" 
            value={formData.dataAcontecimento} 
            onChangeText={text => handleFormChange('dataAcontecimento', applyDateMask(text))} 
            keyboardType="numeric"
            maxLength={10}
        />
        <Text style={styles.label}>CEP do local</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={formData.cep} onChangeText={text => handleFormChange('cep', text)} />
        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={formData.endereco} onChangeText={text => handleFormChange('endereco', text)} />
        <Text style={styles.label}>Número</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={formData.numero} onChangeText={text => handleFormChange('numero', text)} />
        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} value={formData.bairro} onChangeText={text => handleFormChange('bairro', text)} />
        <Text style={styles.label}>Cidade</Text>
        <TextInput style={styles.input} value={formData.cidade} onChangeText={text => handleFormChange('cidade', text)} />
        
        <DropdownSimulado label="Assunto" id="assuntoJuridico" options={ASSUNTOS_JURIDICO} value={formData.assuntoJuridico} onChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />

        <Text style={styles.label}>Descreva seu caso</Text>
        <TextInput style={styles.textarea} multiline value={formData.descricaoCaso} onChangeText={text => handleFormChange('descricaoCaso', text)} />
    </>
);

const FormBalcaoCidadao = ({ formData, handleFormChange, openDropdown, setOpenDropdown }) => (
    <>
        <DropdownSimulado label="Assunto" id="assuntoBalcao" options={ASSUNTOS_BALCAO} value={formData.assuntoBalcao} onChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />
        <Text style={styles.label}>Descreva sua solicitação</Text>
        <TextInput style={styles.textarea} multiline value={formData.descricaoSolicitacao} onChangeText={text => handleFormChange('descricaoSolicitacao', text)} />
    </>
);

const FormOuvidoria = ({ formData, handleFormChange, openDropdown, setOpenDropdown, anexos, pickImage, setAnexos }) => (
    <>
        <DropdownSimulado label="Tipo de Manifestação" id="tipoManifestacao" options={TIPOS_MANIFESTACAO_OUVIDORIA} value={formData.tipoManifestacao} onChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />
        <DropdownSimulado label="Identificação" id="identificacao" options={IDENTIFICACAO_OUVIDORIA} value={formData.identificacao} onChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />
        
        <Text style={styles.label}>Assunto</Text>
        <TextInput style={styles.input} value={formData.assuntoOuvidoria} onChangeText={text => handleFormChange('assuntoOuvidoria', text)} />
        
        <Text style={styles.label}>Descrição detalhada da notificação</Text>
        <TextInput style={styles.textarea} multiline value={formData.descricaoNotificacao} onChangeText={text => handleFormChange('descricaoNotificacao', text)} />
        
        <Text style={styles.label}>Data do fato</Text>
        <TextInput 
            style={styles.input} 
            placeholder="DD/MM/AAAA" 
            value={formData.dataFato} 
            onChangeText={text => handleFormChange('dataFato', applyDateMask(text))} 
            keyboardType="numeric"
            maxLength={10} />
        
        <Text style={styles.label}>Local do Fato</Text>
        <TextInput style={styles.input} value={formData.localFato} onChangeText={text => handleFormChange('localFato', text)} />
        
        <Text style={styles.label}>Pessoas ou setores envolvidos</Text>
        <TextInput style={styles.input} value={formData.envolvidos} onChangeText={text => handleFormChange('envolvidos', text)} />

        <Text style={styles.label}>Anexar Arquivos (máx. 3)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Icon name="attach-file" size={20} color="#080A6C" />
            <Text style={styles.uploadButtonText}>Selecionar Imagem (PDF, PNG, JPG)</Text>
        </TouchableOpacity>
        <View style={styles.anexosContainer}>
            {anexos.map((anexo, index) => (
                <View key={index} style={styles.anexoItem}>
                    <Text style={styles.anexoText} numberOfLines={1}>{anexo.fileName || `imagem_${index + 1}.jpg`}</Text>
                    <TouchableOpacity onPress={() => setAnexos(prev => prev.filter((_, i) => i !== index))}>
                        <Icon name="close" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    </>
);

const FormAgendamentoVereador = ({ formData, handleFormChange, dataSelecionada, setDataSelecionada, datasDisponiveis, showDataPicker, setShowDataPicker, openDropdown, setOpenDropdown }) => (
    <>
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

        <DropdownSimulado label="Horário Preferencial" id="horarioPreferencial" options={HORARIOS_PREFERENCIAIS} value={formData.horarioPreferencial} onChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />

        <Text style={styles.label}>Descrição da Solicitação</Text>
        <TextInput
            style={styles.textarea}
            placeholder="Breve descrição do motivo do agendamento"
            value={formData.descricaoSolicitacaoVereador}
            onChangeText={text => handleFormChange('descricaoSolicitacaoVereador', text)}
            multiline
            numberOfLines={4}
        />
    </>
);

// --- COMPONENTE PRINCIPAL ---
const App = ({ navigation }) => {
    const goBack = useCallback(() => {
        if (navigation && navigation.goBack) {
            navigation.goBack();
        } else {
            console.log("App: Navegação de retorno simulada.");
        }
    }, [navigation]);
    // --- ESTADOS DO FIREBASE ---
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // --- ESTADOS DO APLICATIVO ---
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Dados do formulário
    const [time, setTime] = useState(null);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    
    // Novo estado para formulários dinâmicos
    const [formData, setFormData] = useState(initialFormData);
    const [anexos, setAnexos] = useState([]); // Para arquivos da ouvidoria

    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [error, setError] = useState('');

    const [userProfile, setUserProfile] = useState(null); // Estado para guardar o perfil completo
    // --- ESTADO DINÂMICO DE VEREADORES ---
    const [vereadores, setVereadores] = useState([]);
    const [vereadoresLoading, setVereadoresLoading] = useState(false);
    const [vereadoresError, setVereadoresError] = useState('');

    // Adicione um estado para as datas disponíveis
    const [datasDisponiveis, setDatasDisponiveis] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState('');
    const [showDataPicker, setShowDataPicker] = useState(false);
    
    // Estado para dropdowns dinâmicos
    const [openDropdown, setOpenDropdown] = useState(null);

    // --- 1. SETUP FIREBASE E AUTENTICAÇÃO (USANDO firebaseConfig.js) ---
    useEffect(() => {
        setIsAuthReady(true); // Considera pronto, pois AUTH e DB já estão configurados
        // Captura o userId do usuário autenticado
        if (AUTH && AUTH.currentUser && AUTH.currentUser.uid) {
            setUserId(AUTH.currentUser.uid);
        }
    }, []);

    // Buscar dados do usuário no Realtime Database (modelo Perfil.js)
    useEffect(() => {
        setProfileLoading(true);
        const user = AUTH?.currentUser;
        if (!user || !DB) {
            setProfileLoading(false);
            return;
        }
        setUserId(user.uid);
        setIsAuthReady(true);
        const userRef = ref(DB, `users/${user.uid}`);
        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setNome(data.name || '');
                setUserProfile(data); // Salva o perfil completo
                setTelefone(data.phone || '');
            } else {
                setNome('');
                setTelefone('');
            }
            setProfileLoading(false);
        }, (error) => {
            console.error('Erro ao buscar dados do usuário no RTDB:', error);
            setProfileLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- CARREGAMENTO DINÂMICO DOS VEREADORES ---
    useEffect(() => {
        if (mode === 'VEREADOR') {
            setVereadoresLoading(true);
            setVereadoresError('');
            const usersRef = ref(DB, 'users');
            const unsubscribe = onValue(usersRef, (snapshot) => {
                const usersData = snapshot.val();
                if (usersData) {
                    const vereadoresList = Object.keys(usersData)
                        .map(key => ({ id: key, ...usersData[key] }))
                        .filter(user => user.tipo === 'Vereador');
                    setVereadores(vereadoresList);
                }
                setVereadoresLoading(false);
            }, (error) => {
                setVereadoresError('Erro ao carregar vereadores. Tente novamente.');
                console.error(error);
                setVereadoresLoading(false);
            });
            return () => unsubscribe();
        }
    }, [mode]);

    // Gere as datas disponíveis para o mês atual (sem sex, sab, dom)
    useEffect(() => {
        const hoje = new Date();
        const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const datas = [];
        let dia = new Date(hoje);

        while (dia <= ultimoDiaDoMes) {
            const diaDaSemana = dia.getDay();
            if (diaDaSemana >= 1 && diaDaSemana <= 4) { // 1=Segunda, 4=Quinta
                // Formato ISO para o value, e pt-BR para o label
                const value = dia.toISOString().split('T')[0];
                const label = dia.toLocaleDateString('pt-BR');
                datas.push({ value, label });
            }
            dia.setDate(dia.getDate() + 1);
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

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        if (anexos.length >= 3) {
            Alert.alert("Limite atingido", "Você pode anexar no máximo 3 arquivos.");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const file = result.assets[0];
            if (file.fileSize > 2 * 1024 * 1024) { // 2MB
                Alert.alert("Arquivo muito grande", "O arquivo deve ter no máximo 2MB.");
                return;
            }
            setAnexos(prev => [...prev, file]);
        }
    };

    const handleFinalizeScheduling = async () => {
        setLoading(true);
        setError('');

        const user = AUTH.currentUser;
        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
            setLoading(false);
            return;
        }

        let submissionData = {
            userId: user.uid,
            email: user.email,
            nome: nome,
            telefone: telefone,
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };
        let collectionName;

        if (mode === 'VEREADOR') {
            if (!nome || !telefone || !dataSelecionada || !formData.horarioPreferencial || !formData.descricaoSolicitacaoVereador) {
                Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos.');
                setLoading(false);
                return;
            }
            // Estrutura para Vereadores
            submissionData = {
                dadosSolicitacao: {
                    assunto: formData.assuntoVereador,
                    dataPreferencial: datasDisponiveis.find(d => d.value === dataSelecionada)?.label || dataSelecionada,
                    descricao: formData.descricaoSolicitacaoVereador,
                    horarioPreferencial: formData.horarioPreferencial,
                    tipoAtendimento: "Presencial", // Valor padrão
                    vereadorId: selectedItem?.id,
                    vereadorNome: selectedItem?.nome,
                },
                dadosUsuario: {
                    email: user.email,
                    id: user.uid,
                    name: nome,
                },
                dataSolicitacao: Date.now(),
                status: 'Pendente',
                userId: user.uid,
            };
            collectionName = 'solicitacoes-vereadores';
        } else if (selectedItem?.id === 's1') { // Atendimento Jurídico
            // Estrutura de dados corrigida para Atendimento Jurídico
            collectionName = 'atendimento-juridico';
            submissionData = {
                dadosAcontecimento: {
                    assunto: formData.assuntoJuridico,
                    bairroAcontecimento: formData.bairro,
                    cepAcontecimento: formData.cep,
                    cidadeAcontecimento: formData.cidade,
                    dataAcontecimento: formData.dataAcontecimento,
                    descricao: formData.descricaoCaso,
                    enderecoAcontecimento: formData.endereco,
                    numeroAcontecimento: formData.numero,
                },
                dadosUsuario: {
                    ...userProfile, // Inclui todos os dados do perfil do usuário
                    id: user.uid,
                    email: user.email,
                    name: nome,
                    phone: telefone,
                },
                dataSolicitacao: Date.now(),
                status: 'Pendente',
                messages: {}, // Inicia sem mensagens
            };
        } else if (selectedItem?.id === 's2') { // Balcão do Cidadão
            // Estrutura para Balcão do Cidadão
            collectionName = 'balcao-cidadao';
            submissionData = {
                dadosSolicitacao: {
                    assunto: formData.assuntoBalcao,
                    descricao: formData.descricaoSolicitacao,
                },
                dadosUsuario: {
                    ...userProfile,
                    id: user.uid,
                    email: user.email,
                    name: nome,
                    phone: telefone,
                },
                dataSolicitacao: Date.now(),
                status: 'Em Análise',
                userId: user.uid,
            };
        } else if (selectedItem?.id === 's3') { // Ouvidoria
            collectionName = 'ouvidoria';
            if (formData.identificacao === 'Anônimo') {
                submissionData.nome = 'Anônimo';
                submissionData.email = 'Anônimo';
                submissionData.telefone = 'Anônimo';
                submissionData.userId = 'Anônimo';
            }

            // Estrutura para Ouvidoria
            submissionData = {
                dadosManifestacao: {
                    assunto: formData.assuntoOuvidoria,
                    dataFato: formData.dataFato,
                    descricao: formData.descricaoNotificacao,
                    envolvidos: formData.envolvidos,
                    identificacao: formData.identificacao === 'Identificar-se' ? 'identificado' : 'anonimo',
                    localFato: formData.localFato,
                    tipoManifestacao: formData.tipoManifestacao,
                },
                dadosUsuario: {
                    ...userProfile,
                    id: user.uid,
                    email: user.email,
                    name: nome,
                    phone: telefone,
                    identificacao: formData.identificacao === 'Identificar-se' ? 'Identificado' : 'Anônimo',
                },
                dataManifestacao: Date.now(),
                status: 'Recebida',
                userId: user.uid,
                anexoUrls: [], // Será preenchido abaixo
            }

            // Upload de anexos
            const anexoUrls = [];
            if (anexos.length > 0) {
                const storage = getStorage();
                for (const anexo of anexos) {
                    const fileRef = storageRef(storage, `ouvidoria/${user.uid || 'anon'}/${Date.now()}_${anexo.fileName}`);
                    const base64String = anexo.base64;
                    await uploadString(fileRef, `data:image/jpeg;base64,${base64String}`, 'data_url');
                    const downloadUrl = await getDownloadURL(fileRef);
                    anexoUrls.push(downloadUrl);
                }
            }
            submissionData.anexoUrls = anexoUrls;
        }

        try {
            const dbRef = ref(DB, collectionName);
            const newItemRef = push(dbRef);
            await set(newItemRef, submissionData);
            setLoading(false);
            setStep(3);
        } catch (error) {
            console.error("Erro ao salvar: ", error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar. Tente novamente.');
            setLoading(false);
        }
    };

    const handleNewScheduling = () => {
        setStep(1);
        setMode(null);
        setSelectedItem(null);
        setTime(null);
        setFormData(initialFormData);
        setAnexos([]);
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
                                    onPress={() => handleSelectItem(
                                        { id: item.id, nome: item.name }, // Ajustado para 'name' do user object
                                        mode
                                    )}
                                >
                                    <Text style={styles.itemText}>{item.name}</Text>
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
                </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    const renderFormForSelection = () => {
        if (mode === 'VEREADOR') {
            return <FormAgendamentoVereador 
                formData={formData} handleFormChange={handleFormChange}
                dataSelecionada={dataSelecionada} setDataSelecionada={setDataSelecionada}
                datasDisponiveis={datasDisponiveis} showDataPicker={showDataPicker} setShowDataPicker={setShowDataPicker}
                openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            />;
        }
        switch (selectedItem?.id) {
            case 's1': // Atendimento Jurídico
                return <FormAtendimentoJuridico formData={formData} handleFormChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />;
            case 's2': // Balcão do Cidadão
                return <FormBalcaoCidadao formData={formData} handleFormChange={handleFormChange} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />;
            case 's3': // Ouvidoria
                return <FormOuvidoria 
                    formData={formData} handleFormChange={handleFormChange} 
                    openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
                    anexos={anexos} pickImage={pickImage} setAnexos={setAnexos}
                />;
            default:
                return <Text>Selecione um serviço.</Text>;
        }
    };


    // Etapa 2: Detalhes do Agendamento
    const renderStepTwo = () => (
        <View style={styles.card}>
            <Text style={styles.headerText}>2. Detalhes da Solicitação</Text>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Serviço Selecionado:</Text>
                <Text style={styles.infoItem}>{selectedItem?.nome}</Text>
                <Text style={styles.infoSubtitle}>Tipo: {mode === 'VEREADOR' ? 'Gabinete do Vereador' : 'Serviço Público'}</Text>
            </View>

            {renderFormForSelection()}

            {profileLoading ? (
                <View style={styles.loadingProfileContainer}>
                    <ActivityIndicator size="small" color="#080A6C" />
                    <Text style={styles.loadingProfileText}>Carregando dados do perfil...</Text>
                </View>
            ) : (
                formData.identificacao !== 'Anônimo' && (
                    <>
                        <Text style={styles.label}>Nome (do seu perfil)</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            placeholder="Nome"
                            value={nome}
                            editable={false}
                        />

                        <Text style={styles.label}>Telefone / WhatsApp (do seu perfil)</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            placeholder="(00) 99999-9999"
                            value={telefone}
                            editable={false}
                        />
                    </>
                )
            )}

            

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
                style={[styles.finalizeButton, (loading || profileLoading) && styles.finalizeButtonDisabled]}
                onPress={handleFinalizeScheduling}
                disabled={loading || profileLoading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#080A6C" />
                ) : (
                    <Text style={styles.finalizeButtonText}>Confirmar Solicitação</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} style={styles.backButtonTextContainer}>
                <Text style={styles.backButtonText}>&larr; Voltar para a Seleção</Text>
            </TouchableOpacity>
        </View>
    );

    // Etapa 3: Confirmação
    const renderStepThree = () => (
        <View style={styles.card}>
            <Text style={styles.confirmationTitle}>Solicitação Enviada com Sucesso!</Text>
            <Text style={styles.confirmationSubtitle}>
                Sua solicitação para <Text style={styles.confirmationHighlight}>{selectedItem?.nome}</Text> foi registrada.
                Aguarde a confirmação e detalhes finais via telefone ou e-mail.
            </Text>

            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Detalhes:</Text>
                {mode === 'VEREADOR' && <Text style={styles.summaryText}>&bull; Data: {datasDisponiveis.find(d => d.value === dataSelecionada)?.label} - {formData.horarioPreferencial}</Text>}
                <Text style={styles.summaryText}>&bull; Assunto: {formData.assuntoVereador || formData.assuntoBalcao || formData.assuntoJuridico || formData.assuntoOuvidoria}</Text>
                {formData.identificacao !== 'Anônimo' && <Text style={styles.summaryText}>&bull; Contato: {telefone} (<Text style={{ fontWeight: 'bold' }}>{nome}</Text>)</Text>}
            </View>

            <TouchableOpacity
                style={styles.finalizeButton}
                onPress={handleNewScheduling}
            >
                <Text style={styles.finalizeButtonText}>Fazer Nova Solicitação</Text>
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Botão de voltar */}
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={goBack}>
                        <Icon name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.mainTitle}>Serviços</Text>
                </View>
                <View style={styles.contentWrapper}>
                    {renderContent()}
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
};

// Componente Dropdown Simulado para manter a UI consistente
const DropdownSimulado = React.memo(({ label, placeholder, options, value, onChange, id, openDropdown, setOpenDropdown }) => {
    const isOpen = openDropdown === id;
  
    const handlePress = () => {
      setOpenDropdown(isOpen ? null : id);
    };
  
    const handleSelect = (option) => {
      onChange(id, option);
      setOpenDropdown(null);
    };
  
    return (
      <View style={[styles.inputGroupDropdown, isOpen && { zIndex: 100 }]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.dropdownContainer, isOpen && styles.dropdownOpen]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownInput, value ? styles.dropdownSelectedText : styles.dropdownPlaceholderText]}>
            {value || placeholder || 'Selecione...'}
          </Text>
          <Icon name={isOpen ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#6B7280" />
        </TouchableOpacity>
  
        {isOpen && (
          <View style={styles.dropdownOptionsList}>
            <ScrollView style={{ maxHeight: 180 }}>
              {options.map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOptionItem}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  });


// --- ESTILOS REACT NATIVE ---
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F3F4F6', // light gray background
    },
    header: {
        width: '100%',
        paddingVertical: 20,
        paddingHorizontal: 16, 
        paddingTop: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 4,
        textAlign: `center`,
    },
    subTitle: {
        fontSize: 16,
        textAlign: `center`,
        color: '#1f1f1f', // Accent Yellow
    },
    contentWrapper: {
        padding: 20,
        alignItems: 'center',
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
        paddingTop: 0,
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
        paddingTop: -15,
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
        position: 'absolute',
        top: 50,
        left: 16,
        padding: 8,
        borderRadius: 8,
        zIndex: 10,
    },
    backButtonTextContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#ff9100ff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    backButtonAbsolute: {
        position: 'absolute',
        top: 48,
        left: 16,
        zIndex: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 6,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
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
    // Estilos para Dropdown Simulado
    inputGroupDropdown: {
        marginBottom: 16,
        zIndex: 1, // Padrão
    },
    dropdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        height: 48,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
    },
    dropdownOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderColor: '#080A6C',
    },
    dropdownInput: {
        fontSize: 16,
        flex: 1,
    },
    dropdownSelectedText: {
        color: '#1F2937',
    },
    dropdownPlaceholderText: {
        color: '#9CA3AF',
    },
    dropdownOptionsList: {
        position: 'absolute',
        top: 72, // Ajuste para label + input
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#080A6C',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    dropdownOptionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#1F2937',
    },
    // Estilos para Upload de Arquivos
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F0FF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#080A6C',
        borderStyle: 'dashed',
        justifyContent: 'center',
        marginBottom: 8,
    },
    uploadButtonText: {
        marginLeft: 8,
        color: '#080A6C',
        fontWeight: '600',
    },
    anexosContainer: { marginTop: 8 },
    anexoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 6, marginBottom: 4 },
    anexoText: {
        color: '#374151',
        flex: 1,
    },
});

export default App;
