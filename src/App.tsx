import { useEffect, useMemo, useState } from "react";
import templates from "./templates.json";

type Template = {
  id: string;
  title: string;
  description: string;
  steps: string[];
};

function storageKey(listId: string) {
  return `lovelists_progress_${listId}`;
}

export default function App() {
  const lists = templates as Template[];

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(""); // empty = Explore view

  const active = useMemo(
    () => lists.find((l) => l.id === activeId) ?? null,
    [activeId, lists]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => {
      const hay = `${l.title} ${l.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, lists]);

  // checklist state for active list
  const [checked, setChecked] = useState<boolean[]>([]);

  // Load progress when active changes
  useEffect(() => {
    if (!active) return;
    const raw = localStorage.getItem(storageKey(active.id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as boolean[];
        setChecked(active.steps.map((_, i) => Boolean(parsed[i])));
        return;
      } catch {
        // fallthrough
      }
    }
    setChecked(active.steps.map(() => false));
  }, [active?.id]);

  // Save progress
  useEffect(() => {
    if (!active) return;
    localStorage.setItem(storageKey(active.id), JSON.stringify(checked));
  }, [checked, active?.id]);

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function reset() {
    if (!active) return;
    setChecked(active.steps.map(() => false));
  }

  // ---- Explore view ----
  if (!active) {
    return (
      <div className="container">
        <h1>Love Lists</h1>
        <p>Practical plans for real life. Pick a list to start.</p>

        <div className="card">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (declutter, school, wedding...)"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              fontSize: 14
            }}
          />
          <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Showing {filtered.length} of {lists.length}
          </p>
        </div>

        <div className="steps" style={{ marginTop: 16 }}>
          {filtered.map((l) => (
            <div
              key={l.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveId(l.id)}
              role="button"
              tabIndex={0}
            >
              <h2 style={{ marginTop: 0 }}>{l.title}</h2>
              <p>{l.description}</p>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 0 }}>
                {l.steps.length} steps • Tap to open
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Runner view ----
  const done = checked.filter(Boolean).length;
  const total = active.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setActiveId("")}
          style={{ background: "#5f809b" }}
        >
          ← Explore
        </button>
        <div style={{ fontWeight: 800 }}>Love Lists</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 style={{ marginTop: 0 }}>{active.title}</h2>
        <p>{active.description}</p>

        <div className="progressWrap">
          <div className="progressMeta">
            Progress: {done}/{total} ({pct}%)
          </div>
          <div className="progressBar">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="steps">
          {active.steps.map((step, i) => (
            <div
              key={i}
              className={`stepRow ${checked[i] ? "done" : ""}`}
              onClick={() => toggleStep(i)}
              role="button"
              tabIndex={0}
            >
              <input
                type="checkbox"
                checked={checked[i] || false}
                onChange={() => toggleStep(i)}
                onClick={(e) => e.stopPropagation()}
              />
              <div>{step}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={reset} style={{ background: "#5f809b" }}>
            Reset
          </button>
          <button disabled style={{ opacity: 0.7 }}>
            Use this list
          </button>
        </div>

        <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          ✅ Progress saves automatically on this device.
        </p>
      </div>
    </div>
  );
}
