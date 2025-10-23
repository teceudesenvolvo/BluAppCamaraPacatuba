import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../firebaseConfig';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';

// --- COMPONENTE DE CARD REUTILIZÁVEL ---
const AtendimentoCard = ({ item, type }) => {
	// Adapta os campos com base no tipo de atendimento
	let details = {};
	switch (type) {
		case 'vereadores':
			details = {
				title: item.nomeAgendado || 'Agendamento com Vereador',
				fields: [
					{ label: 'Data', value: item.dataSelecionada },
					{ label: 'Horário', value: item.time },
					{ label: 'Motivo', value: item.motivo },
				],
				status: item.status || 'Pendente'
			};
			break;
		case 'juridico':
			details = {
				title: item.assuntoJuridico || 'Atendimento Jurídico',
				fields: [
					{ label: 'Data do Acontecimento', value: item.dataAcontecimento },
					{ label: 'Descrição', value: item.descricaoCaso },
				],
				status: item.status || 'Recebido'
			};
			break;
		case 'balcao':
			details = {
				title: item.assuntoBalcao || 'Balcão do Cidadão',
				fields: [
					{ label: 'Solicitação', value: item.descricaoSolicitacao },
				],
				status: item.status || 'Recebido'
			};
			break;
		case 'ouvidoria':
			details = {
				title: item.tipoManifestacao || 'Ouvidoria',
				fields: [
					{ label: 'Assunto', value: item.assuntoOuvidoria },
					{ label: 'Descrição', value: item.descricaoNotificacao },
				],
				status: item.status || 'Recebido'
			};
			break;
		default:
			details = { title: 'Atendimento', fields: [], status: 'N/A' };
	}

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>{details.title}</Text>
			{details.fields.map((field, index) => (
				<View key={index}>
					<Text style={styles.label}>{field.label}:</Text>
					<Text style={styles.value}>{field.value || '-'}</Text>
				</View>
			))}
			<Text style={styles.label}>Status:</Text>
			<Text style={[styles.value, { color: '#10B981', fontWeight: 'bold' }]}>{details.status}</Text>
		</View>
	);
};

const MeusAgendamentos = ({ navigation }) => {
	const [atendimentos, setAtendimentos] = useState({
		juridico: [],
		balcao: [],
		ouvidoria: [],
		vereadores: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const user = AUTH.currentUser;
		if (!user) {
			setError('Usuário não autenticado.');
			setLoading(false);
			return;
		}

		const collections = {
			juridico: 'atendimento-juridico',
			balcao: 'balcao-cidadao',
			ouvidoria: 'ouvidoria',
			// Agendamentos com vereadores são salvos em 'meus-atendimentos'
			vereadores: 'meus-atendimentos',
		};

		const listeners = Object.keys(collections).map(category => {
			const collectionName = collections[category];
			const dbRef = ref(DB, collectionName);
			const q = query(dbRef, orderByChild('userId'), equalTo(user.uid));

			return onValue(q, (snapshot) => {
				const data = snapshot.val();
				const items = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : [];
				
				setAtendimentos(prev => ({ ...prev, [category]: items }));
				setLoading(false); // Para o loading assim que o primeiro dado chegar
			}, (dbError) => {
				console.error(`Erro ao buscar ${collectionName}:`, dbError);
				setError('Erro ao carregar seus atendimentos.');
				setLoading(false);
			});
		});

		return () => {
			// A função onValue retorna a função de unsubscribe
			listeners.forEach(unsubscribe => unsubscribe());
		};
	}, []);

	const totalAtendimentos = Object.values(atendimentos).reduce((sum, list) => sum + list.length, 0);

	const renderSection = (title, data, type) => {
		if (data.length === 0) return null;
		return (
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{data.map(item => <AtendimentoCard key={item.id} item={item} type={type} />)}
			</View>
		);
	};

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
			) : totalAtendimentos === 0 ? (
				<View style={styles.centered}><Text>Nenhum atendimento encontrado.</Text></View>
			) : (
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{renderSection('Agendamentos com Vereadores', atendimentos.vereadores, 'vereadores')}
					{renderSection('Atendimento Jurídico', atendimentos.juridico, 'juridico')}
					{renderSection('Balcão do Cidadão', atendimentos.balcao, 'balcao')}
					{renderSection('Ouvidoria', atendimentos.ouvidoria, 'ouvidoria')}
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
	section: {
		width: '100%',
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#4B5563',
		marginBottom: 12,
		paddingBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
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
	cardTitle: {
		fontSize: 15,
		fontWeight: 'bold',
		color: '#080A6C',
		marginBottom: 8,
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
		marginBottom: 4,
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
