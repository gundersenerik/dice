import Portkey from 'portkey-ai';
import { getModelConfig } from './models';

// Provider to Virtual Key mapping
const VIRTUAL_KEYS: Record<string, string | undefined> = {
  anthropic: process.env.PORTKEY_VIRTUAL_KEY_ANTHROPIC,
  openai: process.env.PORTKEY_VIRTUAL_KEY_OPENAI,
  google: process.env.PORTKEY_VIRTUAL_KEY_GOOGLE,
};

export interface PortkeyClientConfig {
  model: string;
  userId: string;
  sessionId?: string;
  traceId?: string;
  metadata?: Record<string, string>;
}

export function createPortkeyClient(config: PortkeyClientConfig) {
  const modelConfig = getModelConfig(config.model);

  if (!modelConfig) {
    throw new Error(`Unknown model: ${config.model}`);
  }

  const virtualKey = VIRTUAL_KEYS[modelConfig.provider];

  if (!virtualKey) {
    throw new Error(
      `No virtual key configured for provider: ${modelConfig.provider}`
    );
  }

  return new Portkey({
    apiKey: process.env.PORTKEY_API_KEY!,
    virtualKey: virtualKey,
    metadata: {
      _user: config.userId,
      session_id: config.sessionId || '',
      trace_id: config.traceId || '',
      environment: process.env.NODE_ENV || 'development',
      ...config.metadata,
    },
  });
}

export function getProviderForModel(model: string): string {
  const modelConfig = getModelConfig(model);
  return modelConfig?.provider || 'unknown';
}
