const BASE_URL = '/api';

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
  // SSR-skip: apiClient körs ENDAST i webbläsaren. Next server-renderar
  // klientkomponenter, men queryFn:s under SSR har ingen Clerk-session
  // (401 "Unauthorized" → hela sidan kastades till klientrendering med
  // felgräns). Ett aldrig-lösande promise håller Suspense-gränsen pågående
  // under SSR (skelettet streamas), och klienten gör själva hämtningen med
  // sessionens cookies — BFF-mönstret (cookies går inte att vidarebefordra
  // server-side). Relativa URL:er räcker då: alltid same-origin, cookies
  // skickas alltid, oavsett vilken host som surfas från.
  if (typeof window === 'undefined') {
    return new Promise<T>(() => {});
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
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
