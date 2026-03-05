import { httpsCallable } from 'firebase/functions';
import { auth, cloudFunctions } from '../lib/firebase';

export type AdminOperationType =
  | 'broadcast'
  | 'test_sms'
  | 'test_push'
  | 'export'
  | 'notify_partners'
  | 'backup';

export interface AdminOperationInput {
  type: AdminOperationType;
  title?: string;
  body?: string;
  reportIds?: string[];
  partnerIds?: string[];
  meta?: Record<string, string | number | boolean | null>;
}

export interface AdminOperationResult {
  ok: boolean;
  actionId?: string;
  notificationsCreated?: number;
  analyticsDate?: string;
  type?: AdminOperationType;
}

function operationFunctionsEnabled() {
  return (import.meta.env.VITE_ADMIN_OPS_USE_FIREBASE_FUNCTIONS ?? 'false').toLowerCase() === 'true';
}

export async function runAdminOperation(
  input: AdminOperationInput,
): Promise<AdminOperationResult | null> {
  if (!operationFunctionsEnabled()) return null;
  if (!cloudFunctions || !auth?.currentUser) return null;

  const functionName = import.meta.env.VITE_ADMIN_OPS_FUNCTION_NAME ?? 'adminOperation';

  try {
    const callable = httpsCallable<AdminOperationInput, AdminOperationResult>(cloudFunctions, functionName);
    const response = await callable(input);
    return response.data ?? null;
  } catch {
    return null;
  }
}
