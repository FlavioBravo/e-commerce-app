/** Base URL used by Server Components. Defaults to the API on localhost. */
export function serverApiUrl(): string {
  return process.env.API_URL ?? "http://localhost:8000";
}

/** Base URL used by the browser. Defaults to the API on localhost. */
export function browserApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
