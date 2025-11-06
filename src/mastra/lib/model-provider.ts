import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

// Model provider type
export type ModelProvider = 'openai' | 'gemini';

// Initialize Google Gemini with API key
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  // Google SDK akan menggunakan GEMINI_API_KEY dari environment variable
  // Atau bisa juga di-set secara eksplisit jika diperlukan
}

// Get model provider from environment variable
export function getModelProvider(): ModelProvider {
  const provider = process.env.MODEL_PROVIDER?.toLowerCase() || 'openai';
  
  // Check if API keys are available
  if (provider === 'gemini' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY not found, falling back to OpenAI');
    return 'openai';
  }
  
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found, falling back to Gemini');
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return 'gemini';
    }
    throw new Error('No API keys found. Please set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
  }
  
  return provider as ModelProvider;
}

// Get embedding provider (embedding models)
export function getEmbeddingProvider(): ModelProvider {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase() || 'openai';
  
  // Check if API keys are available
    if (provider === 'gemini' && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY not found for embeddings, falling back to OpenAI');
    return 'openai';
  }
  
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found for embeddings, falling back to Gemini');
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return 'gemini';
    }
    throw new Error('No API keys found for embeddings. Please set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
  }
  
  return provider as ModelProvider;
}

// Get language model based on provider
export function getLanguageModel(modelName?: string): LanguageModel {
  const provider = getModelProvider();
  
  // Default models
  const defaultModels = {
    openai: 'gpt-4o',
    gemini: 'gemini-2.5-pro',
  };
  
  const model = modelName || defaultModels[provider];
  
  switch (provider) {
    case 'gemini':
      // @ai-sdk/google akan otomatis menggunakan GOOGLE_GENERATIVE_AI_API_KEY  dari env
      return google(model);
    case 'openai':
    default:
      return openai(model);
  }
}

// Get embedding model
export function getEmbeddingModel(modelName?: string) {
  const provider = getEmbeddingProvider();
  
  // Default embedding models
  const defaultModels = {
    openai: 'text-embedding-3-small',
    gemini: 'text-embedding-004', // Gemini embedding model
  };
  
  const model = modelName || defaultModels[provider];
  
  switch (provider) {
    case 'gemini':
      return google.embedding(model);
    case 'openai':
    default:
      return openai.embedding(model);
  }
}

// Helper to get model name for logging
export function getModelProviderName(): string {
  return getModelProvider();
}

// Helper to get embedding provider name for logging
export function getEmbeddingProviderName(): string {
  return getEmbeddingProvider();
}

