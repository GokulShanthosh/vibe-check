const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || "http://localhost:5173/callback"
const SCOPES = "streaming user-read-email user-read-private playlist-modify-public playlist-modify-private"

function generateCodeVerifier() {
  const array = new Uint32Array(56)
  crypto.getRandomValues(array)
  return Array.from(array, (d) => d.toString(16).padStart(2, "0")).join("")
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export async function initiateSpotifyLogin() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem("spotify_verifier", verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCode(code) {
  const verifier = sessionStorage.getItem("spotify_verifier")
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })
  const data = await res.json()
  sessionStorage.setItem("spotify_token", data.access_token)
  sessionStorage.setItem("spotify_refresh_token", data.refresh_token)
  return data.access_token
}

async function spotifyFetch(path) {
  const token = sessionStorage.getItem("spotify_token")
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function searchTrack(title, artist) {
  const q = encodeURIComponent(`track:${title} artist:${artist}`)
  const data = await spotifyFetch(`/search?q=${q}&type=track&limit=1`)
  return data.tracks?.items[0] || null
}

export async function getUserId() {
  const data = await spotifyFetch("/me")
  return data.id
}

export async function createPlaylist(userId, name, trackUris) {
  const token = sessionStorage.getItem("spotify_token")

  const playlistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, description: "Created by Vibe Check", public: false }),
  })
  const playlist = await playlistRes.json()

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ uris: trackUris }),
  })

  return playlist
}
