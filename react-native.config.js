module.exports = {
  // Define a raiz dos projetos nativos
  project: {
    ios: {
      // O diretório padrão do projeto iOS é 'ios'
      project: './ios/bluAppCamaraPacatuba.xcodeproj',
      // Define explicitamente para evitar o erro de 'null'
      automaticPodsInstallation: false,
    },
    android: {
      // O diretório padrão do projeto Android é 'android'
      sourceDir: './android'
    },
  },
  // Define os assets do projeto para o empacotador
  assets: ['./assets/fonts/'],
};
