import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../../firebaseConfig';
import { ref, push, set } from 'firebase/database';

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

const TIPOS_ATENDIMENTO_PROCURADORIA = [
    'Aconselhamento Jurídico',
    'Apoio Psicológico',
    'Denuncia de Violência',
    'Divorcio',
    'Solicitação de Medida Protetiva',
    'Outros'
];

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

const FormProcuradoriaScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        tipoAtendimento: '',
        assunto: '',
        dataFato: '',
        descricao: '',
        identificacao: 'identificado',
    });
    const [loading, setLoading] = useState(false);

    const [openDropdown, setOpenDropdown] = useState(null);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async () => {
        const user = AUTH.currentUser;
        if (!user) {
            Alert.alert("Erro", "Você precisa estar logado para enviar uma solicitação.");
            return;
        }

        if (!formData.tipoAtendimento || !formData.assunto || !formData.descricao) {
            Alert.alert("Campos Obrigatórios", "Por favor, preencha o tipo de atendimento, assunto e a descrição.");
            return;
        }

        setLoading(true);

        const submissionData = {
            dadosSolicitacao: {
                ...formData,
            },
            dadosUsuario: {
                id: user.uid,
                email: user.email,
                cpf: "Não informado", // Pode ser buscado do perfil se existir
            },
            status: 'Pendente',
            createdAt: new Date().toISOString(),
        };

        try {
            const dbRef = ref(DB, 'procuradoria-mulher');
            const newItemRef = push(dbRef);
            await set(newItemRef, submissionData);
            setLoading(false);
            Alert.alert("Sucesso", "Sua solicitação foi enviada com sucesso.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            setLoading(false);
            console.error("Erro ao salvar solicitação:", error);
            Alert.alert("Erro", "Não foi possível enviar sua solicitação. Tente novamente.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nova Solicitação</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <DropdownSimulado
                        label="Tipo de Atendimento"
                        id="tipoAtendimento"
                        options={TIPOS_ATENDIMENTO_PROCURADORIA}
                        value={formData.tipoAtendimento}
                        onChange={handleInputChange}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                        placeholder="Selecione o tipo de atendimento"
                    />

                    <Text style={styles.label}>Assunto</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.assunto}
                        onChangeText={(text) => handleInputChange('assunto', text)}
                        placeholder="Ex: Medida protetiva"
                    />

                    <Text style={styles.label}>Data do Fato (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.dataFato} // O valor já está mascarado pelo estado
                        onChangeText={(text) => handleInputChange('dataFato', applyDateMask(text))}
                        placeholder="DD/MM/AAAA"
                        keyboardType="numeric"
                        maxLength={10}
                    />

                    <Text style={styles.label}>Descrição do Caso</Text>
                    <TextInput
                        style={styles.textarea}
                        value={formData.descricao}
                        onChangeText={(text) => handleInputChange('descricao', text)}
                        placeholder="Descreva com detalhes o que aconteceu."
                        multiline
                    />

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9eaf9ff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
    backButton: { position: 'absolute', left: 20, top: 60 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 15 },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textarea: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        height: 120,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#b100a8',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
    },
    dropdownOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderColor: '#b100a8',
    },
    dropdownInput: {
        fontSize: 15,
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
        borderColor: '#b100a8',
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
        fontSize: 15,
        color: '#1F2937',
    },
});

export default FormProcuradoriaScreen;