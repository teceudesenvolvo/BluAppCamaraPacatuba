import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
  Dimensions, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection } from 'firebase/firestore';
import { DB, AUTH } from '../../firebaseConfig';


// --- MÁSCARA DE DATA (DD/MM/AAAA) ---
function applyDateMask(value) {
  if (!value) return '';
  let clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 4) {
    clean = clean.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
  } else if (clean.length > 2) {
    clean = clean.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  }
  return clean;
}

// --- MÁSCARA DE CNPJ ---
const applyCNPJMask = (value) => {
  if (!value) return value;
  let clean = value.replace(/\D/g, '').substring(0, 14);
  if (clean.length > 12) {
    clean = clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, '$1.$2.$3/$4-$5');
  } else if (clean.length > 8) {
    clean = clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4');
  } else if (clean.length > 5) {
    clean = clean.replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  } else if (clean.length > 2) {
    clean = clean.replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
  }
  return clean;
};

// --- CONSTANTES DE DADOS (MOCK) ---
const RECLAMACAO_OPTIONS = ["Problemas com Contrato", "Cobrança Indevida", "Má Qualidade do Serviço", "Atendimento e Suporte"];
const ASSUNTO_OPTIONS = ["Internet", "Telefonia Móvel", "TV por Assinatura", "Financeiro", "Eletrodomésticos"];
const RESOLVER_OPTIONS = ["Sim, resolveu parcialmente", "Sim, mas não resolveu", "Não, não procurei"];
const AQUISICAO_OPTIONS = ["Loja Física", "Telefone", "Internet (E-commerce)", "Representante Autorizado", "Porta a Porta"];
const CONTRATACAO_OPTIONS = ["Novo Contrato", "Portabilidade", "Renovação", "Alteração de Plano"];
const DOCUMENTO_OPTIONS = ["Nota Fiscal", "Ordem de Serviço", "Contrato", "Fatura", "Comprovante de Pagamento"];
const PAGAMENTO_OPTIONS = ["Cartão de Crédito", "Boleto Bancário", "Débito em Conta", "Pix", "Transferência"];
const PEDIDO_OPTIONS = ["Cancelamento do Contrato", "Ressarcimento de Valor", "Execução do Serviço", "Reparo Técnico", "Outros"];

const { width } = Dimensions.get('window');
const MAX_WIDTH = 600;


// ---------------------------------------------------
// COMPONENTE AUXILIAR: DropdownSimulado (Memoizado)
// ---------------------------------------------------
const DropdownSimulado = React.memo(({ label, placeholder, options, value, onChange, id, openDropdown, setOpenDropdown }) => {
  const isOpen = openDropdown === id;

  const handlePress = () => {
    // Fecha qualquer dropdown aberto ou abre este
    setOpenDropdown(isOpen ? null : id);
  };

  const handleSelect = (option) => {
    // Usa a prop 'onChange' estável para atualizar o estado do formulário pai
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
          {value || placeholder}
        </Text>
        <Icon name={isOpen ? 'arrow-drop-up' : 'arrow-drop-down'} size={24} color="#6B7280" />
      </TouchableOpacity>

      {/* Lista de Opções Condicional */}
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


// ---------------------------------------------------
// COMPONENTE AUXILIAR: FormField (Memoizado e Corrigido contra Recursão)
// ---------------------------------------------------
const FormField = React.memo(({ label, id, placeholder, multiline = false, type = 'text', maxLength, value, onChange: propOnChange }) => {
  let inputProps = {};
  let displayValue = value;
  let onBlur = undefined;
  
  // Handler padrão: chama a prop estável para atualizar o estado no componente App
  let onChangeHandler = text => propOnChange(id, text);

  if (type === 'date') {
    inputProps.placeholder = placeholder || 'DD/MM/AAAA';
    inputProps.keyboardType = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';
    
    // Handler para digitar (aplica apenas filtro numérico)
    onChangeHandler = text => propOnChange(id, text.replace(/\D/g, '').slice(0, 8));
    
    // Handler para perder o foco (aplica a máscara completa)
    onBlur = () => propOnChange(id, applyDateMask(value));
    
    maxLength = 10;

  } else if (type === 'number' || id === 'valorCompra') {
    if (id === 'valorCompra') {
      
      // Handler para digitar (corrige a recursão)
      onChangeHandler = text => {
        let clean = text.replace(/\D/g, '').slice(0, 8);
        propOnChange(id, clean); // CORRIGIDO: Chama a prop estável, não a si mesmo.
      };

      // Handler para perder o foco (aplica a máscara de moeda)
      onBlur = () => {
        if (value) {
          // Garante que 'value' é um número antes de formatar
          const cleanValue = parseInt(String(value).replace(/\D/g, ''), 10);
          if (isNaN(cleanValue)) {
            propOnChange(id, '');
            return;
          }
          const masked = (cleanValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          propOnChange(id, masked);
        }
      };
      
      // Limpa o valor formatado ao focar para permitir edição
      inputProps.onFocus = () => {
         if (typeof value === 'string' && value.includes('R$')) {
            const clean = String(value).replace(/[^0-9]/g, ''); // Mantém apenas números (ex: 10000 -> 100.00)
            propOnChange(id, clean.slice(0, 8));
         }
      };

      // Quando o valor está mascarado, o 'displayValue' precisa ser o valor do estado.
      displayValue = value;
      inputProps.keyboardType = 'numeric';
      inputProps.placeholder = placeholder || 'R$ 0,00';
    } else {
      inputProps.keyboardType = 'numeric';
    }
  } 
  // Se 'type' for 'text' ou outros, usa o 'onChangeHandler' padrão.

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={multiline ? styles.textarea : styles.input}
        value={displayValue}
        onChangeText={onChangeHandler} // Usa o handler correto
        onBlur={onBlur}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={maxLength}
        {...inputProps}
      />
    </View>
  );
});


// ---------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------
const App = ({ navigation }) => {
  console.log("App: Componente App iniciando renderização.");

  // --- ESTADO PARA CONTROLAR A ETAPA DO FORMULÁRIO ---
  const [step, setStep] = useState(1);

  // --- HANDLER ESTÁVEL PARA MUDANÇAS NO FORMULÁRIO (CHAVE PARA A ESTABILIDADE) ---
  const handleFormChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []); 

  // --- ESTADOS ---

  const goBack = useCallback(() => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    } else {
      console.log("App: Navegação de retorno simulada.");
    }
  }, [navigation]);

  const [cnpj, setCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isNameEditable, setIsNameEditable] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState({ text: '', type: 'info' });
  const [areaAtuacaoOptions, setAreaAtuacaoOptions] = useState([]);

  const [openDropdown, setOpenDropdown] = useState(null); // Estado para controlar qual dropdown está aberto

  // --- ESTADO PARA ARMAZENAR OS ARQUIVOS ---
  const [files, setFiles] = useState({
    comprovantePagamento: null,
    notaFiscal: null,
    contrato: null,
    reciboPagamento: null,
  });

  // Estados do Formulário
  const [formData, setFormData] = useState({
    tipoReclamacao: '',
    areaAtuacao: '',
    assuntoDenuncia: '',
    fornecedorResolver: '',
    formaAquisicao: '',
    tipoContratacao: '',
    dataContratacao: '',
    nomeServico: '',
    detalhesServico: '',
    tipoDocumento: '',
    numeroDocumento: '',
    dataOcorrencia: '',
    dataCancelamento: '',
    formaPagamento: '',
    valorCompra: '',
    descricao: '',
    pedidoConsumidor: '',
  });

  // ---------------------------------------------------
  // MANIPULADORES DE ESTADO E VALIDAÇÃO
  // ---------------------------------------------------

  const handleCNPJChange = (text) => {
    const maskedText = applyCNPJMask(text);
    setCnpj(maskedText);
    setCompanyName('');
    setCnpjMessage({ text: '', type: 'info' });
    setIsNameEditable(false);
  };

  const isCNPJValid = cnpj.replace(/\D/g, '').length === 14;

  const searchCNPJ = useCallback(async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14 || isSearching) return;

    setIsSearching(true);
    setCnpjMessage({ text: 'Buscando informações da empresa...', type: 'info' });
    setCompanyName('');
    setIsNameEditable(false);
    setAreaAtuacaoOptions([]);

    const apiUrl = `https://open.cnpja.com/office/${cleanCNPJ}`;
    const MAX_RETRIES = 3;
    let attempts = 0;
    let finished = false;

    while (attempts < MAX_RETRIES && !finished) {
      if (attempts > 0) {
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.status === 404) {
          setCompanyName('');
          setIsNameEditable(true);
          setCnpjMessage({ text: 'CNPJ não encontrado. Verifique o número.', type: 'error' });
          finished = true;
          break;
        }

        if (!response.ok) {
          if ((response.status >= 500 && response.status < 600) || response.status === 429) {
            attempts++;
            setCnpjMessage({ text: `Erro temporário (Status: ${response.status}). Tentando novamente...`, type: 'info' });
            continue;
          }
          let errorMsg = `Erro de comunicação (Status: ${response.status}).`;
          try {
            const errData = await response.json();
            if (errData && errData.mensagem) errorMsg = errData.mensagem;
          } catch { }
          setCompanyName('');
          setIsNameEditable(true);
          setCnpjMessage({ text: errorMsg, type: 'error' });
          finished = true;
          break;
        }

        let data;
        try {
          data = await response.json();
        } catch {
          setCompanyName('');
          setIsNameEditable(true);
          setCnpjMessage({ text: 'Resposta inválida do servidor.', type: 'error' });
          finished = true;
          break;
        }

        // Extração de dados (Simulada para UI)
        let foundName = data.company?.name || data.razao_social || data.nome_empresarial || data.nome || '';
        let mainActivity = data.mainActivity?.text || '';

        let sideActivities = [];
        if (Array.isArray(data.sideActivities)) {
          sideActivities = data.sideActivities
            .map(act => typeof act.text === 'string' ? act.text : null)
            .filter(Boolean);
        }
        setAreaAtuacaoOptions(sideActivities);

        if (foundName) {
          setCompanyName(foundName.toUpperCase());
          setIsNameEditable(false);
          setCnpjMessage({ text: 'Empresa encontrada e nome preenchido automaticamente! ✔️', type: 'success' });
        } else {
          setCompanyName('');
          setIsNameEditable(true);
          setCnpjMessage({ text: 'CNPJ válido, mas o nome completo não foi retornado. Por favor, insira manualmente.', type: 'error' });
        }

        handleFormChange('areaAtuacao', mainActivity);
        finished = true;

      } catch (error) {
        console.error('App: Erro ao buscar CNPJ:', error);
        if (attempts < MAX_RETRIES - 1) {
          attempts++;
          setCnpjMessage({ text: `Erro de rede: tentativa ${attempts + 1}/${MAX_RETRIES}. Tentando novamente...`, type: 'info' });
          continue;
        }
        setCompanyName('');
        setIsNameEditable(true);
        setCnpjMessage({ text: error.message || 'Falha na comunicação. Insira o nome da empresa manualmente.', type: 'error' });
        finished = true;
      }
    }
    setIsSearching(false);
  }, [cnpj, isSearching, handleFormChange]);

  // --- FUNÇÃO PARA SELECIONAR ARQUIVOS ---
  const handleFilePick = async (fileType) => {
    // 1. Pedir permissão
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para anexar arquivos.');
      return;
    }

    // 2. Abrir o seletor de imagens
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reduz a qualidade para diminuir o tamanho do base64
      base64: true, // Pede para o picker já converter para base64
    });

    if (!result.canceled) {
      const fileInfo = {
        uri: result.assets[0].uri,
        name: result.assets[0].uri.split('/').pop(), // Pega o nome do arquivo da URI
        base64: result.assets[0].base64,
      };
      setFiles(prev => ({ ...prev, [fileType]: fileInfo }));
    }
  };

  const handleFormSubmit = async () => {
    const user = AUTH.currentUser;
    if (!user) {
      Alert.alert('Erro de Autenticação', 'Você precisa estar logado para enviar uma denúncia.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepara os arquivos para envio (apenas o base64)
      const filesBase64 = {
        comprovantePagamento: files.comprovantePagamento?.base64 || null,
        notaFiscal: files.notaFiscal?.base64 || null,
        contrato: files.contrato?.base64 || null,
        reciboPagamento: files.reciboPagamento?.base64 || null,
      };

      const denunciaData = {
        ...formData,
        cnpj,
        companyName,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date(),
        status: 'aberta',
        anexos: filesBase64, // Salva os anexos em base64
      };

      const docRef = await addDoc(collection(DB, "denuncias-procon"), denunciaData);

      Alert.alert(
        'Denúncia Enviada',
        'Sua denúncia foi registrada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      console.log("Document written with ID: ", docRef.id);

    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert('Erro ao Enviar', 'Ocorreu um erro ao registrar sua denúncia. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextStep = () => {
    if (!isCNPJValid || !companyName) {
      Alert.alert('Erro de Preenchimento', 'Preencha e valide o CNPJ e o Nome da Empresa Reclamada antes de prosseguir.');
      return;
    }
    setStep(2);
  };


  // ---------------------------------------------------
  // RENDERIZAÇÃO
  // ---------------------------------------------------

  /**
   * Função que calcula os estilos da mensagem.
   */
  const calculateMessageStyle = (message) => {
    const baseStyle = { padding: 10, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center' };

    if (!message || !message.type) {
      return { container: baseStyle, icon: '' };
    }

    switch (message.type) {
      case 'success':
        return { container: { ...baseStyle, backgroundColor: '#D1FAE5', borderLeftColor: '#10B981' }, icon: '✅' };
      case 'error':
        return { container: { ...baseStyle, backgroundColor: '#FEE2E2', borderLeftColor: '#DC2626' }, icon: '⚠️' };
      case 'info':
        return { container: { ...baseStyle, backgroundColor: '#BFDBFE', borderLeftColor: '#080A6C' }, icon: 'ℹ️' };
      default:
        return { container: baseStyle, icon: '' };
    }
  };

  const messageStyle = calculateMessageStyle(cnpjMessage);

  // --- COMPONENTE PARA CADA ITEM DE UPLOAD ---
  const FileUploadItem = ({ label, fileType }) => (
    <View style={styles.uploadItemContainer}>
      <Text style={styles.uploadLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleFilePick(fileType)}
      >
        <Icon name="attach-file" size={20} color="#080A6C" />
        <Text style={styles.uploadButtonText}>
          {files[fileType] ? 'Alterar' : 'Selecionar'}
        </Text>
      </TouchableOpacity>
      {files[fileType] && (
        <View style={styles.filePreview}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={styles.fileName} numberOfLines={1}>
            {files[fileType].name}
          </Text>
        </View>
      )}
    </View>
  );


  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      {/* BOTÃO DE VOLTAR (Volta uma etapa ou sai da tela) */}
      <TouchableOpacity style={styles.backButton} onPress={step === 2 ? () => setStep(1) : goBack}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      {/* HEADER: Título e Steps */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Realizar Reclamação</Text>
          {/* Steps Indicator */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <Text style={step === 1 ? styles.stepTextActive : styles.stepTextInactive}>1. Detalhes</Text>
              <View style={step === 1 ? styles.stepLineActive : styles.stepLineInactive} />
            </View>
            <View style={styles.stepSeparator} />
            <View style={styles.stepItem}>
              <Text style={step === 2 ? styles.stepTextActive : styles.stepTextInactive}>2. Anexos</Text>
              <View style={step === 2 ? styles.stepLineActive : styles.stepLineInactive} />
            </View>
          </View>
        </View>
      </View>

      {/* CONTEÚDO PRINCIPAL - CARD */}
      <View style={styles.card}>
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Informações da Empresa Reclamada</Text>

            {/* --- SEÇÃO CNPJ E BUSCA --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNPJ da Empresa Reclamada</Text>
              <View style={styles.cnpjInputContainer}>
                <TextInput
                  style={styles.cnpjInput}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  keyboardType='numeric'
                  value={cnpj}
                  onChangeText={handleCNPJChange}
                  editable={!isSearching}
                />
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    (!isCNPJValid || isSearching) && styles.searchButtonDisabled
                  ]}
                  onPress={searchCNPJ}
                  disabled={!isCNPJValid || isSearching}
                  activeOpacity={0.7}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color={'#080A6C'} />
                  ) : (
                    <Text style={styles.searchButtonText}>Buscar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Renderiza a mensagem de forma segura com o objeto de estilo garantido */}
            {cnpjMessage.text ? (
              <View style={messageStyle.container}>
                <Text style={styles.messageText}>
                  {messageStyle.icon} {cnpjMessage.text}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Empresa Reclamada</Text>
              <TextInput
                style={[styles.input, !isNameEditable && styles.inputDisabled]}
                placeholder="Razão Social Empresa"
                value={companyName}
                onChangeText={setCompanyName}
                editable={isNameEditable}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Detalhes da Ocorrência</Text>

            {/* --- CAMPOS DE FORMULÁRIO (Componentes de entrada estáveis) --- */}

            <DropdownSimulado
              label="Atividade Exercida"
              id="areaAtuacao"
              placeholder="Selecione..."
              options={areaAtuacaoOptions.length > 0 ? areaAtuacaoOptions : [formData.areaAtuacao].filter(Boolean)}
              value={formData.areaAtuacao}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <DropdownSimulado
              label="Tipo de Reclamação"
              id="tipoReclamacao"
              placeholder="Selecione..."
              options={RECLAMACAO_OPTIONS}
              value={formData.tipoReclamacao}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <DropdownSimulado
              label="Assunto da Denúncia"
              id="assuntoDenuncia"
              placeholder="Selecione..."
              options={ASSUNTO_OPTIONS}
              value={formData.assuntoDenuncia}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <DropdownSimulado
              label="Procurou o fornecedor?"
              id="fornecedorResolver"
              placeholder="Selecione..."
              options={RESOLVER_OPTIONS}
              value={formData.fornecedorResolver}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <DropdownSimulado
              label="Forma de Aquisição"
              id="formaAquisicao"
              placeholder="Selecione..."
              options={AQUISICAO_OPTIONS}
              value={formData.formaAquisicao}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <DropdownSimulado
              label="Tipo de Contratação"
              id="tipoContratacao"
              placeholder="Selecione..."
              options={CONTRATACAO_OPTIONS}
              value={formData.tipoContratacao}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            <FormField
              label="Data da Contratação"
              id="dataContratacao"
              type="date"
              value={formData.dataContratacao}
              onChange={handleFormChange}
            />
            <FormField
              label="Data da Ocorrência"
              id="dataOcorrencia"
              type="date"
              value={formData.dataOcorrencia}
              onChange={handleFormChange}
            />
            <FormField
              label="Data do Cancelamento"
              id="dataCancelamento"
              type="date"
              value={formData.dataCancelamento}
              onChange={handleFormChange}
            />

            <FormField
              label="Nome do Serviço ou Plano"
              id="nomeServico"
              placeholder="Ex: Internet Fibra 300MB"
              value={formData.nomeServico}
              onChange={handleFormChange}
            />
            <FormField
              label="Detalhes do Serviço ou Plano"
              id="detalhesServico"
              placeholder="Número do contrato, conta, etc."
              value={formData.detalhesServico}
              onChange={handleFormChange}
            />

            <DropdownSimulado
              label="Tipo de Documento"
              id="tipoDocumento"
              placeholder="Tipo"
              options={DOCUMENTO_OPTIONS}
              value={formData.tipoDocumento}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
            <FormField
              label="Número do documento"
              id="numeroDocumento"
              placeholder="Número"
              value={formData.numeroDocumento}
              onChange={handleFormChange}
            />
            <FormField
              label="Valor da Compra (R$)"
              id="valorCompra"
              type="number"
              value={formData.valorCompra}
              onChange={handleFormChange}
            />

            <DropdownSimulado
              label="Forma de Pagamento"
              id="formaPagamento"
              placeholder="Selecione..."
              options={PAGAMENTO_OPTIONS}
              value={formData.formaPagamento}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
            <DropdownSimulado
              label="Pedido do Consumidor"
              id="pedidoConsumidor"
              placeholder="Selecione..."
              options={PEDIDO_OPTIONS}
              value={formData.pedidoConsumidor}
              onChange={handleFormChange}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />

            {/* Descrição (Linha única) */}
            <FormField
              label="Descrição detalhada de sua reclamação (máximo 500 caracteres)"
              id="descricao"
              placeholder="Descreva o problema com o máximo de detalhes possível."
              multiline={true}
              maxLength={500}
              value={formData.descricao}
              onChange={handleFormChange}
            />

            {/* BOTÃO PRÓXIMA ETAPA */}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={goToNextStep}
              activeOpacity={0.9}
            >
              <Text style={styles.nextButtonText}>Próxima Etapa</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Anexar Documentos</Text>
            <Text style={styles.sectionSubtitle}>
              Anexe os documentos relevantes para a sua denúncia. Os arquivos serão enviados de forma segura.
            </Text>

            <FileUploadItem label="Comprovante de Pagamento" fileType="comprovantePagamento" />
            <FileUploadItem label="Nota Fiscal" fileType="notaFiscal" />
            <FileUploadItem label="Contrato" fileType="contrato" />
            <FileUploadItem label="Recibo de Pagamento" fileType="reciboPagamento" />

            {/* BOTÃO ENVIAR DENÚNCIA */}
            <TouchableOpacity
              style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
              onPress={handleFormSubmit}
              disabled={isSubmitting}
              activeOpacity={0.9}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Enviar Denúncia</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

// --- ESTILOS REACT NATIVE (Cores incorporadas) ---
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: '#F9FAFB', // Fundo levemente cinza
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 16,
    padding: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  header: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: 20,
  },
  headerContent: {
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    // Cor primária substituída por '#080A6C'
    color: '#080A6C',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepTextActive: {
    fontSize: 12,
    // Cor primária substituída por '#080A6C'
    color: '#080A6C',
    fontWeight: '700',
  },
  stepTextInactive: {
    fontSize: 12,
    color: '#6B7280',
  },
  stepLineActive: {
    height: 1,
    width: '100%',
    // Cor primária substituída por '#080A6C'
    backgroundColor: '#080A6C',
    borderRadius: 2,
    marginTop: 6,
  },
  stepLineInactive: {
    height: 1,
    width: '100%',
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginTop: 6,
  },
  stepSeparator: {
    height: 1,
    width: 10,
    backgroundColor: '#D1D5DB',
  },
  card: {
    width: width > MAX_WIDTH ? MAX_WIDTH : '95%',
    marginHorizontal: '2.5%',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // Cor primária substituída por '#080A6C'
    color: '#080A6C',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  // Estilos de container (ocupam 100% da largura na coluna única)
  inputGroup: {
    marginBottom: 16,
    flex: 1,
  },
  inputGroupDropdown: {
    marginBottom: 16,
    flex: 1,
    // zIndex definido dinamicamente
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  cnpjInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cnpjInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    height: '100%',
    backgroundColor: '#fff',
  },
  searchButton: {
    width: 100,
    // Cor do botão de busca (ACCENT_YELLOW) substituída por '#FCD34D'
    backgroundColor: '#FCD34D',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#D1D5DB',
  },
  searchButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  searchButtonText: {
    // Cor primária substituída por '#080A6C'
    color: '#080A6C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
    color: '#374151',
    flexShrink: 1, // Permite que o texto quebre a linha
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 20,
  },
  textarea: {
    height: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  // Estilos do Dropdown
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 48,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 2,
    // Cor primária substituída por '#080A6C'
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
    backgroundColor: '#fff',
    borderWidth: 1,
    // Cor primária substituída por '#080A6C'
    borderColor: '#080A6C',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    // Usando sombra nativa para elevação
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    position: 'absolute',
    top: 68, // Ajuste para ficar abaixo do input + label
    left: 0,
    right: 0,
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
  nextButton: {
    // Cor primária substituída por '#080A6C'
    backgroundColor: '#080A6C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#080A6C',
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- ESTILOS PARA UPLOAD ---
  uploadItemContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  uploadButtonText: {
    color: '#080A6C',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#EDFDF2',
    padding: 8,
    borderRadius: 6,
  },
  fileName: {
    marginLeft: 8,
    color: '#065F46',
    flexShrink: 1,
  },
});

export default App;
