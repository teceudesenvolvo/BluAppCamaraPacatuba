import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ----------------------------------------------------
// 1. CONFIGURAÇÃO (Usando a configuração fornecida pelo Canvas)
// ----------------------------------------------------
// Pega a configuração do ambiente, mas usa a sua como fallback
let firebaseConfig;
if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
} else {
    // Sua configuração como fallback se não estiver no ambiente Canvas
    firebaseConfig = {
        apiKey: "AIzaSyA5KcFrQRsGJSClouZhv6pPi2--B-Rqba8",
        authDomain: "cm-pacatuba.firebaseapp.com", 
        projectId: "cm-pacatuba",
        databaseURL: "https://cm-pacatuba-default-rtdb.firebaseio.com",
        storageBucket: "cm-pacatuba.firebasestorage.app",
        messagingSenderId: "505753867545",
        appId: "1:505753867545:android:74ed46e034047c7d6f6188"
    };
}

// ----------------------------------------------------
// 2. INICIALIZAÇÃO CENTRALIZADA E EXPORTAÇÃO
// ----------------------------------------------------
console.log("Inicializando Firebase App...");

// Inicializa o App primeiro!
export const app = initializeApp(firebaseConfig);


// Inicializa o Auth com persistência AsyncStorage
export const AUTH = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Função utilitária para aguardar o usuário autenticado
export function waitForAuthUser(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        function check() {
            if (AUTH.currentUser) {
                resolve(AUTH.currentUser);
            } else if (Date.now() - start > timeout) {
                reject(new Error('Timeout esperando usuário autenticado.'));
            } else {
                setTimeout(check, 100);
            }
        }
        check();
    });
}


// Inicializa e exporta o Realtime Database
export const DB = getDatabase(app);

// Inicializa e exporta o Firestore
export const FIRESTORE = getFirestore(app);

console.log("Firebase App e serviços prontos para uso.");

// ----------------------------------------------------
// 3. AUTENTICAÇÃO INICIAL (Garante que o usuário está autenticado para as regras de segurança)
// Esta função agora SÓ é executada se o token do ambiente existir.
// ----------------------------------------------------
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

if (initialAuthToken) {
    const initializeUser = async () => {
        try {
            // Usa a instância AUTH exportada
            await signInWithCustomToken(AUTH, initialAuthToken);
            console.log("Login inicial via token customizado OK.");
        } catch (e) {
            console.error("Erro CRÍTICO na autenticação inicial:", e);
        }
    }
    initializeUser();
} else {
    // Se não houver token, tentamos o login anônimo como backup (Regra de segurança exige um uid)
     const initializeUserAnon = async () => {
        try {
             console.log("Não faça login anonimo se o token customizado estiver ausente.");
        } catch (e) {
            console.warn("Não foi possível fazer o login anônimo. As funções do app podem falhar se as regras do Firebase exigirem login.", e);
        }
    }
    initializeUserAnon();
}

// Nota: A única coisa que o seu componente de login precisa importar é o objeto AUTH.
// Exemplo de uso: import { AUTH } from './firebaseConfig';