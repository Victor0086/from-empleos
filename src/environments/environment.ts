export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '1b8c46cb-d440-4839-8a95-e876e2025d18',
      authority: 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/B2C_1_SUSI',
      redirectUri: 'http://localhost:4200/',
      postLogoutRedirectUri: 'http://localhost:4200/'
    }
  },
  apiConfig: {
    url: 'https://web-empleos-backend-1763998253344.azurewebsites.net/api',
    scopes: ['https://instantjobb2c.onmicrosoft.com/7dd9b923-7aec-407e-b352-7c349ff960a9/access_as_user']
  }
};
