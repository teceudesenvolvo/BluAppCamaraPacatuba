import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// MUDANÇA CRÍTICA: Importa os servi\u00e7os J\u00c1 INICIALIZADOS e est\u00e1veis
// Certifique-se de que AUTH e DB s\u00e3o exportados com "export { AUTH, DB }" em firebaseService.js
import { AUTH } from './firebaseConfig'; 
import { onAuthStateChanged } from 'firebase/auth';

// Importa\u00e7\u00e3o dos Componentes de Tela
import LoginScreen from './screens/Login';
import CadastroScreen from './screens/Cadastro';
import MainApp from './MainApp';

// Telas de Sub-Paginas
import VereadoresScreen from './screens/SubPages/Vereadores';
import ProconScreen from './screens/SubPages/Procon';
import TvCamaraScreen from './screens/SubPages/TvCamara';
import LicitacoesScreen from './screens/SubPages/Licitacoes';

// Componente RealizarDenuncia (O nome da vari\u00e1vel de import deve corresponder ao export default)
import RealizarDenunciaScreen from './screens/RealizarDenuncia'; 

const Stack = createNativeStackNavigator();

// O AppWrapper agora s\u00f3 lida com o estado de autentica\u00e7\u00e3o, n\u00e3o mais com a inicializa\u00e7\u00e3o do Firebase
const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    // 1. O Listener usa a inst\u00e2ncia AUTH est\u00e1vel importada
    const unsubscribe = onAuthStateChanged(AUTH, (currentUser) => {
        // Se houver um usu\u00e1rio (e n\u00e3o for an\u00f4nimo, se essa for a regra)
        if (currentUser && currentUser.isAnonymous === false) { 
            setUser(currentUser);
            console.log(`Usu\u00e1rio autenticado: ${currentUser.uid}`);
        } else {
             setUser(null); 
             console.log("Nenhum usu\u00e1rio autenticado via email/senha. Redirecionando para Login.");
        }
        
        setIsLoading(false);
    });

    // Cleanup do listener
    return () => unsubscribe();
  }, []); // Depend\u00eancia vazia: roda apenas na montagem

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#080A6C" />
        <Text style={styles.loadingText}>Verificando status de autentica\u00e7\u00e3o...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "MainApp" : "Login"}> 
        
        {/* Telas de Autenticacao */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ headerShown: false }} />
        
        {/* Pagina Principal (com Tabs) */}
        <Stack.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />

        {/* Sub Paginas - Navegacao Secundaria */}
        <Stack.Screen name='Vereadores' component={VereadoresScreen} options={{headerShown: false}}/>
        <Stack.Screen name='TvCamara' component={TvCamaraScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Procon' component={ProconScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Licitacoes' component={LicitacoesScreen} options={{headerShown: false}}/>

        {/* TELA DE DEN\u00daNCIA */}
        <Stack.Screen name='RealizarDenuncia' component={RealizarDenunciaScreen} options={{headerShown: false}}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#080A6C',
    }
});

const App = AppWrapper;

export default App;
