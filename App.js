import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import messaging from '@react-native-firebase/messaging';

// MUDANÇA CRÍTICA: Importa os serviços JÁ INICIALIZADOS e estáveis
// Certifique-se de que AUTH e DB são exportados com "export { AUTH, DB }" em firebaseService.js
import { AUTH, DB } from './firebaseConfig'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, update } from 'firebase/database';

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

const requestUserPermissions = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL; 

    if (enabled) {
      console.log('Permissões de notificação concedidas:', authStatus);
    } else {
      console.log('Permissões de notificação negadas');
    }
    // CORREÇÃO: Retorna o status da permissão
    return enabled;
};

async function registerForPushNotificationsAsync(userId) {
  if (Device.isDevice) {
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

    try {
      // MUDANÇA: Obter o token NATIVO do dispositivo (FCM/APNs) em vez do token do Expo.
      // Este é o token que a sua Firebase Function (admin.messaging().sendToDevice) espera.
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;
      console.log("Token Nativo do Dispositivo (FCM/APNs):", token);

      // MUDANÇA: Salvar o token no caminho que a sua Firebase Function está lendo.
      // A função busca por 'devicePushToken', então vamos salvar com esse nome.
      const userRef = ref(DB, `users/${userId}`);
      await update(userRef, { devicePushToken: token });
      console.log('Token de notificação salvo para o usuário:', userId);

    } catch (e) {
      console.error("Erro ao obter e salvar o token de notificação:", e);
    }

  } else {
    console.log('É necessário um dispositivo físico para testar as notificações push.');

  }

  return token;
}

// O AppWrapper agora só lida com o estado de autenticação, não mais com a inicialização do Firebase
const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    // Função assíncrona para lidar com a configuração das notificações
    const setupNotifications = async (userId) => {
      const permissionsGranted = await requestUserPermissions();
      if (permissionsGranted) {
        console.log("Permissões de notificação concedidas.");
        // Registra o dispositivo para receber notificações push
        registerForPushNotificationsAsync(userId);

        // Listener para quando o app é aberto a partir de uma notificação (estado fechado)
        messaging().getInitialNotification().then(remoteMessage => {
          if (remoteMessage) {
            console.log('Notificação abriu o app (fechado):', remoteMessage.notification);
          }
        });

        // Listener para quando o app é aberto a partir de uma notificação (segundo plano)
        messaging().onNotificationOpenedApp((remoteMessage) => {
          console.log('Notificação abriu o app (segundo plano):', remoteMessage.notification);
        });
      } else {
        console.log("Permissões de notificação não concedidas.");
      }
    };

    // Configura o handler para notificações em background
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('CM Pacatuba:', remoteMessage);
    });

    // Listener para notificações recebidas com o app em primeiro plano
    const unsubscribeNotification = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('Notificação recebida no foreground:', JSON.stringify(remoteMessage));
    });

    // Listener principal para o estado de autenticação
    const unsubscribeAuth = onAuthStateChanged(AUTH, (currentUser) => {
        if (currentUser && currentUser.isAnonymous === false) { 
            setUser(currentUser);
            // Configura as notificações APÓS saber quem é o usuário
            setupNotifications(currentUser.uid);
            console.log(`Usuário autenticado: ${currentUser.uid}`);
        } else {
             setUser(null); 
             console.log("Nenhum usuário autenticado via e-mail/senha. Redirecionando para Login.");
        }
        // Esta é a chamada crucial que remove a tela de loading
        setIsLoading(false);
    });

    // Função de cleanup: será chamada quando o componente for desmontado.
    // Ela remove os dois listeners para evitar vazamentos de memória.
    return () => {
      unsubscribeAuth();
      unsubscribeNotification();
    };
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
