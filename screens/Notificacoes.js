import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const notificationsData = [
    // { id: '1', title: '', body: '', date: '' },
];

const NotificationItem = ({ title, body, date }) => (
    <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationBody}>{body}</Text>
        <Text style={styles.notificationDate}>{date}</Text>
    </View>
);

const NotificacoesScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Notificações</Text>
            <FlatList
                data={notificationsData}
                renderItem={({ item }) => (
                    <NotificationItem
                        title={item.title}
                        body={item.body}
                        date={item.date}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nenhuma notificação a carregar.</Text>
                }
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
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
