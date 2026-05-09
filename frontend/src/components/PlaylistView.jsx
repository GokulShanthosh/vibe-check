import TrackCard from "./TrackCard"

export default function PlaylistView({ vibeSummary, tracks }) {
  return (
    <div style={styles.wrapper}>
      <p style={styles.summary}>{vibeSummary}</p>
      <div style={styles.grid}>
        {tracks.map((t, i) => (
          <TrackCard key={i} song={t} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: { maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" },
  summary: { color: "var(--muted)", fontSize: 15, maxWidth: 600, lineHeight: 1.6, marginBottom: 32 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 },
}
