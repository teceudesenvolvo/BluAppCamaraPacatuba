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
      const tokenRef = admin.database()
          .ref(`/users/${targetUserId}/expoPushToken`);
      const tokenSnapshot = await tokenRef.once("value");
      const pushToken = tokenSnapshot.val();

      if (!pushToken) {
        console.log(
            `Usuário ${targetUserId} não tem um expoPushToken. Saindo.`,
        );
        return null;
      }

      console.log(`Encontrado token: ${pushToken}`);

      // Monta a mensagem da notificação
      const message = {
        to: pushToken,
        sound: "default",
        // Usa o título e body do payload da notificação
        title: tituloNotification || "Alerta de Emergência!",
        body: descricaoNotification ||
          "Seu contato de confiança precisa de ajuda.",
        data: {notificationId: event.params.notificationId},
      };

      // Envia a notificação usando a API da Expo
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const responseData = await response.json();
        console.log("Resposta da API da Expo:", responseData);

        if (responseData.data.status === "error") {
          console.error(
              `Erro ao enviar notificação para ${pushToken}:`,
              responseData.data.message,
          );
        } else {
          console.log(`Notificação enviada com sucesso para ${pushToken}`);
        }
      } catch (error) {
        console.error("Erro ao fazer a requisição para a API da Expo:", error);
      }

      return null;
    },
);
