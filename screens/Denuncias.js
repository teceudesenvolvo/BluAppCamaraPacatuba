import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

const DenunciasScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Denúncias</Text>
            </View>
            <ScrollView style={styles.content}>
                {/* Exemplo de Card de Denúncia */}
                <TouchableOpacity style={styles.denunciaCard}>
                    <Image
                        source={{ uri: 'https://projetocolabora.com.br/wp-content/uploads/2022/05/lixo-16-scaled-e1652744286235.jpg' }}
                        style={styles.denunciaImage}
                    />
                    <View style={styles.denunciaTextContainer}>
                        <Text style={styles.denunciaTitle}>Acúmulo de lixo na rua</Text>
                        <Text style={styles.denunciaDescription}>Moradores da rua exemplo estão incomodados com o acúmulo de lixo...</Text>
                    </View>
                </TouchableOpacity>
                {/* Você pode repetir este bloco para exibir mais denúncias */}
            </ScrollView>
            <View style={styles.bottomButtons}>
                <View style={styles.criarButton}>
                    <Text style={styles.criarButtonText}>Criar Denuncia</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: '15%',
        paddingBottom: 15,
        alignItems: 'flex-start',
        paddingLeft: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    denunciaCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    denunciaImage: {
        width: 100,
        height: 100,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    denunciaTextContainer: {
        flex: 1,
        padding: 10,
    },
    denunciaTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    denunciaDescription: {
        fontSize: 13,
        color: '#666',
    },
    bottomButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'absolute',
        bottom: '13%',
        right: 0,
    },
    criarButton: {
        backgroundColor: '#FFB800',
        borderTopLeftRadius: 25,
        borderTopEndRadius: 25,
        borderBottomLeftRadius: 25,
        paddingHorizontal: 25,
        paddingVertical: 15,
        marginRight: 10,
    },
    criarButtonText: {
        color: '#fff',
        fontSize: 13,
    },
    addButton: {
        backgroundColor: '#080A6C',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DenunciasScreen;
