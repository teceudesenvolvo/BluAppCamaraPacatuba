import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AUTH, DB } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const NotificationItem = ({ title, body, date }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex para encontrar URLs
    const match = urlRegex.exec(body);

    let textPart = body;
    let urlPart = null;

    if (match) {
        const url = match[0];
        const urlIndex = body.indexOf(url);
        textPart = body.substring(0, urlIndex); // Texto antes da URL
        urlPart = url; // A URL em si
    }

    const handleLinkPress = () => {
        if (urlPart) {
            Linking.openURL(urlPart).catch(err => console.error('Falha ao abrir URL:', err));
        }
    };

    return (
        <View style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationBody}>
                {textPart}
                {urlPart && <Text style={styles.clickableLink} onPress={handleLinkPress}>{urlPart}</Text>}
            </Text>
            <Text style={styles.notificationDate}>{formatDate(date)}</Text>
        </View>
    );
};

const NotificacoesScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = AUTH.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true); // Garante que o loading seja exibido ao trocar de usuário
        const notificationsRef = ref(DB, 'notifications');

        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val();            
            if (data) {
                // Mapeia todas as notificações da raiz e filtra as que pertencem ao usuário logado.
                const allUserNotifications = Object.keys(data)
                    .map(key => ({ id: key, ...data[key] }))
                    .filter(notification => notification.targetUserId === user.uid)
                    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)); // Ordena da mais nova para a mais antiga

                // Marca todas as notificações exibidas como lidas no Firebase
                const updates = {};
                allUserNotifications.forEach(notif => {
                    if (!notif.isRead) { // Apenas atualiza se ainda não estiver lida
                        updates[`${notif.id}/isRead`] = true;
                    }
                });
                // Envia as atualizações para o Firebase
                if (Object.keys(updates).length > 0) update(notificationsRef, updates);
                
                setNotifications(allUserNotifications);
            } else {
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
             <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notificações</Text>
            <FlatList
                data={notifications}
                renderItem={({ item }) => (
                    <NotificationItem
                        title={item.tituloNotification}
                        body={item.descricaoNotification} // A descricaoNotification já contém a URL completa
                        date={item.timestamp || item.date}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={() => (
                    loading ? (
                        <ActivityIndicator size="large" color="#080A6C" style={{ marginTop: 50 }} />
                    ) : (
                        <Text style={styles.emptyText}>Nenhuma notificação encontrada.</Text>
                    )
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
        marginTop: '15%',
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 20,
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#080A6C',
        marginBottom: 5,
    },
    notificationBody: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    clickableLink: {
        color: 'blue',
        textDecorationLine: 'underline',
    },
    notificationDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginTop: 40,
    },
});

export default NotificacoesScreen;