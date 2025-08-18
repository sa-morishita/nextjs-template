/**
 * バリデーションエラーのテスト用アサーションヘルパー
 */

interface ValidationErrors {
  _errors?: string[];
  [key: string]:
    | {
        _errors: string[];
      }
    | string[]
    | undefined;
}

interface ValidationErrorObject {
  validationErrors: ValidationErrors;
}

/**
 * errorがバリデーションエラーかどうかをチェックする型ガード
 */
function isValidationError(error: unknown): error is ValidationErrorObject {
  return (
    error !== null &&
    typeof error === 'object' &&
    'validationErrors' in error &&
    typeof error.validationErrors === 'object' &&
    error.validationErrors !== null
  );
}

/**
 * バリデーションエラーのルートレベルエラーメッセージをアサートする
 */
export function expectValidationError(error: unknown, message: string): void {
  if (!isValidationError(error)) {
    throw new Error('Expected validation error object');
  }

  const errors = error.validationErrors._errors;
  if (!Array.isArray(errors)) {
    throw new Error('Expected _errors to be an array');
  }

  if (!errors.includes(message)) {
    throw new Error(
      `Expected error message "${message}" not found in: ${JSON.stringify(errors)}`,
    );
  }
}

/**
 * バリデーションエラーのフィールドレベルエラーメッセージをアサートする
 */
export function expectFieldValidationError(
  error: unknown,
  field: string,
  message: string,
): void {
  if (!isValidationError(error)) {
    throw new Error('Expected validation error object');
  }

  const fieldErrors = error.validationErrors[field];
  if (
    !fieldErrors ||
    typeof fieldErrors !== 'object' ||
    !('_errors' in fieldErrors)
  ) {
    throw new Error(`Expected field "${field}" to have validation errors`);
  }

  const errors = fieldErrors._errors;
  if (!Array.isArray(errors)) {
    throw new Error(`Expected ${field}._errors to be an array`);
  }

  if (!errors.includes(message)) {
    throw new Error(
      `Expected error message "${message}" not found in field "${field}": ${JSON.stringify(errors)}`,
    );
  }
}
