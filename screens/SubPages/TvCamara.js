import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

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


const TVWebScreen = ({ navigation }) => {
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const flatListRef = useRef(null);

    // Substitua 'YOUR_API_KEY' pela sua chave de API do YouTube.
    // Lembre-se de restringir esta chave de API para evitar uso indevido.
    const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
    const PLAYLIST_ID = 'PLmz0IMGXMgF996ottv9cmJQvZDzglOtXR';

    // DEBUG: Verifique se a chave está sendo carregada.
    console.log('Chave da API do YouTube:', YOUTUBE_API_KEY ? 'Carregada' : 'NÃO CARREGADA (undefined)');

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`);
                const data = await response.json();

                if (data.error) {
                    setError('Falha ao carregar os vídeos do YouTube. Verifique se a sua chave de API está correta e se a API do YouTube está habilitada para o seu projeto no Google Cloud.');
                    return;
                }

                const fetchedVideos = data.items.map(item => ({
                    id: item.contentDetails.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: (item.snippet.thumbnails && item.snippet.thumbnails.high && item.snippet.thumbnails.high.url) ? item.snippet.thumbnails.high.url : '',
                    videoId: item.contentDetails.videoId,
                    dateVideo: item.snippet.publishedAt,
                }));

                setVideos(fetchedVideos);
                if (fetchedVideos.length > 0) {
                    setSelectedVideo(fetchedVideos[0]);
                }
            } catch (err) {
                setError('Falha ao carregar os vídeos do YouTube.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

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

    const renderVideoItem = ({ item }) => (
        <TouchableOpacity
            style={styles.videoItem}
            onPress={() => {
                setSelectedVideo(item);
                if (flatListRef.current) {
                    flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
                }
            }}
        >
            <Image
                source={item.thumbnail ? { uri: item.thumbnail } : require('../../assets/logo-pacatuba.png')}
                style={styles.videoThumbnail}
            />
            <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{item.title}</Text>
                <Text style={styles.videoDescription}>{formatDateAndTime(item.dateVideo)}</Text>
            </View>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <View>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tv Câmara Pacatuba</Text>
            </View>
            <Text style={styles.subHeaderTitle}>Assista Agora</Text>
            {selectedVideo && (
                <View style={styles.playerContainer}>
                    {/* 
                      Correção: Em vez de usar a URI direta, usamos um HTML customizado.
                      Isso resolve o erro 153, que ocorre porque o WebView não tem uma "origem"
                      de domínio válida para o player do YouTube.
                    */}
                    <WebView
                        style={styles.youtubePlayer}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true} // Essencial para iOS
                        useWebKit={true} // Use a engine moderna no iOS
                        originWhitelist={['https://*.youtube.com']} // Mais seguro que '*'
                        mixedContentMode="always" // Essencial para Android
                        source={{
                            html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                        body, html, #player { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #000; }
                                        iframe { width: 100%; height: 100%; border: 0; }
                                    </style>
                                </head>
                                <body>
                                    <div id="player">
                                        <iframe src="https://www.youtube.com/embed/${selectedVideo.videoId}" allowfullscreen></iframe>
                                    </div>
                                </body>
                                </html>
                            `
                        }}
                    />
                    
                </View>
            )}
            <Text style={styles.subHeaderTitle}>Últimas Sessões</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={videos}
                renderItem={renderVideoItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={ListHeader}
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
    subHeaderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    playerContainer: {
        height: 250,
        marginHorizontal: 10,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    youtubePlayer: {
        flex: 1,
    },
    youtubeButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 5,
        borderRadius: 5,
    },
    youtubeButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    videoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    videoThumbnail: {
        width: 100,
        height: 60,
        borderRadius: 5,
        marginRight: 10,
    },
    videoInfo: {
        flex: 1,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    videoDescription: {
        fontSize: 12,
        color: '#666',
    },
});

export default TVWebScreen;
