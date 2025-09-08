import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


    



const BottomNav = ({ activePage, setActivePage, navigation }) => {
    
    const navInicio = () => {
        setActivePage('Inicio');
        navigation.navigate('Login');
    }

    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={navInicio}>
                <Ionicons name="home" size={25} color={activePage === 'Inicio' ? '#FFB800' : '#808080'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => setActivePage('Pesquisa')}>
                <Ionicons name="search" size={25} color={activePage === 'Pesquisa' ? '#FFB800' : '#808080'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => setActivePage('Denuncias')}>
                <Ionicons name="add-circle-outline" size={25} color={activePage === 'Denuncias' ? '#FFB800' : '#808080'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => setActivePage('Perfil')}>
                <Ionicons name="person" size={25} color={activePage === 'Perfil' ? '#FFB800' : '#808080'} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 80,
        borderRadius: 50,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        margin: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingHorizontal: 15,
    },
});

export default BottomNav;
