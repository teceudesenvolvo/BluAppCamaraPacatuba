import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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
				// Coleção: 'agendamentos' (ajuste conforme o nome salvo no Firestore)
				const agCol = collection(DB, 'agendamentos');
				const q = query(agCol, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
				const querySnapshot = await getDocs(q);
				const ags = [];
				querySnapshot.forEach(docSnap => {
					ags.push({ id: docSnap.id, ...docSnap.data() });
				});
				setAgendamentos(ags);
			} catch (e) {
				setError('Erro ao carregar agendamentos.');
			}
			setLoading(false);
		};
		fetchAgendamentos();
	}, []);

		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Meus Agendamentos</Text>
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
								<Text style={styles.value}>{ag.dataSelecionada || '-'}</Text>
								<Text style={styles.label}>Horário:</Text>
								<Text style={styles.value}>{ag.time || '-'}</Text>
								<Text style={styles.label}>Com:</Text>
								<Text style={styles.value}>{ag.nomeAgendado || ag.nome || '-'}</Text>
								<Text style={styles.label}>Tipo:</Text>
								<Text style={styles.value}>{ag.tipo || '-'}</Text>
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
        textAlign: 'center',
        padding: 20,
        marginTop: '5%',
	},
	backButton: {
		marginRight: 16,
		padding: 8,
		borderRadius: 8,
	},
	headerTitle: {
		fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
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
