# Firebase Functions for Push Notifications

Este diretório contém funções Firebase que enviam push notifications via Expo Push Service.

Requisitos:
- Node.js 18 (Cloud Functions environment)
- Firebase CLI configurado e autenticado

Instalação e deploy:

```bash
cd functions
npm install
# Teste local com emuladores (opcional):
# firebase emulators:start --only functions,firestore

# Deploy das funções:
firebase deploy --only functions
```

Endpoints:
- `sendExpoNotification` (HTTP POST): recebe JSON { userId, title, body, data? }
  - Exemplo: `curl -X POST https://<REGION>-<PROJECT>.cloudfunctions.net/sendExpoNotification -H "Content-Type: application/json" -d '{"userId":"UID","title":"Teste","body":"Hello"}'`

Triggers:
- `onOutgoingMessage` (Firestore trigger): cria um documento em `outgoingMessages/{msgId}` com `{ userId, title, body, data? }` e a função envia a notificação automaticamente.

Observações:
- Guarde os "tickets" retornados pelo Expo se quiser processar receipts posteriormente.
- Em produção, configure FCM (Android) e APNs (iOS) nas credenciais do projeto Expo/EAS para garantir entrega em apps standalone.
