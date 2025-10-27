import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../firebaseConfig';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';

// --- COMPONENTE DE CARD REUTILIZÁVEL ---
const AtendimentoCard = ({ item, type }) => {
	// Adapta os campos com base no tipo de atendimento
	// Ajustado para a nova estrutura de dados (ex: item.dadosSolicitacao)
	let details = {};
	switch (type) {
		case 'vereadores':
			details = {
				title: item.dadosSolicitacao?.vereadorNome || 'Solicitação para Vereador',
				fields: [
					{ label: 'Assunto', value: item.dadosSolicitacao?.assunto },
					{ label: 'Data Preferencial', value: item.dadosSolicitacao?.dataPreferencial },
					{ label: 'Horário', value: item.dadosSolicitacao?.horarioPreferencial },
					{ label: 'Descrição', value: item.dadosSolicitacao?.descricao },
				],
				status: item.status || 'Pendente'
			};
			break;
		case 'juridico':
			details = {
				title: item.dadosAcontecimento?.assunto || 'Atendimento Jurídico',
				fields: [
					{ label: 'Data do Fato', value: item.dadosAcontecimento?.dataAcontecimento },
					{ label: 'Descrição', value: item.dadosAcontecimento?.descricao },
				],
				status: item.status || 'Recebido'
			};
			break;
		case 'balcao':
			details = {
				title: item.dadosSolicitacao?.assunto || 'Balcão do Cidadão',
				fields: [
					{ label: 'Solicitação', value: item.dadosSolicitacao?.descricao },
				],
				status: item.status || 'Recebido'
			};
			break;
		case 'ouvidoria':
			details = {
				title: item.dadosManifestacao?.tipoManifestacao || 'Ouvidoria',
				fields: [
					{ label: 'Assunto', value: item.dadosManifestacao?.assunto },
					{ label: 'Descrição', value: item.dadosManifestacao?.descricao },
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
	const [activeTab, setActiveTab] = useState('vereadores');

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
			// Solicitações para vereadores são salvas em 'solicitacoes-vereadores'
			vereadores: 'solicitacoes-vereadores',
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

	const renderContent = () => {
		const data = atendimentos[activeTab];
		const type = activeTab;

		if (loading) {
			return <View style={styles.centered}><ActivityIndicator size="large" color="#080A6C" /></View>;
		}
		if (error) {
			return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
		}
		if (totalAtendimentos === 0) {
			return <View style={styles.centered}><Text>Nenhum atendimento encontrado.</Text></View>;
		}
		if (data.length === 0) {
			return <View style={styles.centered}><Text>Nenhum atendimento nesta categoria.</Text></View>;
		}

		return (
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{data.map(item => <AtendimentoCard key={item.id} item={item} type={type} />)}
			</ScrollView>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Meus Atendimentos</Text>
			</View>

			<View style={styles.tabContainer}>
				<TouchableOpacity style={[styles.tab, activeTab === 'vereadores' && styles.activeTab]} onPress={() => setActiveTab('vereadores')}>
					<Text style={[styles.tabText, activeTab === 'vereadores' && styles.activeTabText]}>Vereadores</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.tab, activeTab === 'juridico' && styles.activeTab]} onPress={() => setActiveTab('juridico')}>
					<Text style={[styles.tabText, activeTab === 'juridico' && styles.activeTabText]}>Jurídico</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.tab, activeTab === 'balcao' && styles.activeTab]} onPress={() => setActiveTab('balcao')}>
					<Text style={[styles.tabText, activeTab === 'balcao' && styles.activeTabText]}>Balcão</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.tab, activeTab === 'ouvidoria' && styles.activeTab]} onPress={() => setActiveTab('ouvidoria')}>
					<Text style={[styles.tabText, activeTab === 'ouvidoria' && styles.activeTabText]}>Ouvidoria</Text>
				</TouchableOpacity>
			</View>

			{renderContent()}

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
	tabContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		backgroundColor: '#fff',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
	},
	tab: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	activeTab: {
		backgroundColor: '#080A6C',
	},
	tabText: {
		color: '#4B5563',
		fontWeight: '600',
		fontSize: 13,
	},
	activeTabText: {
		color: '#fff',
	},
	scrollContent: {
		padding: 20,
		alignItems: 'center',
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
