const BASE_URL = '/api';
// SSR-säker fetch: relativa URL:er kraschar i Node (Next server-renderar
// klientkomponenter), så serverkontexten behöver en absolut bas.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

function buildUrl(endpoint: string): string {
  return APP_URL ? `${APP_URL}${BASE_URL}${endpoint}` : `${BASE_URL}${endpoint}`;
}

/** Error with the API's user-facing Swedish message (from the JSON body). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(endpoint), {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    // Routes answer with user-friendly Swedish messages ({ error }) — surface
    // them instead of a generic "API error: 402" so package limits, evening
    // add-on gates and validation all explain themselves in the toasts.
    let message = `API-fel: ${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Body wasn't JSON — keep the fallback message.
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}
