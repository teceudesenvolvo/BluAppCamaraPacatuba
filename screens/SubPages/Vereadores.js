import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';


const VereadoresScreen = ({navigation}) => {
    const [vereadores, setVereadores] = useState([]);
    const [selectedVereador, setSelectedVereador] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVereadores = async () => {
            try {
                const response = await fetch('https://cmpacatuba.ce.gov.br/dadosabertosexportar?d=vereadores&a=&f=json');
                const data = await response.json();
                setVereadores(data)
                setSelectedVereador(data[0]); // Seleciona o primeiro vereador por padrão
            } catch (err) {
                setError('Falha ao carregar os dados dos vereadores.');
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVereadores();
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

    const renderVereadorItem = ({ item }) => (
        <TouchableOpacity
            style={styles.vereadorItem}
            onPress={() => setSelectedVereador(item)}
        >
            <Image
                source={{ uri: item.Foto }}
                style={[styles.vereadorImage, selectedVereador && selectedVereador.Id === item.Id && styles.vereadorImageSelected]}
            />
            <Text style={styles.vereadorName}>{item.NomeParlamentar}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vereadores</Text>
            </View>
            {vereadores.length > 0 && (
                <FlatList
                    data={vereadores}
                    renderItem={renderVereadorItem}
                    keyExtractor={item => item.Id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.vereadoresList}
                />
            )}

            {selectedVereador && (
                <View style={styles.detailsContainer}>
                    <Image
                        source={{ uri: selectedVereador.Foto }}
                        style={styles.detailsImage}
                    />
                    <View style={styles.detailsContent}>
                        <Text style={styles.detailsName}>{selectedVereador.Nome}</Text>
                        <Text style={styles.detailsInfo}>
                            Cargo: {selectedVereador.Cargo}
                        </Text>
                        <Text style={styles.detailsInfo}>
                            Partido: {selectedVereador.Partido}
                        </Text>
                        <Text style={styles.biographyText}>
                            {selectedVereador.biografia}
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
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
    vereadoresList: {
        paddingHorizontal: 10,
        height: 50,
        marginBottom: 70,
    },
    vereadorItem: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    vereadorImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    vereadorImageSelected: {
        borderColor: '#007bff',
        borderWidth: 3,
        marginTop: 5,
        fontWeight: 'bold'
    },
    vereadorName: {
        marginTop: 5,
        fontSize: 10,
        textAlign: 'center',
        color: '#5f5f5fff',
    },
    detailsContainer: {
        height: 450,
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden',
    },
    detailsImage: {
        width: '100%',
        height: 350,
        resizeMode: 'cover',
    },
    detailsContent: {
        padding: 20,
    },
    detailsName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#080A6C',
    },
    detailsInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    biographyText: {
        fontSize: 14,
        color: '#555',
        marginTop: 15,
        lineHeight: 20,
        textAlign: 'justify',
    },
});

export default VereadoresScreen;
