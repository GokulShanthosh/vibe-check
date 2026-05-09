export default function TrackCard({ song }) {
  const spotify = song.spotify

  return (
    <div style={styles.card}>
      <div style={styles.info}>
        {spotify?.album_art && (
          <img src={spotify.album_art} alt={song.title} style={styles.art} />
        )}
        <div style={styles.text}>
          <div style={styles.title}>{song.title}</div>
          <div style={styles.artist}>{song.artist}</div>
          <div style={styles.reason}>{song.reason}</div>
          {spotify?.external_url && (
            <a href={spotify.external_url} target="_blank" rel="noreferrer" style={styles.link}>
              Open in Spotify ↗
            </a>
          )}
        </div>
      </div>
      {spotify?.id && (
        <iframe
          style={styles.player}
          src={`https://open.spotify.com/embed/track/${spotify.id}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      )}
    </div>
  )
}

const styles = {
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: 20, display: "flex",
    flexDirection: "column", gap: 12,
  },
  info: { display: "flex", gap: 14, alignItems: "flex-start" },
  art: { width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  text: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  title: { fontWeight: 600, fontSize: 16 },
  artist: { color: "var(--green)", fontSize: 14 },
  reason: { color: "var(--muted)", fontSize: 13, marginTop: 2 },
  link: { color: "var(--purple)", fontSize: 12, marginTop: 4, textDecoration: "none" },
  player: { borderRadius: 8, border: "none" },
}
