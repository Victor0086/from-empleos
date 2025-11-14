export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '7dd9b923-7aec-407e-b352-7c349ff960a9',
      authority: 'https://instantjobb2c.b2clogin.com/c5957026-1587-4782-82fe-9605c40565e1/v2.0/',
      knownAuthorities: ['instantjobb2c.b2clogin.com'],
      redirectUri: '/'
    }
  },
  apiConfig: {
    scopes: ['api://7dd9b923-7aec-407e-b352-7c349ff960a9/access_as_user'],
    uri: 'http://18.214.6.86:8080'
  }
};
