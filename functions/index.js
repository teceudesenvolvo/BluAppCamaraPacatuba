/**
 * Arquivo unificado de Cloud Functions.
 *
 * Correções:
 * 1.  `admin.initializeApp()` é chamado apenas uma vez.
 * 2.  Todas as funções usam a sintaxe v2 para consistência.
 * 3.  A lógica de busca de token foi corrigida para usar o Realtime Database,
 *     que é onde o App.js está salvando o `devicePushToken`.
 * 4.  A função `sendExpoNotification` foi removida por ser obsoleta.
 * 5.  As importações foram consolidadas no topo do arquivo.
*/

const admin = require("firebase-admin");
const {onValueCreated} =
  require("firebase-functions/v2/database");
const {onRequest} =
  require("firebase-functions/v2/https");
const logger =
  require("firebase-functions/logger");

admin.initializeApp();

/**
 * Função acionada por trigger do Realtime Database.
 * Dispara quando um novo nó é criado em
 * /notifications/{notificationId}.
 */
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
        logger.log(
            "Notificação sem targetUserId. Ignorando.",
        );
        return null;
      }

      logger.log(
          `Nova notificação para o usuário: ${targetUserId}`,
      );

      // Caminho correto para o token salvo pelo App.js
      const tokenPath =
      `/users/${targetUserId}/devicePushToken`;

      const tokenRef = admin
          .database()
          .ref(tokenPath);

      const tokenSnapshot =
      await tokenRef.once("value");

      const pushToken = tokenSnapshot.val();

      if (!pushToken) {
        logger.warn(
            `Usuário ${targetUserId} não possui ` +
          "um devicePushToken. Saindo.",
        );
        return null;
      }

      logger.log(
          `Encontrado token: ${pushToken} ` +
        `para o usuário ${targetUserId}`,
      );

      const payload = {
        notification: {
          title:
          tituloNotification ||
          "Alerta de Emergência!",
          body:
          descricaoNotification ||
          "Seu contato precisa de ajuda.",
        },
        token: pushToken,
      };

      try {
        const response =
        await admin.messaging().send(payload);

        logger.log(
            "Notificação enviada com sucesso:",
            response,
        );
      } catch (error) {
        logger.error(
            "Erro ao enviar notificação via FCM:",
            error,
        );
      }

      return null;
    },
);

/**
 * Função acionada por HTTPS.
 * Permite enviar uma notificação a um dispositivo
 * específico via requisição web.
 */
exports.sendPushNotification = onRequest(
    async (req, res) => {
      const {
        deviceToken,
        title,
        body,
      } = req.body;

      if (!deviceToken || !title || !body) {
        logger.warn(
            "Requisição incompleta. " +
          "Faltando deviceToken, title ou body.",
        );
        return res
            .status(400)
            .send(
                "Os campos 'deviceToken', 'title' e 'body' são " +
            "obrigatórios.",
            );
      }

      const payload = {
        notification: {
          title: title,
          body: body,
        },
        token: deviceToken,
      };

      try {
        const response =
        await admin.messaging().send(payload);

        logger.log(
            `Notificação HTTP enviada com sucesso para ` +
          `${deviceToken}:`,
            response,
        );

        res
            .status(200)
            .send("Notificação enviada com sucesso.");
      } catch (error) {
        logger.error(
            `Erro ao enviar notificação HTTP para ` +
          `${deviceToken}:`,
            error,
        );

        res
            .status(500)
            .send("Erro ao enviar notificação.");
      }
    },
);
