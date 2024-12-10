export const appTokenAuthorizationHeader = () => `Bearer ${JSON.parse(sessionStorage.getItem('appToken'))}`;
