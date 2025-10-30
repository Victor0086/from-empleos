import { IPublicClientApplication, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { environment } from '../environments/environment';

// Crea la instancia principal de MSAL con la configuración de Azure
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(environment.msalConfig);
}

// Configuración para el guard de MSAL (control de rutas protegidas)
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect // o Popup si prefieres ventana emergente
  };
}

// Configuración para el interceptor que inyecta el token en las llamadas HTTP
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const map = new Map<string, Array<string>>();

  // 👇 for tipado correctamente como arreglo de tuplas [string, string[]]
  for (const [resource, scopes] of environment.apiConfig
           .protectedResourceMap as [string, string[]][]) {
    map.set(resource, scopes);
  }

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: map
  };
}