// Renders the admin's plain-text body: blank line = paragraph, "## " = heading, "- " lines = a list.
export function PostBody({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return <div className="post-body">
    {blocks.map((b, i) => {
      if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
      const lines = b.split("\n");
      if (lines.every(l => l.startsWith("- "))) return <ul key={i}>{lines.map((l, k) => <li key={k}>{l.slice(2)}</li>)}</ul>;
      return <p key={i}>{lines.map((l, k) => <span key={k}>{k > 0 && <br />}{l}</span>)}</p>;
    })}
  </div>;
}
