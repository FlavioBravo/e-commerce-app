/** API failure with the message and field details returned by the server. */
export class ApiError extends Error {
  details: Array<Record<string, string | number>>;

  constructor(message: string, details?: Array<Record<string, string | number>>) {
    super(message);
    this.details = details ?? [];
  }
}

/** Reads a failed response body into an `ApiError`. A body that is not JSON still produces an error. */
export async function readApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    details?: Array<Record<string, string | number>>;
  };
  return new ApiError(body.message ?? "The request failed.", body.details);
}
