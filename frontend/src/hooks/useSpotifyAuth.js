import { useState, useEffect } from "react"
import { exchangeCode } from "../services/spotify"

export function useSpotifyAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem("spotify_token"))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code && !token) {
      exchangeCode(code).then((t) => {
        setToken(t)
        window.history.replaceState({}, "", "/")
      })
    }
  }, [])

  return { token, isConnected: !!token }
}
