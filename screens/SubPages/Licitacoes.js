import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Função para formatar a data e hora do formato ISO 8601 para DD/MM/YYYY
const formatDate = (isoString) => {
    if (!isoString) return 'Não informada';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Função para formatar um valor como moeda brasileira
const formatCurrency = (value) => {
    if (value === null || typeof value === 'undefined') return 'Não informado';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const modalidades = [
    { label: 'Concorrência - Eletrônica', value: '4' },
    { label: 'Concorrência - Presencial', value: '5' },
    { label: 'Dispensa de Licitação', value: '8' },
    { label: 'Pregão - Eletrônico', value: '6' },
    { label: 'Leilão - Eletrônico', value: '1' },
    { label: 'Pregão - Presencial', value: '7' },
    { label: 'Inexigibilidade', value: '9' },
    { label: 'Diálogo Competitivo', value: '2' },
    { label: 'Concurso', value: '3' },
    { label: 'Manifestação de Interesse', value: '10' },
    { label: 'Pré-qualificação', value: '11' },
    { label: 'Credenciamento', value: '12' },
    { label: 'Leilão - Presencial', value: '13' },
];

const ContratacoesScreen = ({ navigation }) => {
    const [contratacoes, setContratacoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ano, setAno] = useState('2025');
    const [codModalidade, setCodModalidade] = useState(''); // Estado para a modalidade
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [showModalidadePicker, setShowModalidadePicker] = useState(false);
    
    // CNPJ for Câmara Municipal de Pacatuba
    const cnpj = '06578447000129';
    const dataInicial = `${ano}0101`;
    const dataFinal = `${ano}1231`;

    const fetchContratacoes = async (pageNumber) => {
        setLoading(true);
        try {
            const modalidadeParam = codModalidade ? `&codigoModalidadeContratacao=${codModalidade}` : '';
            const url = `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&uf=ce&cnpj=${cnpj}${modalidadeParam}&pagina=${pageNumber}&tamanhoPagina=50`;
            console.log(`Buscando na URL: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            

            if (data && Array.isArray(data.data)) {
                if (data.data.length > 0) {
                    const newContracts = data.data.reverse();
                    setContratacoes(prevContratacoes => [...prevContratacoes, ...newContracts]);
                    setHasNextPage(data.data.length === 50);
                } else {
                    setHasNextPage(false);
                    if (pageNumber === 1) {
                        setContratacoes([]);
                        setError('Nenhuma contratação encontrada com os filtros atuais.');
                    }
                }
            } else {
                setError('Formato de dados inválido. Tente novamente mais tarde.');
                setHasNextPage(false);
                setContratacoes([]);
            }

        } catch (err) {
            // console.error(err);
            setHasNextPage(true);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        setContratacoes([]);
        setPage(1);
        setHasNextPage(true);
        setError(null);
        fetchContratacoes(1);
    }, [ano, codModalidade]); // Adiciona codModalidade como dependência

    const handleLoadMore = () => {
        if (!loading && hasNextPage) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchContratacoes(nextPage);
        }
    };

    const getFilteredContratacoes = () => {
        if (!searchText) {
            return contratacoes;
        }
        return contratacoes.filter(contrato =>
            contrato.objetoCompra && contrato.objetoCompra.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const renderContratacaoItem = ({ item }) => (
        <View style={styles.contratacaoCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Contrato Nº {item.numeroCompra || 'Não informado'}</Text>
            </View>
            <Text style={styles.cardText}>Modalidade: {item.modalidadeNome || 'Não informado'}</Text>
            <Text style={styles.cardText}>Data da Publicação: {formatDate(item.dataPublicacaoPncp)}</Text>
            <Text style={styles.cardObject}>Objeto: {item.objetoCompra || 'Não informado'}</Text>
            <Text style={styles.cardValue}>Valor Estimado: {formatCurrency(item.valorTotalEstimado)}</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loading && !hasNextPage && contratacoes.length > 0) {
            return (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Fim dos resultados</Text>
                </View>
            );
        }
        if (loading) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator size="small" color="#0000ff" />
                    <Text style={styles.footerText}>Carregando mais...</Text>
                </View>
            );
        }
        if (hasNextPage) {
            return (
                <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
                    <Text style={styles.loadMoreText}>Carregar Mais Contratos</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    const renderModalidadePicker = () => (
        <View style={styles.modalidadePicker}>
            <FlatList
                data={modalidades}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.modalidadeOption}
                        onPress={() => {
                            setCodModalidade(item.value);
                            setShowModalidadePicker(false);
                        }}
                    >
                        <Text style={styles.modalidadeOptionText}>{item.label}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    if (error && contratacoes.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.modalidadeSelectButton}
                    onPress={() => setShowModalidadePicker(!showModalidadePicker)}>
                    <Text style={styles.modalidadeSelectText}>
                        {modalidades.find(m => m.value === codModalidade)?.label || 'Selecione'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>
                {showModalidadePicker && renderModalidadePicker()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contratações</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar por objeto do contrato"
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            <View style={styles.filterContainer}>
                <TextInput
                    style={styles.anoInput}
                    placeholder="Ano"
                    placeholderTextColor="#999"
                    value={ano}
                    onChangeText={setAno}
                    keyboardType="numeric"
                />
                <TouchableOpacity
                    style={styles.modalidadeSelectButton}
                    onPress={() => setShowModalidadePicker(!showModalidadePicker)}>
                    <Text style={styles.modalidadeSelectText} numberOfLines={1} ellipsizeMode="tail">
                        {modalidades.find(m => m.value === codModalidade)?.label || 'Selecione'}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            {showModalidadePicker && renderModalidadePicker()}

            <FlatList
                data={getFilteredContratacoes()}
                renderItem={renderContratacaoItem}
                keyExtractor={(item, index) => `${item.numeroCompra}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => {
                    if (!loading && !error) {
                        return (
                            <View style={styles.emptyList}>
                                <Text style={styles.emptyText}>Nenhuma contratação encontrada para os filtros atuais.</Text>
                            </View>
                        );
                    }
                    return null;
                }}
                ListFooterComponent={renderFooter}
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
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    anoInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 40,
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    modalidadeSelectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
    },
    modalidadeSelectText: {
        fontSize: 12,
        width: width * 0.3,
        color: '#333',
    },
    modalidadePicker: {
        position: 'absolute',
        top: 260,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 5,
        maxHeight: 300,
        zIndex: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    modalidadeOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalidadeOptionText: {
        fontSize: 16,
        color: '#333',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    contratacaoCard: {
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
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#080A6C',
    },
    cardText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 3,
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
    emptyList: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    loadMoreButton: {
        backgroundColor: '#080A6C',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    loadMoreText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#D32F2F',
        textAlign: 'center',
        padding: 20,
        fontWeight: 'bold',
    }
});

export default ContratacoesScreen;
