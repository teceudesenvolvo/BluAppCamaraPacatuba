import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../firebaseConfig'; // Importa o banco de dados
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';

const MeusAgendamentos = ({ navigation }) => {
	const [agendamentos, setAgendamentos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchAgendamentos = async () => {
			setLoading(true);
			setError('');
			try {
				const user = AUTH.currentUser;
				if (!user) {
					setError('Usuário não autenticado.');
					setLoading(false);
					return;
				}
				// 1. Referência para a coleção 'meus-atendimentos'
				const atendimentosRef = ref(DB, 'meus-atendimentos');
				
				// 2. Cria a query para filtrar por 'userId' e ordenar por data de criação
				const q = query(atendimentosRef, orderByChild('userId'), equalTo(user.uid));
				
				// 3. Escuta as mudanças em tempo real nos dados filtrados
				const unsubscribe = onValue(q, (snapshot) => {
					const data = snapshot.val();
					if (data) {
						const ags = Object.keys(data).map(key => ({
							id: key,
							...data[key]
						})).reverse(); // .reverse() para mostrar os mais recentes primeiro
						setAgendamentos(ags);
					} else {
						setAgendamentos([]);
					}
					setLoading(false);
				}, (error) => {
					console.error(error);
					setError('Erro ao carregar agendamentos.');
					setLoading(false);
				});
				return () => unsubscribe(); // Limpa o listener ao desmontar
			} catch (e) {
				console.error(e);
				setError('Ocorreu um erro inesperado.');
				setLoading(false);
			}
		};

		const unsubscribe = fetchAgendamentos();

		return () => {
			if (unsubscribe && typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}, []);

		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
						<Icon name="arrow-back" size={24} color="#000" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Meus Atendimentos</Text>
				</View>
				{loading ? (
					<View style={styles.centered}><ActivityIndicator size="large" color="#080A6C" /></View>
				) : error ? (
					<View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
				) : agendamentos.length === 0 ? (
					<View style={styles.centered}><Text>Nenhum agendamento encontrado.</Text></View>
				) : (
					<ScrollView contentContainerStyle={styles.scrollContent}>
						{agendamentos.map(ag => (
							<View key={ag.id} style={styles.card}>
								<Text style={styles.label}>Data:</Text>
								<Text style={styles.value}>{ag.dataSelecionada ? `${ag.dataSelecionada}` : '-'}</Text>
								<Text style={styles.label}>Horário:</Text>
								<Text style={styles.value}>{ag.time || '-'}</Text>
								<Text style={styles.label}>Com:</Text>
								<Text style={styles.value}>{ag.nomeAgendado || '-'}</Text>
								<Text style={styles.label}>Tipo:</Text>
								<Text style={styles.value}>{ag.tipo || 'Não especificado'}</Text>
								<Text style={styles.label}>Motivo:</Text>
								<Text style={styles.value}>{ag.motivo || '-'}</Text>
								<Text style={styles.label}>Status:</Text>
								<Text style={[styles.value, { color: '#10B981', fontWeight: 'bold' }]}>{ag.status || 'Pendente'}</Text>
							</View>
						))}
					</ScrollView>
				)}

				{/* Botão flutuante para novo agendamento */}
				<TouchableOpacity
					style={styles.fab}
					onPress={() => navigation.navigate('Agendamento')}
					activeOpacity={0.85}
				>
					<Icon name="add" size={32} color="#fff" />
				</TouchableOpacity>
			</View>
		);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F3F4F6',
	},
	header: {
		paddingTop: 60,
		paddingBottom: 20,
		paddingHorizontal: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
	backButton: {
		position: 'absolute',
		left: 16,
		top: 55,
		padding: 8
	},
	headerTitle: {
		fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
	},
	scrollContent: {
		padding: 20,
		alignItems: 'center',
	},
	card: {
		width: '100%',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	label: {
		fontWeight: 'bold',
		color: '#374151',
		fontSize: 13,
		marginTop: 8,
	},
	value: {
		color: '#1F2937',
		fontSize: 15,
	},
	errorText: {
		color: '#DC2626',
		fontWeight: 'bold',
		fontSize: 15,
		textAlign: 'center',
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 300,
	},
		fab: {
		 position: 'absolute',
		 right: 24,
		 bottom: '12%',
		 backgroundColor: '#080A6C',
		 width: 60,
		 height: 60,
		 borderRadius: 30,
		 alignItems: 'center',
		 justifyContent: 'center',
		 shadowColor: '#000',
		 shadowOffset: { width: 0, height: 2 },
		 shadowOpacity: 0.2,
		 shadowRadius: 5,
		 zIndex: 100,
		},
});

export default MeusAgendamentos;
