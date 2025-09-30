import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Formata a data e hora do formato ISO 8601 (2025-01-28T12:28:35) para DD/MM/YYYY às HH:MM
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

const VereadoresScreen = ({ navigation }) => {
    const [vereadores, setVereadores] = useState([]);
    const [selectedVereador, setSelectedVereador] = useState(null);
    const [materias, setMaterias] = useState([]);
    const [loadingVereadores, setLoadingVereadores] = useState(true);
    const [loadingMaterias, setLoadingMaterias] = useState(false);
    const [error, setError] = useState(null);

    // Carrega a lista de vereadores na montagem do componente
    useEffect(() => {
        const fetchVereadores = async () => {
            try {
                const response = await fetch('https://cmpacatuba.ce.gov.br/dadosabertosexportar?d=vereadores&a=&f=json&itens_por_pagina=20');
                const data = await response.json();
                setVereadores(data);
                if (data.length > 0) {
                    setSelectedVereador(data[0]); // Seleciona o primeiro vereador por padrão
                }
            } catch (err) {
                setError('Falha ao carregar os dados dos vereadores.');
                console.log(err);
            } finally {
                setLoadingVereadores(false);
            }
        };

        fetchVereadores();
    }, []);

    // Carrega as matérias quando um vereador é selecionado
    useEffect(() => {
        if (selectedVereador) {
            const fetchMaterias = async () => {
                setLoadingMaterias(true);
                setMaterias([]);
                try {
                    const response = await fetch(`https://www.cmpacatuba.ce.gov.br/dadosabertosexportar?d=materias&a=&f=json&vereador=${selectedVereador.Id}`);
                    const data = await response.json();
                    if (data && Array.isArray(data)) {
                        setMaterias(data.reverse()); // Inverte a ordem do array
                    } else {
                        setMaterias([]);
                    }
                } catch (err) {
                    console.error('Falha ao carregar as matérias:', err);
                    setMaterias([]);
                } finally {
                    setLoadingMaterias(false);
                }
            };
            fetchMaterias();
        }
    }, [selectedVereador]);

    if (loadingVereadores) {
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

    // Renderiza cada item da lista horizontal de vereadores
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

    // Renderiza cada item da lista de matérias
    const renderMateriaItem = ({ item }) => (
        <View style={styles.materiaCard}>
            <Text style={styles.materiaTitle}>{item.Materia}</Text>
            <Text style={styles.materiaInfo}>
                <Text style={styles.materiaInfoLabel}>Nº da Lei:</Text> {item.Numero || 'Não informado'}
            </Text>
            <Text style={styles.materiaInfo}>
                <Text style={styles.materiaInfoLabel}>Ementa:</Text> {item.Ementa}
            </Text>
            <Text style={styles.materiaInfo}>
                <Text style={styles.materiaInfoLabel}>Data:</Text> {formatDateAndTime(item.Data)}
            </Text>
            <Text style={styles.materiaInfo}>
                <Text style={styles.materiaInfoLabel}>Tipo:</Text> {item.Tipo?.toLowerCase() || 'Não informado'}
            </Text>
        </View>
    );

    return (
        <View style={styles.fullScreenContainer}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vereadores</Text>
            </View>
            <ScrollView style={styles.contentContainer}>
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
                        <View style={styles.detailsHeader}>
                            <Image
                                source={{ uri: selectedVereador.Foto }}
                                style={styles.detailsImage}
                            />
                            <View style={styles.detailsInfoContainer}>
                                <Text style={styles.detailsName}>{selectedVereador.Nome}</Text>
                                <Text style={styles.detailsInfo}>
                                    <Text style={styles.detailsInfoLabel}>Cargo:</Text> {selectedVereador.Cargo}
                                </Text>
                                <Text style={styles.detailsInfo}>
                                    <Text style={styles.detailsInfoLabel}>Partido:</Text> {selectedVereador.Partido}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.materiasContainer}>
                            <Text style={styles.materiasTitle}>Matérias Apresentadas</Text>
                            {loadingMaterias ? (
                                <ActivityIndicator size="small" color="#0000ff" />
                            ) : materias.length > 0 ? (
                                <FlatList
                                    data={materias}
                                    renderItem={renderMateriaItem}
                                    keyExtractor={(item, index) => item.Id || String(index)}
                                    scrollEnabled={false} // Desabilita o scroll da FlatList interna
                                />
                            ) : (
                                <Text style={styles.noMateriasText}>Nenhuma matéria encontrada para este vereador.</Text>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        paddingBottom: 20,
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
        height: 120, // Altura fixa para a lista horizontal
        marginTop: 10,
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
        marginBottom: 5,
    },
    vereadorImageSelected: {
        borderColor: '#080A6C',
        borderWidth: 3,
    },
    vereadorName: {
        fontSize: 10,
        textAlign: 'center',
        color: '#5f5f5f',
        width: 80,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 80,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        paddingVertical: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    detailsImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#080A6C',
        marginRight: 20,
        resizeMode: 'cover',
    },
    detailsInfoContainer: {
        flex: 1,
    },
    detailsName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#080A6C',
        marginBottom: 5,
    },
    detailsInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 3,
    },
    detailsInfoLabel: {
        fontWeight: 'bold',
    },
    biographyContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    biographyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    biographyText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        textAlign: 'justify',
    },
    materiasContainer: {
        paddingHorizontal: 20,
    },
    materiasTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    materiaCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    materiaTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#080A6C',
        marginBottom: 5,
    },
    materiaInfo: {
        fontSize: 12,
        color: '#666',
    },
    materiaInfoLabel: {
        fontWeight: 'bold',
    },
    noMateriasText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
        marginTop: 10,
    },
});

export default VereadoresScreen;
