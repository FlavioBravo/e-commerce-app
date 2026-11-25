export function serverApiUrl(): string {
  return process.env.API_URL ?? "http://localhost:8000";
}

export function browserApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
