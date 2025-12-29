import { useEffect, useMemo, useState } from "react";
import templates from "./templates.json";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  steps: string[];
};

function storageKey(listId: string) {
  return `lovelists_progress_${listId}`;
}

/* ---------------- Header ---------------- */

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

/* ---------------- Tag Pills ---------------- */

function TagPills({
  tags,
  selectedTag,
  onTagClick,
}: {
  tags: string[];
  selectedTag: string;
  onTagClick: (tag: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {tags.slice(0, 8).map((tag) => {
        const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();

        return (
          <button
            key={tag}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag);
            }}
            aria-pressed={isSelected}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              border: isSelected
                ? "1px solid #003535"
                : "1px solid #e5e7eb",
              background: isSelected ? "rgba(0,53,53,0.08)" : "#fff",
              color: "#444",
              cursor: "pointer",
              fontWeight: isSelected ? 700 : 500,
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- List Card ---------------- */

function ListCard({
  l,
  selectedTag,
  onOpen,
  onTagClick,
}: {
  l: Template;
  selectedTag: string;
  onOpen: (id: string) => void;
  onTagClick: (tag: string) => void;
}) {
  // Read progress for this list (safe fallback)
  let done = 0;
  try {
    const raw = localStorage.getItem(storageKey(l.id));
    if (raw) {
      const arr = JSON.parse(raw) as boolean[];
      done = arr.filter(Boolean).length;
    }
  } catch {
    done = 0;
  }
  const total = l.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="card"
      style={{ cursor: "pointer" }}
      onClick={() => onOpen(l.id)}
      role="button"
      tabIndex={0}
    >
      <h2 style={{ marginTop: 0 }}>{l.title}</h2>
      <p>{l.description}</p>

      <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        {l.category} • {l.steps.length} steps
      </p>

      <TagPills
        tags={l.tags}
        selectedTag={selectedTag}
        onTagClick={onTagClick}
      />

      {/* Mini progress on the card */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#444", fontWeight: 700 }}>
          {done}/{total} done ({pct}%)
        </div>
        <div
          style={{
            height: 8,
            background: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "#16a34a",
            }}
          />
        </div>
      </div>

      <div className="cardAction">Open</div>
    </div>
  );
}


/* ---------------- App ---------------- */

export default function App() {
  const lists = templates as Template[];

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [activeId, setActiveId] = useState(""); // empty = Explore

  const active = useMemo(
    () => lists.find((l) => l.id === activeId) ?? null,
    [activeId, lists]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tag = selectedTag.trim().toLowerCase();

    return lists.filter((l) => {
      const matchesQuery = !q
        ? true
        : `${l.title} ${l.description} ${l.category} ${l.tags.join(
            " "
          )}`.toLowerCase().includes(q);

      const matchesTag = !tag
        ? true
        : l.tags.some((t) => t.toLowerCase() === tag);

      return matchesQuery && matchesTag;
    });
  }, [query, selectedTag, lists]);

  const featured = lists.slice(0, 2);

  /* -------- Checklist state -------- */

  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    if (!active) return;
    const raw = localStorage.getItem(storageKey(active.id));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as boolean[];
        setChecked(active.steps.map((_, i) => Boolean(parsed[i])));
        return;
      } catch {}
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

  /* ---------------- Explore ---------------- */

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
                padding: "12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />

            <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              Showing {filtered.length} of {lists.length}
            </p>

            {selectedTag && (
              <div style={{ marginTop: 8 }}>
                <strong style={{ fontSize: 12 }}>Filter:</strong>{" "}
                <button
                  onClick={() => setSelectedTag("")}
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {selectedTag} ✕
                </button>
              </div>
            )}
          </div>

          <div className="sectionHead">
            <h3>Featured</h3>
            <div className="hint">Tap to open</div>
          </div>

          <div className="steps">
            {featured.map((l) => (
              <ListCard
                key={l.id}
                l={l}
                selectedTag={selectedTag}
                onOpen={setActiveId}
                onTagClick={(tag) =>
                  setSelectedTag((prev) =>
                    prev.toLowerCase() === tag.toLowerCase() ? "" : tag
                  )
                }
              />
            ))}
          </div>

          <div className="sectionHead">
            <h3>All lists</h3>
            <div className="hint">Browse everything</div>
          </div>

          <div className="steps">
            {filtered.map((l) => (
              <ListCard
                key={l.id}
                l={l}
                selectedTag={selectedTag}
                onOpen={setActiveId}
                onTagClick={(tag) =>
                  setSelectedTag((prev) =>
                    prev.toLowerCase() === tag.toLowerCase() ? "" : tag
                  )
                }
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  /* ---------------- Runner ---------------- */

  const done = checked.filter(Boolean).length;
  const total = active.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <Header
        mode="run"
        onBack={() => {
          setActiveId("");
        }}
      />
      <div className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{active.title}</h2>
          <p>{active.description}</p>

          <p style={{ fontSize: 12, color: "#666" }}>{active.category}</p>

          <TagPills
            tags={active.tags}
            selectedTag={selectedTag}
            onTagClick={(tag) => {
              setActiveId("");
              setSelectedTag(tag);
            }}
          />

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
              >
                <input
                  type="checkbox"
                  checked={checked[i]}
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
