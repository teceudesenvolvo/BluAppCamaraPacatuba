import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// CRUD
import LoginScreen from './screens/Login';
import CadastroScreen from './screens/Cadastro';

// Páginas Principais
import MainApp from './MainApp';

// Sub Páginas
import VereadoresScreen from './screens/SubPages/Vereadores';
import TvCamaraScreen from './screens/SubPages/TvCamara';
import ProconScreen from './screens/SubPages/Procon';
import LicitacoesScreen from './screens/SubPages/Licitacoes';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
        
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* CRUD */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ headerShown: false }} />
        
        {/* Páginas Principais */}
        <Stack.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />

        {/* Sub Páginas  */}
        <Stack.Screen name='Vereadores' component={VereadoresScreen} options={{headerShown: false}}/>
        <Stack.Screen name='TvCamara' component={TvCamaraScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Procon' component={ProconScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Licitacoes' component={LicitacoesScreen} options={{headerShown: false}}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;