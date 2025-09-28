interface ActionError {
  serverError?: string;
  validationErrors?: {
    _errors?: string[];
    [key: string]: string[] | { _errors?: string[] } | undefined;
  };
}

export function convertActionErrorToMessage(
  error: ActionError | undefined,
  fallbackMessage: string,
): string {
  if (error?.serverError) {
    return error.serverError;
  }

  if (error?.validationErrors) {
    if (
      error.validationErrors._errors &&
      error.validationErrors._errors.length > 0
    ) {
      return error.validationErrors._errors[0];
    }

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

  return fallbackMessage;
}
