export class ApiError extends Error {
  details: Array<Record<string, string | number>>;

  constructor(message: string, details?: Array<Record<string, string | number>>) {
    super(message);
    this.details = details ?? [];
  }
}

export async function readApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    details?: Array<Record<string, string | number>>;
  };
  return new ApiError(body.message ?? "The request failed.", body.details);
}
