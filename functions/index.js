const {onValueCreated} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

// Inicializa o app do admin para ter acesso ao Realtime Database
admin.initializeApp();

exports.sendPanicNotification = onValueCreated(
    "/notifications/{notificationId}",
    async (event) => {
      // Pega os dados da nova notificação que foi criada
      const snapshot = event.data;
      const notificationPayload = snapshot.val();
      const {targetUserId, tituloNotification, descricaoNotification} =
        notificationPayload;

      // Verifica se temos um usuário alvo
      if (!targetUserId) {
        console.log("Notificação sem targetUserId. Ignorando.");
        return null;
      }

      console.log(`Nova notificação para o usuário: ${targetUserId}`);

      // Busca o token de notificação do usuário alvo diretamente.
      // MUDANÇA: Buscar o token nativo do dispositivo
      const tokenRef = admin.database().ref(`/users/${targetUserId}/devicePushToken`);
      const tokenSnapshot = await tokenRef.once("value");
      const pushToken = tokenSnapshot.val();

      if (!pushToken) {
        console.log(
            `Usuário ${targetUserId} não tem um expoPushToken. Saindo.`,
        );
        return null;
      }

      console.log(`Encontrado token: ${pushToken}`);

      // Monta a mensagem "data-only" para ser processada pelo Notifee no app,
      // usando o formato do Firebase Admin SDK.
      const payload = {
        data: {
          // O Notifee usará estes dados para exibir a notificação
          title: tituloNotification || "Alerta de Emergência!",
          body: descricaoNotification || "Seu contato de confiança precisa de ajuda.",
          notificationId: event.params.notificationId,

          // Adiciona campos específicos para Notifee no Android
          "notifee_android_channel_id": "default",
          "notifee_android_press_action_id": "default",
        },
      };

      // Opções de envio, como prioridade alta para emergências.
      const options = {
        priority: "high",
        contentAvailable: true, // Para iOS, ajuda a "acordar" o app.
      };

      // Envia a notificação usando o Firebase Admin SDK
      try {
        const response = await admin.messaging().sendToDevice(pushToken, payload, options);
        console.log("Notificação enviada com sucesso:", response);
      } catch (error) {
        console.error("Erro ao enviar notificação via FCM:", error);
      }

      return null;
    },
);
