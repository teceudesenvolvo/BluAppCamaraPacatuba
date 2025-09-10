import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const searchAnimation = useRef(new Animated.Value(0)).current;
    const [imageErrorIndices, setImageErrorIndices] = useState(new Set());

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('https://cmpacatuba.ce.gov.br/dadosabertosexportar?d=noticias&a=&f=json');
                const data = await response.json();
                // A API retorna um array diretamente, sem a propriedade 'dados'.
                // Verifica se a resposta é um array antes de setar o estado.
                if (Array.isArray(data)) {
                    setNews(data);
                } else {
                    console.error("Dados da API não são um array:", data);
                    setNews([]);
                }
            } catch (error) {
                console.error("Falha ao buscar notícias:", error);
                setNews([]); // Garante que news seja um array vazio em caso de erro
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const handleSearchClick = () => {
        setIsSearching(true);
        Animated.timing(searchAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const handleCancelSearch = () => {
        Animated.timing(searchAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start(() => setIsSearching(false));
    };

    const searchScreenOpacity = searchAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const searchScreenTranslateY = searchAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    // Handler para erros de imagem
    const handleImageError = (index) => {
        setImageErrorIndices(prev => new Set(prev).add(index));
    };


    // Funções Mudanças de Páginas
    const onVereadores = () => {
        navigation.navigate('Vereadores')
    }
    const onTvCamara = () => {
        navigation.navigate('TvCamara')
    }
    const onProcon = () => {
        navigation.navigate('Procon')
    }
    const onLicitacoes = () => {
        navigation.navigate('Licitacoes')
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView style={styles.content}>
                {/* Cabeçalho */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image
                            source={require('../assets/logo-pacatuba-azul.png')}
                            style={styles.logoHeader}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.headerRight}>
                        {/* <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="notifications" size={25} color="#080A6C" />
                            </TouchableOpacity> */}
                        <Ionicons name="person-circle" size={35} color="#080A6C" style={styles.profileIcon} />
                    </View>
                </View>
                {/* Boas-vindas e Título */}
                <Text style={styles.welcomeText}>Bem-vindo, Nome!</Text>
                <Text style={styles.pageTitle}>Câmara Municipal de Pacatuba - CE</Text>

                {/* Barra de Pesquisa */}
                <TouchableOpacity style={styles.searchBar} activeOpacity={1} onPress={handleSearchClick}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquise o que você precisa."
                        placeholderTextColor="#999"
                        editable={false}
                    />
                </TouchableOpacity>

                {/* Menu de Ícones */}
                <View style={styles.iconMenu}>
                    <TouchableOpacity style={styles.menuItem} onPress={onVereadores}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="people" size={35} color="white" />
                        </View>
                        <Text style={styles.menuText}>Vereadores</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={onTvCamara}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="play-circle" size={35} color="white" />
                        </View>
                        <Text style={styles.menuText}>TV Câmara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={onProcon}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="book" size={35} color="white" />
                        </View>
                        <Text style={styles.menuText}>Procon</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={onLicitacoes}>
                        <View style={styles.menuIconContainer}>
                            <FontAwesome name="gavel" size={35} color="white" />
                        </View>
                        <Text style={styles.menuText}>Licitações</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção de Notícias */}
                <Text style={styles.sectionTitle}>Notícias</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#080A6C" />
                ) : (
                    <View style={styles.newsContainer}>
                        {news && news.length > 0 ? (
                            news.filter((item, index) => item.Capa && !imageErrorIndices.has(index)).map((item, index) => (
                                <View style={styles.newsCard} key={index}>
                                    <Image
                                        source={{ uri: item.Capa }}
                                        style={styles.newsImage}
                                        onError={() => handleImageError(index) }
                                    />
                                    <View style={styles.newsTextContainer}>
                                        <Text style={styles.newsTitle}>{item.Titulo}</Text>
                                        <Text style={styles.newsDescription}>{item.Categoria}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noNewsText}>Nenhuma notícia encontrada.</Text>
                        )}
                    </View>
                )}
            </ScrollView>


            {/* Tela de Pesquisa Animada */ }
    {
        isSearching && (
            <Animated.View style={[styles.searchOverlay, { opacity: searchScreenOpacity, transform: [{ translateY: searchScreenTranslateY }] }]}>
                <View style={styles.searchHeader}>
                    <TextInput
                        style={styles.searchOverlayInput}
                        placeholder="Pesquise o que você precisa."
                        placeholderTextColor="#999"
                        autoFocus={true}
                    />
                    <TouchableOpacity onPress={handleCancelSearch}>
                        <Text style={styles.cancelButton}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.searchResultsContainer}>
                    {/* Conteúdo de resultados de pesquisa aqui */}
                    <Text style={styles.recentSearchTitle}>Pesquisas Recentes</Text>
                    <Text style={styles.recentSearchItem}>Sessões</Text>
                    <Text style={styles.recentSearchItem}>Notícias</Text>
                    <Text style={styles.recentSearchItem}>Vereadores</Text>
                </ScrollView>
            </Animated.View>
        )
    }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    gradient: {
        flex: 1,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '15%',
        paddingBottom: 35,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoHeader: {
        width: 120,
        height: 35,
        marginLeft: -10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginRight: 15,
    },
    profileIcon: {
        borderRadius: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    welcomeText: {
        fontSize: 13,
        color: '#666',
    },
    pageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#080A6C',
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    iconMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
    },
    menuItem: {
        alignItems: 'center',
        width: '23%',
    },
    menuIconContainer: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        backgroundColor: '#080A6C',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    menuText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    newsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    newsCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    newsImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: '#c2bfbfff',
    },
    newsTextContainer: {
        padding: 10,
    },
    newsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    newsDescription: {
        fontSize: 12,
        color: '#666',
    },
    noNewsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        width: '100%',
        marginTop: 20,
    },
    // Novos estilos para a tela de pesquisa
    searchOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchOverlayInput: {
        flex: 1,
        height: 45,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
    },
    cancelButton: {
        color: '#080A6C',
        fontSize: 16,
        marginLeft: 15,
    },
    searchResultsContainer: {
        flex: 1,
    },
    recentSearchTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    recentSearchItem: {
        fontSize: 14,
        color: '#666',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});

export default HomeScreen;
