import { createContext, Context } from 'react';
import { IOpenID4VCI } from '../lib/interfaces/IOpenID4VCI';

export const OpenID4VCIContext: Context<IOpenID4VCI | null> = createContext<IOpenID4VCI | null>(null);

export default OpenID4VCIContext;