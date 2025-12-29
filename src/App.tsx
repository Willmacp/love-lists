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

function Header({
  mode,
  onBack,
}: {
  mode: "explore" | "run";
  onBack?: () => void;
}) {
  return (
    <div className="headerBar">
      <div className="headerInner">
        <div>
          <div className="brandTitle">Love Lists</div>
          <div className="brandSub">Life, thought through.</div>
        </div>

        {mode === "run" ? (
          <button className="pill" onClick={onBack}>
            ← Explore
          </button>
        ) : (
          <div className="pill">Demo</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const lists = templates as Template[];

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(""); // empty = Explore

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

  // Featured: first 2 lists (simple for now)
  const featured = useMemo(() => lists.slice(0, 2), [lists]);

  // checklist state
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    if (!active) return;
    const raw = localStorage.getItem(storageKey(active.id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as boolean[];
        setChecked(active.steps.map((_, i) => Boolean(parsed[i])));
        return;
      } catch {
        // ignore
      }
    }
    setChecked(active.steps.map(() => false));
  }, [active?.id]);

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

  // ---------------- Explore ----------------
  if (!active) {
    return (
      <>
        <Header mode="explore" />
        <div className="container">
          <div className="card">
            <p style={{ marginTop: 0 }}>
              Practical planning lists for everyday life and big moments.
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (declutter, school, wedding...)"
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              Showing {filtered.length} of {lists.length}
            </p>
          </div>

          <div className="sectionHead">
            <h3>Featured</h3>
            <div className="hint">Tap to open</div>
          </div>

          <div className="steps">
            {featured.map((l) => (
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
                <div className="cardAction">{l.steps.length} steps • Open</div>
              </div>
            ))}
          </div>

          <div className="sectionHead">
            <h3>All lists</h3>
            <div className="hint">Build your library over time</div>
          </div>

          <div className="steps">
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
                <div className="cardAction">{l.steps.length} steps • Open</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ---------------- Runner ----------------
  const done = checked.filter(Boolean).length;
  const total = active.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <Header mode="run" onBack={() => setActiveId("")} />
      <div className="container">
        <div className="card">
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
    </>
  );
}
