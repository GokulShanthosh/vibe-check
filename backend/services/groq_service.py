from groq import Groq
import json
import os

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def get_song_recommendations(mood: str, count: int = 8) -> dict:
    prompt = f"""You are an expert music curator. A user is feeling: "{mood}"

Recommend exactly {count} songs that perfectly match this vibe.
Return ONLY valid JSON in this exact format:
{{
  "vibe_summary": "2-sentence description of the overall vibe",
  "songs": [
    {{
      "title": "Song Title",
      "artist": "Artist Name",
      "reason": "One sentence why this fits the mood"
    }}
  ]
}}"""

    response = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)
