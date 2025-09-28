export interface BetterAuthError {
  message: string;
  status?: string;
  statusCode?: number;
  body?: unknown;
}

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function isBetterAuthError(error: unknown): error is BetterAuthError {
  return isErrorWithMessage(error);
}

function extractBodyMessage(error: BetterAuthError): string | null {
  if (!error.body || typeof error.body !== 'object') {
    return null;
  }

  if (
    'message' in error.body &&
    typeof (error.body as { message?: unknown }).message === 'string'
  ) {
    return (error.body as { message: string }).message;
  }

  return null;
}

function collectCandidateMessages(error: BetterAuthError): string[] {
  const candidates = new Set<string>();

  if (typeof error.message === 'string' && error.message.length > 0) {
    candidates.add(error.message);
  }

  const bodyMessage = extractBodyMessage(error);
  if (bodyMessage) {
    candidates.add(bodyMessage);
  }

  return Array.from(candidates);
}

export interface ErrorTranslationRule {
  match: (context: { message: string; error: BetterAuthError }) => boolean;
  translatedMessage: string;
}

export interface TranslateBetterAuthErrorOptions {
  defaultMessage: string;
  rules?: ErrorTranslationRule[];
}

export function translateBetterAuthError(
  error: BetterAuthError,
  options: TranslateBetterAuthErrorOptions,
): never {
  const messages = collectCandidateMessages(error);
  for (const rule of options.rules ?? []) {
    const matched = messages.some((message) =>
      rule.match({
        message,
        error,
      }),
    );

    if (matched) {
      throw new Error(rule.translatedMessage);
    }
  }

  throw new Error(options.defaultMessage);
}

export function logAuthError(context: string, error: unknown) {
  if (isBetterAuthError(error)) {
    console.error(`🔐 ${context} error:`, {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      body: error.body,
    });
  } else {
    console.error(`🔐 ${context} error:`, error);
  }
}
