export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: 'f836bdc5-14d0-4d55-836f-4ac0bdbb3d08', // ID de la app B2C en Azure AD B2C
      authority: 'https://grupo10duoc.b2clogin.com/grupo10duoc.onmicrosoft.com/B2C_1_grupo10Duoc', //política B2C de login/registro
      redirectUri: 'http://localhost:4200', 
      knownAuthorities: ['grupo10duoc.b2clogin.com'] 
    },
    cache: {
      cacheLocation: 'localStorage', // para SPAs
      storeAuthStateInCookie: false  
    }
  },
  apiConfig: {
    scopes: ['https://grupo10duoc.onmicrosoft.com/api-demo/access_as_user'], 
    protectedResourceMap: [
      ['http://localhost:8080', ['https://grupo10duoc.onmicrosoft.com/api-demo/access_as_user']]
    ]
  }
};
