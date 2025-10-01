import { initializeApp } from 'firebase/app';
// Importa as fun\u00e7\u00f5es Auth e Database
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth'; 
import { getDatabase } from 'firebase/database'; 

// ----------------------------------------------------
// 1. CONFIGURA\u00c7\u00c3O (Usando a configura\u00e7\u00e3o fornecida pelo Canvas)
// ----------------------------------------------------
// Pega a configura\u00e7\u00e3o do ambiente, mas usa a sua como fallback
let firebaseConfig;
if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
} else {
    // Sua configura\u00e7\u00e3o como fallback se n\u00e3o estiver no ambiente Canvas
    firebaseConfig = {
        apiKey: "AIzaSyDZCsp-Z_VsEsFA_3JcRC0lyFMSr3ETGUY",
        authDomain: "cm-pacatuba.firebaseapp.com", 
        projectId: "cm-pacatuba",
        databaseURL: "https://cm-pacatuba-default-rtdb.firebaseio.com", 
    };
}


// ----------------------------------------------------
// 2. INICIALIZA\u00c7\u00c3O CENTRALIZADA E EXPORTA\u00c7\u00c3O
// ----------------------------------------------------
console.log("Inicializando Firebase App...");

// Inicializa o App
export const app = initializeApp(firebaseConfig);

// Obt\u00e9m e exporta a inst\u00e2ncia de Auth
export const AUTH = getAuth(app); 

// Inicializa e exporta o Realtime Database
export const DB = getDatabase(app); 

console.log("Firebase App e servi\u00e7os prontos para uso.");

// ----------------------------------------------------
// 3. AUTENTICA\u00c7\u00c3O INICIAL (Garante que o usu\u00e1rio est\u00e1 autenticado para as regras de seguran\u00e7a)
// Esta fun\u00e7\u00e3o agora S\u00d3 \u00e9 executada se o token do ambiente existir.
// ----------------------------------------------------
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

if (initialAuthToken) {
    const initializeUser = async () => {
        try {
            // Usa a inst\u00e2ncia AUTH exportada
            await signInWithCustomToken(AUTH, initialAuthToken);
            console.log("Login inicial via token customizado OK.");
        } catch (e) {
            console.error("Erro CR\u00cdTICO na autentica\u00e7\u00e3o inicial:", e);
        }
    }
    initializeUser();
} else {
    // Se n\u00e3o houver token, tentamos o login an\u00f4nimo como backup (Regra de seguran\u00e7a exige um uid)
     const initializeUserAnon = async () => {
        try {
             await signInAnonymously(AUTH);
             console.log("Login inicial via an\u00f4nimo OK.");
        } catch (e) {
            console.warn("N\u00e3o foi poss\u00edvel fazer o login an\u00f4nimo. As fun\u00e7\u00f5es do app podem falhar se as regras do Firebase exigirem login.", e);
        }
    }
    initializeUserAnon();
}

// Nota: A \u00fanica coisa que o seu componente de login precisa importar \u00e9 o objeto AUTH.
// Exemplo de uso: import { AUTH } from './firebaseConfig';
