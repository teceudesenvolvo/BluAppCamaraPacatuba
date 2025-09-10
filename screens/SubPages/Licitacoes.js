import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Função para formatar a data e hora do formato ISO 8601 (2025-01-28T12:28:35) para DD/MM/YYYY às HH:MM
const formatDateAndTime = (isoString) => {
    if (!isoString) return 'Não informada';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

// Função para formatar um valor como moeda brasileira
const formatCurrency = (value) => {
    if (value === null || typeof value === 'undefined') return 'Não informado';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const LicitacoesScreen = ({navigation}) => {
    const [licitacoes, setLicitacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('Todas');

    useEffect(() => {
        const fetchLicitacoes = async () => {
            try {
                // Parâmetros para a Câmara Municipal de Pacatuba, Ceará.
                const uf = 'DF';
                const codigoMunicipioIbge = '5300108';
                const cnpj = '00059311000126';
                const codigoModalidadeContratacao = '8';
                const dataInicial = '20250101';
                const dataFinal = '20251201';
                const codigoUnidadeAdministrativa = '194035';
                const idUsuario = '3';
                
                const response = await fetch(`https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&codigoModalidadeContratacao=${codigoModalidadeContratacao}&uf=${uf}&codigoMunicipioIbge=${codigoMunicipioIbge}&cnpj=${cnpj}&codigoUnidadeAdministrativa=${codigoUnidadeAdministrativa}&idUsuario=${idUsuario}&pagina=1`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (!data || data.status === 'INVALID_ARGUMENT' || !data.data) {
                    setError('Não foi possível carregar os dados. Nenhum resultado encontrado ou falha na requisição.');
                    return;
                }

                // Simular o status para corresponder à imagem e garantir que todos os itens tenham um status.
                const licitacoesComStatus = data.data.map((item, index) => {
                    let status = 'Fechada';
                    // Lógica para definir o status, ajustada para a simulação
                    const dataAtual = new Date();
                    if (dataAtual <= item.dataEncerramentoProposta) {
                        status = 'Aberta';
                    } else {
                        status = 'Fechada';
                    }
                    return { ...item, status };
                });
                setLicitacoes(licitacoesComStatus);
            } catch (err) {
                setError('Falha ao carregar os dados das licitações.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLicitacoes();
    }, []);

    const getFilteredLicitacoes = () => {
        if (filter === 'Todas') {
            return licitacoes;
        }
        return licitacoes.filter(licitacao => licitacao.status === filter);
    };

    const renderStatusBadge = (status) => {
        let backgroundColor;
        switch (status) {
            case 'Aberta':
                backgroundColor = '#4CAF50';
                break;
            case 'Fechada':
                backgroundColor = '#D32F2F';
                break;
            default:
                backgroundColor = '#9E9E9E';
        }
        return (
            <View style={[styles.statusBadge, { backgroundColor }]}>
                <Text style={styles.statusText}>{status}</Text>
            </View>
        );
    };

    const renderLicitacaoItem = ({ item }) => (
        <View style={styles.licitacaoCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardText}>Abertura: {formatDateAndTime(item.dataAberturaProposta)}</Text>
                    <Text style={styles.cardText}>Propostas até: {formatDateAndTime(item.dataEncerramentoProposta)}</Text>
                    <Text style={styles.cardText}>Modo de Disputa: {item.modoDisputaNome || 'Não informado'}</Text>
                </View>
                {renderStatusBadge(item.status)}
            </View>
            <Text style={styles.cardObject}>Objeto: {item.objetoCompra || 'Não informado'}</Text>
            <Text style={styles.cardValue}>Valor Estimado: {formatCurrency(item.valorEstimado)}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack() }>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Licitações</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar"
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'Todas' && styles.filterButtonActive]}
                    onPress={() => setFilter('Todas')}>
                    <Text style={[styles.filterText, filter === 'Todas' && styles.filterTextActive]}>Todas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'Abertas' && styles.filterButtonActive]}
                    onPress={() => setFilter('Abertas')}>
                    <Text style={[styles.filterText, filter === 'Abertas' && styles.filterTextActive]}>Abertas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'Fechadas' && styles.filterButtonActive]}
                    onPress={() => setFilter('Fechadas')}>
                    <Text style={[styles.filterText, filter === 'Fechadas' && styles.filterTextActive]}>Fechadas</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={getFilteredLicitacoes()}
                renderItem={renderLicitacaoItem}
                keyExtractor={(item, index) => item.id || String(index)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#080A6C',
    },
    filterText: {
        fontSize: 12,
        color: '#333',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    licitacaoCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 3,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardObject: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 14,
        color: '#080A6C',
        fontWeight: 'bold',
    },
});

export default LicitacoesScreen;
