from fastapi import APIRouter, HTTPException
from models.schemas import MoodRequest, MoodResponse, Song
from services.groq_service import get_song_recommendations
from services.spotify_service import search_track
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["mood"])


@router.post("/mood", response_model=MoodResponse)
async def analyze_mood(request: MoodRequest):
    try:
        result = get_song_recommendations(request.mood, request.count)
    except Exception as e:
        logger.error(f"Groq error: {e}")
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")

    async def enrich(song_data: dict) -> Song:
        try:
            spotify = await search_track(song_data["title"], song_data["artist"])
        except Exception as e:
            logger.warning(f"Spotify search failed for {song_data['title']}: {e}")
            spotify = None
        return Song(**song_data, spotify=spotify)

    songs = await asyncio.gather(*[enrich(s) for s in result["songs"]])
    return MoodResponse(vibe_summary=result["vibe_summary"], songs=list(songs))
