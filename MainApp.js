import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/Inicio';
import AgendamentoScreen from './screens/Agendamento';
import PerfilScreen from './screens/Perfil';
import NotificationsScreen from './screens/Notificacoes';

const Tab = createBottomTabNavigator();

const MainApp = () => {
    return (
        <Tab.Navigator
            initialRouteName="Inicio"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 10,
                    height: 60,
                    flex: 1,
                    paddingTop: 10,
                    alignContent: 'center',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 50,
                    backgroundColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 5,
                    margin: 15,
                },
                tabBarShowLabel: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Notificacoes') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Agendamento') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={25} color={focused ? '#FFB800' : '#808080'} />;
                },
            })}
        >
            <Tab.Screen name="Inicio" component={HomeScreen} />
            <Tab.Screen name="Agendamento" component={AgendamentoScreen} />
            <Tab.Screen name="Notificacoes" component={NotificationsScreen} />
            <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
    );
};

export default MainApp;
