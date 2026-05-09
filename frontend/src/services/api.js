import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function getMoodRecommendations(mood, count = 8) {
  const { data } = await axios.post(`${BASE_URL}/api/mood`, { mood, count })
  return data
}
