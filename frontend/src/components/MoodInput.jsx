import { useState } from "react"

const moods = [
  "late night drive, windows down",
  "lazy sunday morning with coffee",
  "heartbroken but pretending I am fine",
  "hype mode before a big moment",
  "nostalgic for a summer I cannot get back",
]

export default function MoodInput({ onSubmit, isLoading }) {
  const [mood, setMood] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    if (mood.trim()) onSubmit(mood.trim())
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Vibe Check</h1>
      <p style={styles.sub}>Describe your mood. Get a playlist that gets it.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          style={styles.textarea}
          placeholder='e.g. "driving alone at 2am, feeling everything at once"'
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          rows={3}
        />
        <button style={styles.submitBtn} type="submit" disabled={isLoading || !mood.trim()}>
          {isLoading ? "Finding your vibe..." : "Get Playlist"}
        </button>
      </form>

      <div style={styles.chips}>
        {moods.map((m) => (
          <button key={m} style={styles.chip} onClick={() => setMood(m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: { maxWidth: 640, margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" },
  title: { fontSize: 48, fontWeight: 700, letterSpacing: "-1px", marginBottom: 8 },
  sub: { color: "var(--muted)", marginBottom: 32, fontSize: 16 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  textarea: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
    color: "var(--text)", padding: "16px", fontSize: 15, resize: "none", outline: "none",
    fontFamily: "inherit",
  },
  submitBtn: {
    background: "var(--purple)", color: "#fff", border: "none",
    borderRadius: "var(--radius)", padding: "14px", fontSize: 16, fontWeight: 600,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 },
  chip: {
    background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--muted)",
    borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer",
  },
}
