import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { AUTH, DB } from '../firebaseConfig'; // Importar AUTH e DB
import { ref, onValue } from 'firebase/database'; // Importar funções do Realtime Database
import LogoNews from '../assets/logoPacatuba.png'; // Imagem padrão para notícias sem capa

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const searchAnimation = useRef(new Animated.Value(0)).current;
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0); // Novo estado para contagem de não lidas
    const [imageErrorIndices, setImageErrorIndices] = useState(new Set());

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('https://www.cmpacatuba.ce.gov.br/dadosabertosexportar?d=noticias&a=&f=json');
                const dados = await response.json();
                
                // --- CORREÇÃO AQUI ---
                // Removido a linha "const data = dados.length === 6;"
                // A verificação deve ser feita diretamente no array 'dados'
                
                if (Array.isArray(dados)) {
                    setNews(dados);
                } else {
                    console.error("Dados da API não são um array:", dados);
                    setNews([]);
                } 
            } catch (error) {
                console.error("Falha ao buscar notícias:", error);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Efeito para monitorar notificações não lidas
    useEffect(() => {
        const user = AUTH.currentUser;
        if (!user) {
            setUnreadNotificationCount(0);
            return;
        }

        const notificationsRef = ref(DB, 'notifications');
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val();
            let count = 0; 
            if (data) {
                Object.keys(data).forEach(notificationId => {
                    const notification = data[notificationId];
                    if (notification.targetUserId === user.uid && !notification.isRead) {
                        count++;
                    }
                });
            }
            setUnreadNotificationCount(count);
        });
        return () => unsubscribe();
    }, [AUTH.currentUser]);

    const handleNotificationPage = () => {
        navigation.navigate('Notificacoes');
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
                            // CORREÇÃO: O caminho da imagem deve ser '../assets/logo-pacatuba-azul.png'
                            // se a imagem estiver na pasta 'assets' e o componente 'Inicio.js'
                            // estiver em 'screens/Inicio.js'.
                            // Se a imagem estiver em 'assets/logo-pacatuba-azul.png', o caminho é correto.
                            // Mantendo o caminho original, mas adicionando este comentário para clareza.
                            source={require('../assets/logo-pacatuba-azul.png')}
                            style={styles.logoHeader}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPage}>
                            <Ionicons name="notifications" size={25} color="#080A6C" />
                            {unreadNotificationCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Boas-vindas e Título */}
                <Text style={styles.welcomeText}>Bem-vindo, Nome!</Text>
                <Text style={styles.pageTitle}>Câmara Municipal de Pacatuba - CE</Text>

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
            <View style={{ height: 100, textAlign: 'center', alignItems: 'center', marginTop: 20 }} >
                <Text>Desenvolvido por Blu Tecnologias</Text>
            </View>
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
        height: 60,
        marginLeft: 0,
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
        height: 150,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: '#ddddddff',
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
    // Novos estilos para o badge de notificação
    notificationBadge: {
        position: 'absolute',
        right: 8, // Ajuste a posição horizontal conforme necessário
        top: 8,   // Ajuste a posição vertical conforme necessário
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Garante que o badge fique acima do ícone
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
