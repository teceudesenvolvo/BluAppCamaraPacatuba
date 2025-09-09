import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const LicitacoesScreen = () => {
    const [licitacoes, setLicitacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('Todas');

    useEffect(() => {
        const fetchLicitacoes = async () => {
            try {
                // Parâmetros para a Câmara Municipal de Pacatuba, Ceará.
                const uf = 'CE';
                const codigoMunicipioIbge = '2309706';
                const cnpj = '06578447000129';
                const idUsuario = '3';
                
                // Use a data atual e 2 anos para um intervalo de busca
                const dataAtual = new Date();
                const anoAtual = dataAtual.getFullYear();
                const dataInicial = `${anoAtual}0101`;
                const dataFinal = `${anoAtual + 2}1231`;

                const response = await fetch(`https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&uf=${uf}&codigoMunicipioIbge=${codigoMunicipioIbge}&cnpj=${cnpj}&idUsuario=${idUsuario}&pagina=1`);
                const data = await response.json();

                if (data.status === 'INVALID_ARGUMENT') {
                    setError('Falha na requisição. Verifique os parâmetros da API.');
                    return;
                }

                // Simular o status para corresponder à imagem
                const licitacoesComStatus = data.data.map((item, index) => {
                    let status = 'Fechada'; // Padrão
                    if (index % 3 === 0) {
                        status = 'Aberta';
                    } else if (index % 3 === 1) {
                        status = 'Em Negociação';
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
            case 'Em Negociação':
                backgroundColor = '#FFC107';
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
                    <Text style={styles.cardText}>Abertura: {item.dataHoraAberturaProposta.substring(0, 10)} às {item.dataHoraAberturaProposta.substring(11, 16)}</Text>
                    <Text style={styles.cardText}>Propostas até: {item.dataHoraFimProposta.substring(0, 10)} às {item.dataHoraFimProposta.substring(11, 16)}</Text>
                    <Text style={styles.cardText}>Modo de Disputa: {item.modoDisputa}</Text>
                </View>
                {renderStatusBadge(item.status)}
            </View>
            <Text style={styles.cardObject}>Objeto: {item.objeto}</Text>
            <Text style={styles.cardValue}>Valor Estimado: R$ {item.valorEstimado ? item.valorEstimado.toFixed(2) : 'Não informado'}</Text>
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
                <TouchableOpacity style={styles.backButton}>
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
                    <TouchableOpacity>
                        <Icon name="mic" size={20} color="#999" />
                    </TouchableOpacity>
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
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'Em Negociação' && styles.filterButtonActive]}
                    onPress={() => setFilter('Em Negociação')}>
                    <Text style={[styles.filterText, filter === 'Em Negociação' && styles.filterTextActive]}>Em Negociação</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={getFilteredLicitacoes()}
                renderItem={renderLicitacaoItem}
                keyExtractor={item => item.id}
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
