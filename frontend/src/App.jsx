import { useState } from "react"
import MoodInput from "./components/MoodInput"
import PlaylistView from "./components/PlaylistView"
import { getMoodRecommendations } from "./services/api"

export default function App() {
  const [status, setStatus] = useState("idle")
  const [vibeSummary, setVibeSummary] = useState("")
  const [tracks, setTracks] = useState([])

  async function handleMoodSubmit(mood) {
    setStatus("loading")
    setTracks([])
    const { songs, vibe_summary } = await getMoodRecommendations(mood)
    setVibeSummary(vibe_summary)
    setTracks(songs)
    setStatus("ready")
  }

  return (
    <div>
      <MoodInput
        onSubmit={handleMoodSubmit}
        isLoading={status === "loading"}
      />
      {status === "ready" && (
        <PlaylistView vibeSummary={vibeSummary} tracks={tracks} />
      )}
    </div>
  )
}
