export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Query {
  id: string;
  user_id: string;
  prompt: string;
  created_at: string;
}

export interface Run {
  id: string;
  query_id: string;
  model: 'chatgpt' | 'perplexity';
  response_text: string;
  created_at: string;
  user_id: string;
  mentions?: Mention[];
}

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Mention {
  id: string;
  run_id: string;
  brand_id: string;
  position: number;
  ranking: number;
  context: string;
  user_id: string;
  created_at: string;
}

export interface QueryWithRuns extends Query {
  runs: Run[];
}

export interface ComparisonResult {
  query: Query;
  runs: Run[];
  brands: Brand[];
} 

// User Profile Types
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  company?: string
  job_title?: string
  phone?: string
  role?: 'user' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
}

// API Key Management Types
export type ApiProvider = 'openai' | 'anthropic' | 'google' | 'perplexity'

export interface UserApiKey {
  id: string
  user_id: string
  provider: ApiProvider
  key_hint: string // Last 4 characters for display
  is_valid: boolean
  last_validated_at?: string
  created_at: string
  updated_at: string
}

export interface ApiKeyValidationResult {
  success: boolean
  message: string
  key_hint?: string
}

// Usage Tracking Types
export interface UserQueryUsage {
  id: string
  user_id: string
  free_queries_used: number
  last_free_query_at?: string
  created_at: string
  updated_at: string
}

export interface ApiKeyAccessLog {
  id: string
  user_id: string
  provider: ApiProvider
  action: 'create' | 'update' | 'delete' | 'validate' | 'use'
  ip_address?: string
  user_agent?: string
  created_at: string
}

// API Request/Response Types
export interface StoreApiKeyRequest {
  provider: ApiProvider
  api_key: string
}

export interface StoreApiKeyResponse {
  success: boolean
  message: string
  key_hint?: string
}

export interface UpdateProfileRequest {
  full_name?: string
  company?: string
  job_title?: string
  phone?: string
}

export interface FreeQueryStatus {
  has_free_queries: boolean
  queries_used: number
  queries_remaining: number
}

// Extended Query Result with API Key Source
export interface QueryResultWithSource {
  model: string
  success: boolean
  runId?: string
  response_text?: string
  mentions?: any[]
  brands?: string[]
  error?: string
  api_key_source: 'platform' | 'user'
  used_free_query?: boolean
}

// Provider Configuration for UI
export interface ApiProviderConfig {
  id: ApiProvider
  name: string
  description: string
  keyFormat: string
  validationUrl?: string
  documentationUrl: string
  icon: string
}

// Form Types
export interface ProfileFormData {
  full_name: string
  company: string
  job_title: string
  phone: string
}

export interface ApiKeyFormData {
  provider: ApiProvider
  api_key: string
}

// Security Types
export interface SecuritySettings {
  password_last_changed?: string
  two_factor_enabled: boolean
  last_login?: string
  failed_login_attempts: number
}

// API Response Types for Dashboard
export interface ApiQueryResult {
  runId?: string
  id?: string
  model: string
  response_text?: string
  responseText?: string
  mentions?: ApiMention[]
  success: boolean
  error?: string
  api_key_source?: 'platform' | 'user'
  used_free_query?: boolean
}

export interface ApiMention {
  rank: number
  brands: {
    name: string
  }
}

export interface ApiQueryResponse {
  success: boolean
  results: ApiQueryResult[]
  error?: string
  message?: string
  redirect_to?: string
}

// Historical Query Types
export interface HistoricalQuery {
  id: string
  prompt: string
  results: ApiQueryResult[]
  models: string[]
}

// Brand List Types
export interface BrandList {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface BrandListWithBrands extends BrandList {
  brands: Brand[]
} 