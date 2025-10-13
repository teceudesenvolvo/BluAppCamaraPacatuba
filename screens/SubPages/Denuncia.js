import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DB, AUTH } from '../../firebaseConfig';
import { ref, get, set, remove } from 'firebase/database';

const LABELS = {
	cnpj: 'CNPJ da Empresa',
	companyName: 'Nome da Empresa',
	areaAtuacao: 'Atividade Exercida',
	tipoReclamacao: 'Tipo de Reclamação',
	assuntoDenuncia: 'Assunto da Denúncia',
	fornecedorResolver: 'Procurou o fornecedor?',
	formaAquisicao: 'Forma de Aquisição',
	tipoContratacao: 'Tipo de Contratação',
	dataContratacao: 'Data da Contratação',
	nomeServico: 'Nome do Serviço ou Plano',
	detalhesServico: 'Detalhes do Serviço ou Plano',
	tipoDocumento: 'Tipo de Documento',
	numeroDocumento: 'Número do Documento',
	dataOcorrencia: 'Data da Ocorrência',
	dataCancelamento: 'Data do Cancelamento',
	formaPagamento: 'Forma de Pagamento',
	valorCompra: 'Valor da Compra',
	descricao: 'Descrição',
	pedidoConsumidor: 'Pedido do Consumidor',
	protocolo: 'Protocolo',
	status: 'Status',
	createdAt: 'Data de Criação',
};

const DenunciaScreen = ({ route, navigation }) => {
	const { denunciaId } = route.params || {};
	const [denuncia, setDenuncia] = useState(null);
	const [loading, setLoading] = useState(true);
	const [editMode, setEditMode] = useState(false);
	const [form, setForm] = useState({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!denunciaId) return;
		setLoading(true);
		const user = AUTH.currentUser;
		if (!user) return;
		const denunciaRef = ref(DB, `denuncias-procon/${denunciaId}`);
		get(denunciaRef).then(snapshot => {
			if (snapshot.exists()) {
				setDenuncia(snapshot.val());
				setForm(snapshot.val());
			}
			setLoading(false);
		});
	}, [denunciaId]);

	const handleEdit = () => setEditMode(true);
	const handleCancel = () => {
		setEditMode(false);
		setForm(denuncia);
	};

	const handleChange = (key, value) => {
		setForm(prev => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const user = AUTH.currentUser;
			if (!user || !denunciaId) return;
			const denunciaRef = ref(DB, `denuncias-procon/${denunciaId}`);
			await set(denunciaRef, { ...form, userId: user.uid, userEmail: user.email });
			setDenuncia({ ...form, userId: user.uid, userEmail: user.email });
			setEditMode(false);
			Alert.alert('Sucesso', 'Denúncia atualizada com sucesso!');
		} catch (e) {
			Alert.alert('Erro', 'Não foi possível salvar as alterações.');
		}
		setSaving(false);
	};

	const handleDelete = async () => {
		Alert.alert('Excluir Denúncia', 'Tem certeza que deseja excluir esta denúncia?', [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Excluir', style: 'destructive', onPress: async () => {
					try {
						const user = AUTH.currentUser;
						if (!user || !denunciaId) return;
						const denunciaRef = ref(DB, `denuncias-procon/${denunciaId}`);
						await remove(denunciaRef);
						Alert.alert('Excluída', 'Denúncia excluída com sucesso!', [
							{ text: 'OK', onPress: () => navigation.goBack() }
						]);
					} catch (e) {
						Alert.alert('Erro', 'Não foi possível excluir a denúncia.');
					}
				}
			}
		]);
	};

	if (loading) {
		return (
			<View style={styles.centered}><ActivityIndicator size="large" color="#080A6C" /></View>
		);
	}
	if (!denuncia) {
		return (
			<View style={styles.centered}><Text>Denúncia não encontrada.</Text></View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
				<Icon name="arrow-back" size={24} color="#000" />
			</TouchableOpacity>
			<Text style={styles.title}>Detalhes da Denúncia</Text>
			<View style={styles.card}>
				{Object.entries(LABELS).map(([key, label]) => {
					if (key === 'createdAt' && denuncia[key]) {
						const date = new Date(denuncia[key]);
						return (
							<View key={key} style={styles.fieldRow}>
								<Text style={styles.label}>{label}:</Text>
								<Text style={styles.value}>{date.toLocaleString('pt-BR')}</Text>
							</View>
						);
					}
					if (key === 'protocolo' && denuncia[key]) {
						return (
							<View key={key} style={styles.fieldRow}>
								<Text style={styles.label}>{label}:</Text>
								<Text style={[styles.value, { color: '#080A6C', fontWeight: 'bold' }]}>{denuncia[key]}</Text>
							</View>
						);
					}
					if (key === 'status' && denuncia[key]) {
						return (
							<View key={key} style={styles.fieldRow}>
								<Text style={styles.label}>{label}:</Text>
								<Text style={[styles.value, { color: '#10B981', fontWeight: 'bold' }]}>{denuncia[key]}</Text>
							</View>
						);
					}
					if (denuncia[key] !== undefined && key !== 'arquivos') {
						return editMode ? (
							<View key={key} style={styles.fieldRow}>
								<Text style={styles.label}>{label}:</Text>
								<TextInput
									style={styles.input}
									value={form[key] || ''}
									onChangeText={text => handleChange(key, text)}
									editable={editMode}
								/>
							</View>
						) : (
							<View key={key} style={styles.fieldRow}>
								<Text style={styles.label}>{label}:</Text>
								<Text style={styles.value}>{denuncia[key]}</Text>
							</View>
						);
					}
					return null;
				})}

				{/* Anexos */}
				{denuncia.arquivos && (
					<View style={{ marginTop: 20 }}>
						<Text style={styles.label}>Anexos:</Text>
						{Object.entries(denuncia.arquivos).map(([k, v]) => v ? (
							<Text key={k} style={styles.anexoText}>{k}: <Text style={{ color: '#10B981' }}>Arquivo enviado</Text></Text>
						) : null)}
					</View>
				)}
			</View>
			<View style={styles.buttonRow}>
				{editMode ? (
					<>
						<TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
							<Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
							<Text style={styles.buttonText}>Cancelar</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						<TouchableOpacity style={styles.editButton} onPress={handleEdit}>
							<Text style={styles.buttonText}>Editar</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
							<Text style={styles.buttonText}>Excluir</Text>
						</TouchableOpacity>
					</>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		backgroundColor: '#F9FAFB',
		padding: 20,
		alignItems: 'center',
		paddingBottom: 40,
	},
	backButton: {
		position: 'absolute',
		top: 55,
		left: 16,
		padding: 8,
		borderRadius: 8,
		zIndex: 10,
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#1f1f1f',
		marginTop: 45,
		marginBottom: 20,
		textAlign: 'center',
	},
	card: {
		width: '100%',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
		marginBottom: 20,
	},
	fieldRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	label: {
		fontWeight: 'bold',
		color: '#374151',
		width: 140,
		fontSize: 13,
	},
	value: {
		color: '#1F2937',
		fontSize: 15,
		flex: 1,
		flexWrap: 'wrap',
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		borderRadius: 8,
		padding: 8,
		fontSize: 15,
		backgroundColor: '#F3F4F6',
		color: '#1F2937',
	},
	anexoText: {
		fontSize: 13,
		color: '#374151',
		marginTop: 4,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 10,
		gap: 10,
	},
	editButton: {
		backgroundColor: '#FFA500',
		padding: 12,
		borderRadius: 8,
		marginHorizontal: 5,
	},
	deleteButton: {
		backgroundColor: '#DC2626',
		padding: 12,
		borderRadius: 8,
		marginHorizontal: 5,
	},
	saveButton: {
		backgroundColor: '#10B981',
		padding: 12,
		borderRadius: 8,
		marginHorizontal: 5,
	},
	cancelButton: {
		backgroundColor: '#6B7280',
		padding: 12,
		borderRadius: 8,
		marginHorizontal: 5,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 15,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
	},
});

export default DenunciaScreen;
