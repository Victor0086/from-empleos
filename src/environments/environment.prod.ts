export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: 'f836bdc5-14d0-4d55-836f-4ac0bdbb3d08',
      authority: 'https://grupo10duoc.b2clogin.com/grupo10duoc.onmicrosoft.com/B2C_1_grupo10Duoc',
      redirectUri: 'https://TU-DOMINIO-DEPLOY',
      knownAuthorities: ['grupo10duoc.b2clogin.com']
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
  },
  apiConfig: {
    scopes: ['https://grupo10duoc.onmicrosoft.com/api-demo/access_as_user'],
    protectedResourceMap: [
      ['https://API-DOMINIO-PRODUCCION', ['https://grupo10duoc.onmicrosoft.com/api-demo/access_as_user']]
    ]
  }
};
