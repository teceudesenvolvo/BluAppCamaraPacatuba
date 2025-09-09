import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import WebView from 'react-native-webview';

const TVWebScreen = () => {
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const flatListRef = useRef(null);

    // Substitua 'YOUR_API_KEY' pela sua chave de API do YouTube.
    // Lembre-se de restringir esta chave de API para evitar uso indevido.
    const YOUTUBE_API_KEY = 'AIzaSyCfZfFR3QzWmQWBYMgwmXx8n2EdyjdFi2s';
    const PLAYLIST_ID = 'PLmz0IMGXMgF996ottv9cmJQvZDzglOtXR';

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
                    thumbnail: item.snippet.thumbnails.high.url,
                    videoId: item.contentDetails.videoId
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
                source={{ uri: item.thumbnail }}
                style={styles.videoThumbnail}
            />
            <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{item.title}</Text>
                <Text style={styles.videoDescription}>{item.description}</Text>
            </View>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <View>
            <Text style={styles.headerTitle}>Assista Agora</Text>
            {selectedVideo && (
                <View style={styles.playerContainer}>
                    <WebView
                        style={styles.youtubePlayer}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        source={{ uri: `https://www.youtube.com/embed/${selectedVideo.videoId}?modestbranding=1&rel=0` }}
                    />
                    <TouchableOpacity
                        style={styles.youtubeButton}
                        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${selectedVideo.videoId}`)}
                    >
                        <Text style={styles.youtubeButtonText}>Assista no YouTube</Text>
                    </TouchableOpacity>
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
        paddingTop: '20%',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 20,
        marginBottom: 10,
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
