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
    if(requestUserPermissions()){
      messaging()
      .getToken()
      .then(token => {
        console.log("Token FCM obtido:", token);
      });
    }else{
      console.log("Permissões de notificação não concedidas.");
    }

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notificação que abriu o app a partir do estado fechado:',
            remoteMessage.notification,
          );
        }
      });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notificação que abriu o app a partir do estado em segundo plano:',
        remoteMessage.notification,
      );
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('CM Pacatuba:', remoteMessage);
    });

    const unsubscribeNotification = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('Notificação recebida no foreground:', JSON.stringify(remoteMessage));
    });

    return unsubscribeNotification;



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

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

exports.sendExpoNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) return res.status(400).send('Missing params');

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).send('User not found');

    const token = userDoc.data().expoPushToken;
    if (!token) return res.status(400).send('No expo push token for user');

    // Build message
    const messages = [{
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }];

    // Chunk messages and send (expo-server-sdk handles batching)
    let tickets = [];
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        console.error('Error sending chunk', err);
      }
    }

    // You may want to store tickets for later receipts handling
    return res.status(200).json({ success: true, tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

// Nova função para enviar notificações usando o Firebase Cloud Messaging (FCM)
exports.sendPushNotification = functions.https.onRequest((req, res) => {
  const { deviceToken, title, body } = req.body;

  if (!deviceToken || !title || !body) {
    return res.status(400).send('deviceToken, title, and body are required');
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: deviceToken,
  };

  // Envia a notificação para o dispositivo específico
  admin.messaging().sendToDevice(deviceToken, { notification: { title, body } });

  return res.status(200).send('Notification sent');
});