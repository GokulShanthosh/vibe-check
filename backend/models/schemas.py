from pydantic import BaseModel
from typing import List, Optional


class MoodRequest(BaseModel):
    mood: str
    count: int = 8


class SpotifyTrack(BaseModel):
    id: str
    name: str
    artist: str
    album_art: Optional[str] = None
    preview_url: Optional[str] = None
    external_url: str


class Song(BaseModel):
    title: str
    artist: str
    reason: str
    spotify: Optional[SpotifyTrack] = None


class MoodResponse(BaseModel):
    vibe_summary: str
    songs: List[Song]
