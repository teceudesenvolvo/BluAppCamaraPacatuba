import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// MUDANÇA CRÍTICA: Importa os serviços JÁ INICIALIZADOS e estáveis
// Certifique-se de que AUTH e DB são exportados com "export { AUTH, DB }" em firebaseService.js
import { AUTH, DB } from './firebaseConfig'; 
import { onAuthStateChanged } from 'firebase/auth';

// Importação dos Componentes de Tela
import LoginScreen from './screens/Login';
import CadastroScreen from './screens/Cadastro';
import MainApp from './MainApp';

// Telas de Subpáginas
import VereadoresScreen from './screens/SubPages/Vereadores';
import ProconScreen from './screens/SubPages/Procon';
import TvCamaraScreen from './screens/SubPages/TvCamara';
import LicitacoesScreen from './screens/SubPages/Licitacoes';
import ProcuradoriaMulherScreen from './screens/SubPages/ProcuradoriaMulher';
import NotificacoesScreen from './screens/SubPages/Notificacoes';
import FormProcuradoriaScreen from './screens/SubPages/FormProcuradoria';
import ContatoConfiancaScreen from './screens/SubPages/ContatoConfianca';

// Página Agendamento
import AgendamentosScreen from './screens/SubPages/Agendamento'

// Componente RealizarDenuncia (O nome da variável de import deve corresponder ao export default)
import RealizarDenunciaScreen from './screens/SubPages/RealizarDenuncia'; 
import DenunciaScreen from './screens/SubPages/Denuncia'; 

const Stack = createNativeStackNavigator();

// Configura o comportamento da notificação quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Falha ao obter o token para notificações push!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);

    // Salva o token no perfil do usuário no Realtime Database
    const { ref, update } = await import('firebase/database');
    await update(ref(DB, `users/${userId}`), { expoPushToken: token });

  } else {
    alert('É necessário um dispositivo físico para testar notificações Push.');
  }

  return token;
}

// O AppWrapper agora só lida com o estado de autenticação, não mais com a inicialização do Firebase
const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    // 1. O Listener usa a instância AUTH estável importada
    const unsubscribe = onAuthStateChanged(AUTH, (currentUser) => {
        // Se houver um usuário (e não for anônimo, se essa for a regra)
        if (currentUser && currentUser.isAnonymous === false) { 
            setUser(currentUser);
            registerForPushNotificationsAsync(currentUser.uid); // Registra para notificações
            console.log(`Usuário autenticado: ${currentUser.uid}`);
        } else {
             setUser(null); 
             console.log("Nenhum usuário autenticado via e-mail/senha. Redirecionando para Login.");
        }
        
        setIsLoading(false);
    });

    // Cleanup do listener
    return () => unsubscribe();
  }, []); // Dependência vazia: roda apenas na montagem

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#080A6C" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "MainApp" : "Login"}> 
        
        {/* Telas de Autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ headerShown: false }} />
        
        {/* Página Principal (com Tabs) */}
        <Stack.Screen name="MainApp" component={MainApp} options={{ headerShown: false }} />

        {/* Subpáginas - Navegação Secundária */}
        <Stack.Screen name='Vereadores' component={VereadoresScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Procon' component={ProconScreen} options={{headerShown: false}}/>
        <Stack.Screen name='TvCamara' component={TvCamaraScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Licitacoes' component={LicitacoesScreen} options={{headerShown: false}}/>
        <Stack.Screen name='ProcuradoriaMulher' component={ProcuradoriaMulherScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Notificacoes' component={NotificacoesScreen} options={{headerShown: false}}/>
        <Stack.Screen name='FormProcuradoria' component={FormProcuradoriaScreen} options={{headerShown: false}}/>
        <Stack.Screen name='ContatoConfianca' component={ContatoConfiancaScreen} options={{headerShown: false}}/>

        {/* Página Agendamento */}
        <Stack.Screen name='Agendamento' component={AgendamentosScreen} options={{headerShown: false}}/>

        {/* TELA DE DENÚNCIA */}
        <Stack.Screen name='RealizarDenuncia' component={RealizarDenunciaScreen} options={{headerShown: false}}/>
        <Stack.Screen name='Denuncia' component={DenunciaScreen} options={{headerShown: false}}/>

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
