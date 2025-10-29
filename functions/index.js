const {onValueCreated} = require("firebase-functions/v2/database");
const admin = require("firebase-admin");

// Inicializa o app do admin para ter acesso ao Realtime Database
admin.initializeApp();
const {getDatabase} = require("firebase-admin/database");

exports.sendPanicNotification = onValueCreated(
    "/notifications/{notificationId}",
    async (event) => {
      // Pega os dados da nova notificação que foi criada
      const snapshot = event.data;
      const notificationData = snapshot.val();
      const {targetUserId, userId} = notificationData;

      // Verifica se temos um usuário alvo
      if (!targetUserId) {
        console.log("Notificação sem targetUserId. Ignorando.");
        return null;
      }

      console.log(`Nova notificação para o usuário: ${targetUserId}`);

      // Busca o nome do usuário que disparou o alerta
      let userName = "Um contato";
      if (userId) {
        const triggeringUserRef = getDatabase().ref(`/users/${userId}`);
        const triggeringUserSnapshot = await triggeringUserRef.once("value");
        const triggeringUserData = triggeringUserSnapshot.val();
        if (triggeringUserData && triggeringUserData.name) {
          userName = triggeringUserData.name;
        }
      }

      // Busca o token de notificação do usuário alvo no nó /users/{userId}
      const userRef = admin.database().ref(`/users/${targetUserId}`);
      const userSnapshot = await userRef.once("value");
      const userData = userSnapshot.val();

      if (!userData || !userData.expoPushToken) {
        console.log(
            `Usuário ${targetUserId} não tem um expoPushToken. Saindo.`,
        );
        return null;
      }

      const pushToken = userData.expoPushToken;
      console.log(`Encontrado token: ${pushToken}`);

      // Monta a mensagem da notificação
      const message = {
        to: pushToken,
        sound: "default",
        title: `🚨 ${userName.split(" ")[0]} precisa de ajuda!`,
        body: "Seu contato de confiança acionou o botão do pânico. Toque para ver os detalhes.",
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
