import httpx
import os
import asyncio

_token_cache: dict = {"token": None, "expires_at": 0}
_token_lock = asyncio.Lock()


async def get_access_token() -> str:
    import time
    async with _token_lock:
        if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
            return _token_cache["token"]

        client_id = os.getenv("SPOTIFY_CLIENT_ID")
        client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                auth=(client_id, client_secret),
            )
            data = res.json()
            if "access_token" not in data:
                raise ValueError(f"Spotify auth failed: {data}")
            _token_cache["token"] = data["access_token"]
            _token_cache["expires_at"] = time.time() + data["expires_in"] - 60
            return _token_cache["token"]


async def search_track(title: str, artist: str) -> dict | None:
    token = await get_access_token()
    queries = [
        f"track:{title} artist:{artist}",
        f"{title} {artist}",
        title,
    ]
    async with httpx.AsyncClient() as client:
        for q in queries:
            res = await client.get(
                "https://api.spotify.com/v1/search",
                params={"q": q, "type": "track", "limit": 1},
                headers={"Authorization": f"Bearer {token}"},
            )
            items = res.json().get("tracks", {}).get("items", [])
            if items:
                track = items[0]
                return {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                    "preview_url": track.get("preview_url"),
                    "external_url": track["external_urls"]["spotify"],
                }
    return None
