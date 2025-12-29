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

  // Default to first list
  const [activeId, setActiveId] = useState<string>(lists[0]?.id ?? "");
  const active = useMemo(
    () => lists.find((l) => l.id === activeId) ?? lists[0],
    [activeId, lists]
  );

  // Progress is just an array of booleans, one per step
  const [checked, setChecked] = useState<boolean[]>([]);

  // Load progress when active list changes
  useEffect(() => {
    if (!active) return;
    const raw = localStorage.getItem(storageKey(active.id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as boolean[];
        setChecked(
          active.steps.map((_, i) => Boolean(parsed[i]))
        );
        return;
      } catch {
        // fall through to reset
      }
    }
    setChecked(active.steps.map(() => false));
  }, [active?.id]);

  // Save progress whenever it changes
  useEffect(() => {
    if (!active) return;
    localStorage.setItem(storageKey(active.id), JSON.stringify(checked));
  }, [checked, active?.id]);

  if (!active) {
    return (
      <div className="container">
        <h1>Love Lists</h1>
        <p>No lists found yet.</p>
      </div>
    );
  }

  const done = checked.filter(Boolean).length;
  const total = active.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function reset() {
    setChecked(active.steps.map(() => false));
  }

  return (
    <div className="container">
      <h1>Love Lists</h1>
      <p>Life, thought through.</p>

      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ fontWeight: 700 }}>Choose a list:</label>
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              width: "100%",
              maxWidth: 420
            }}
          >
            {lists.map((l) => (
              <option value={l.id} key={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

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
  );
}
