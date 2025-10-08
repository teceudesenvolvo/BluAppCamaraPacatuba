/**
 * Arquivo de configuração para o React Native CLI.
 * Corrigido para remover a chave 'project' dentro de 'project.ios', que causa o erro de validação.
 * A CLI agora descobrirá o caminho do projeto iOS automaticamente.
 */
module.exports = {
  // Define os assets do projeto para o empacotador
  assets: ['./assets/fonts/'],

  // Define a raiz dos projetos nativos
  project: {
    ios: {
      // A chave 'project' foi removida para corrigir o erro de validação.
      // A CLI usará automaticamente 'ios/bluAppCamaraPacatuba.xcodeproj'.
      automaticPodsInstallation: false,
    },
    android: {
      // O diretório padrão do projeto Android é 'android'
      sourceDir: './android'
    },
  },
};
