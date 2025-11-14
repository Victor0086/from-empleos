export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: 'TU_CLIENT_ID_AQUI', // Reemplaza por el clientId de tu app en Azure AD
      authority: 'https://login.microsoftonline.com/tasgrupo1.onmicrosoft.com', // Tenant de Azure AD
      redirectUri: 'https://TU-DOMINIO-DEPLOY',
      knownAuthorities: ['login.microsoftonline.com']
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
  },
  apiConfig: {
    scopes: ['api://TU_CLIENT_ID_AQUI/access_as_user'], // Reemplaza por el scope de tu API registrada
    protectedResourceMap: [
      ['https://API-DOMINIO-PRODUCCION', ['api://TU_CLIENT_ID_AQUI/access_as_user']]
    ]
  }
};
