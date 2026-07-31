const MUX_TOKEN_ID = Deno.env.get('MUX_TOKEN_ID')!
const MUX_TOKEN_SECRET = Deno.env.get('MUX_TOKEN_SECRET')!

export async function muxFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: {
      'Authorization': 'Basic ' + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Mux API error ${res.status}: ${JSON.stringify(body)}`)
  return body
}
