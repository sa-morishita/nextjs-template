interface ActionError {
  serverError?: string;
  validationErrors?: {
    _errors?: string[];
    [key: string]: string[] | { _errors?: string[] } | undefined;
  };
}

/**
 * next-safe-actionのエラーからユーザー向けメッセージに変換
 */
export function convertActionErrorToMessage(
  error: ActionError | undefined,
  fallbackMessage: string,
): string {
  // Server Error (従来通り)
  if (error?.serverError) {
    return error.serverError;
  }

  // Validation Errors (新規対応)
  if (error?.validationErrors) {
    // ルートエラーを優先
    if (
      error.validationErrors._errors &&
      error.validationErrors._errors.length > 0
    ) {
      return error.validationErrors._errors[0];
    }

    // フィールドエラーから最初のものを取得
    const fieldErrors = Object.entries(error.validationErrors)
      .filter(([key]) => key !== '_errors')
      .map(([, value]) => {
        if (Array.isArray(value)) {
          return value[0];
        }
        if (value && typeof value === 'object' && '_errors' in value) {
          return (value._errors as string[])?.[0];
        }
        return null;
      })
      .filter(Boolean);

    if (fieldErrors.length > 0) {
      return fieldErrors[0] as string;
    }
  }

  // フォールバック
  return fallbackMessage;
}
