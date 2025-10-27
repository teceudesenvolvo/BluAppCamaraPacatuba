import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../../firebaseConfig';
import { ref, push, set } from 'firebase/database';

const FormProcuradoriaScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        tipoAtendimento: 'Aconselhamento Jurídico',
        assunto: '',
        dataFato: '',
        descricao: '',
        identificacao: 'identificado',
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        const user = AUTH.currentUser;
        if (!user) {
            Alert.alert("Erro", "Você precisa estar logado para enviar uma solicitação.");
            return;
        }

        if (!formData.assunto || !formData.descricao) {
            Alert.alert("Campos Obrigatórios", "Por favor, preencha o assunto e a descrição.");
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
                    <Text style={styles.label}>Tipo de Atendimento</Text>
                    <TextInput style={styles.input} value={formData.tipoAtendimento} editable={false} />

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
                        value={formData.dataFato}
                        onChangeText={(text) => handleInputChange('dataFato', text)}
                        placeholder="DD/MM/AAAA"
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
});

export default FormProcuradoriaScreen;