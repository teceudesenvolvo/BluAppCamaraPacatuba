const {onValueCreated} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPanicNotification = onValueCreated(
    "/notifications/{notificationId}",
    async (event) => {
      const snapshot = event.data;
      const notificationPayload = snapshot.val();

      const {
        targetUserId,
        tituloNotification,
        descricaoNotification,
      } = notificationPayload;

      if (!targetUserId) {
        console.log("Notificação sem targetUserId. Ignorando.");
        return null;
      }

      console.log(`Nova notificação para o usuário: ${targetUserId}`);

      const tokenPath = `/users/${targetUserId}/devicePushToken`;
      const tokenRef = admin.database().ref(tokenPath);
      const tokenSnapshot = await tokenRef.once("value");
      const pushToken = tokenSnapshot.val();

      if (!pushToken) {
        console.log(
            `Usuário ${targetUserId} não tem um expoPushToken. Saindo.`,
        );
        return null;
      }

      console.log(`Encontrado token: ${pushToken}`);

      const payload = {
        data: {
          title: tituloNotification || "Alerta de Emergência!",
          body:
          descricaoNotification ||
          "Seu contato de confiança precisa de ajuda.",
          notificationId: event.params.notificationId,
          notifee_android_channel_id: "default",
          notifee_android_press_action_id: "default",
        },
      };

      const options = {
        priority: "high",
        contentAvailable: true,
      };

      try {
        const response = await admin.messaging().sendToDevice(
            pushToken,
            payload,
            options,
        );
        console.log("Notificação enviada com sucesso:", response);
      } catch (error) {
        console.error("Erro ao enviar notificação via FCM:", error);
      }

      return null;
    },
);
