import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
// Importa\u00e7\u00f5es do Firebase (assumindo que voc\u00ea tem a inst\u00e2ncia 'DB' no servi\u00e7o)
// IMPORTANTE: Ajuste o caminho de import do 'DB' se for diferente
import { DB } from '../firebaseConfig'; 
import { ref, push, serverTimestamp } from 'firebase/database';

const RealizarDenunciaScreen = () => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Fun\u00e7\u00e3o de tratamento de den\u00fancia (usando Realtime Database)
  const handleDenuncia = async () => {
    if (!titulo || !descricao) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha o Título e a Descrição da denúncia.");
      return;
    }

    setCarregando(true);
    
    // Simula\u00e7\u00e3o de ID do usu\u00e1rio (em um app real, voc\u00ea obter\u00e1 isso de AUTH)
    const userId = 'user_dummy_id_123'; 
    
    try {
      const novaDenuncia = {
        titulo: titulo,
        descricao: descricao,
        localizacao: localizacao,
        userId: userId,
        status: 'Pendente',
        dataCriacao: serverTimestamp(),
      };

      // Adiciona a den\u00fancia \u00e0 cole\u00e7\u00e3o 'denuncias' no Firebase Realtime DB
      const dbRef = ref(DB, 'denuncias');
      await push(dbRef, novaDenuncia);

      Alert.alert("Sucesso", "Sua denúncia foi registrada com sucesso!");
      
      // Limpar formul\u00e1rio
      setTitulo('');
      setDescricao('');
      setLocalizacao('');

    } catch (error) {
      console.error("Erro ao registrar den\u00fancia:", error);
      Alert.alert("Erro", "Ocorreu um erro ao enviar sua denúncia. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Registrar Denúncia</Text>
        <Text style={styles.subtitle}>Sua identidade será mantida em sigilo.</Text>

        {/* Campo T\u00edtulo */}
        <Text style={styles.label}>Título da Denúncia *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Obra irregular na rua X"
          value={titulo}
          onChangeText={setTitulo}
        />

        {/* Campo Descri\u00e7\u00e3o */}
        <Text style={styles.label}>Detalhes da Denúncia *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o problema com o máximo de detalhes possível."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
        />

        {/* Campo Localiza\u00e7\u00e3o */}
        <Text style={styles.label}>Localização (Endereço, Ponto de Referência)</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, número e bairro"
          value={localizacao}
          onChangeText={setLocalizacao}
        />

        {/* Bot\u00e3o de Envio */}
        <TouchableOpacity 
          style={[styles.button, carregando && styles.buttonDisabled]} 
          onPress={handleDenuncia}
          disabled={carregando}
        >
          <Text style={styles.buttonText}>
            {carregando ? 'Enviando...' : 'Enviar Denúncia'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// <--- ESSA LINHA \u00c9 CR\u00cdTICA PARA RESOLVER SEU ERRO DE NAVEGA\u00c7\u00c3O --->
export default RealizarDenunciaScreen; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#080A6C', // Azul principal
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Necess\u00e1rio para alinhar o texto no topo em Android
  },
  button: {
    width: '100%',
    backgroundColor: '#00BFFF', // Azul c\u00e9u para a\u00e7\u00e3o
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#9ACD32', // Cor mais clara quando desabilitado
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
