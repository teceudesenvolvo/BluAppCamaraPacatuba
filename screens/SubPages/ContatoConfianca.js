import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../../firebaseConfig';
import { ref, onValue, set } from 'firebase/database';

const ContatoConfiancaScreen = ({ navigation }) => {
    const [contato, setContato] = useState({ email: '', telefone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const user = AUTH.currentUser;
    const contatoRef = user ? ref(DB, `procuradoria-mulher-btn-panico/${user.uid}/contato`) : null;

    useEffect(() => {
        if (!contatoRef) {
            setLoading(false);
            return;
        }

        const unsubscribe = onValue(contatoRef, (snapshot) => {
            if (snapshot.exists()) {
                setContato(snapshot.val());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        if (!contato.email || !contato.telefone) {
            Alert.alert("Campos Obrigatórios", "Preencha o e-mail e o telefone do seu contato.");
            return;
        }
        if (!contatoRef) return;

        setSaving(true);
        try {
            const dataToSave = {
                ...contato,
                userId: user.uid,
                userEmail: user.email,
            };
            await set(contatoRef, dataToSave);
            setSaving(false);
            Alert.alert("Sucesso", "Contato de confiança salvo!");
            navigation.goBack();
        } catch (error) {
            setSaving(false);
            Alert.alert("Erro", "Não foi possível salvar o contato.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contato de Confiança</Text>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#b100a8" />
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.infoText}>
                            Este contato receberá um alerta quando você acionar o Botão do Pânico.
                        </Text>

                        <Text style={styles.label}>E-mail do Contato</Text>
                        <TextInput
                            style={styles.input}
                            value={contato.email}
                            onChangeText={(text) => setContato(prev => ({ ...prev, email: text }))}
                            placeholder="email@contato.com"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Telefone do Contato</Text>
                        <TextInput
                            style={styles.input}
                            value={contato.telefone}
                            onChangeText={(text) => setContato(prev => ({ ...prev, telefone: text }))}
                            placeholder="(00) 90000-0000"
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Salvar Contato</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9eaf9ff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
    backButton: { position: 'absolute', left: 20, top: 60 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20, flex: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
    infoText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 15 },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButton: {
        backgroundColor: '#b100a8',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ContatoConfiancaScreen;