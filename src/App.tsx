import { useEffect, useMemo, useState } from "react";
import templates from "./templates.json";

type Difficulty = "Easy" | "Medium" | "Hard";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  timeMins: number;
  difficulty: Difficulty;
  goodFor: string[];
  steps: string[];
};

function storageKey(listId: string) {
  return `lovelists_progress_${listId}`;
}

function formatTime(mins: number) {
  if (!mins || mins <= 0) return "";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.round((mins / 60) * 10) / 10; // 1 decimal
  return `${Number.isInteger(hrs) ? hrs : hrs} hrs`;
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

/* ---------------- Pills ---------------- */

function SmallPill({
  text,
  isSelected,
  onClick,
  stopPropagation,
}: {
  text: string;
  isSelected?: boolean;
  onClick?: () => void;
  stopPropagation?: boolean;
}) {
  const asButton = Boolean(onClick);
  const style: React.CSSProperties = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: isSelected ? "1px solid #003535" : "1px solid #e5e7eb",
    background: isSelected ? "rgba(0,53,53,0.08)" : "#fff",
    color: "#444",
    cursor: asButton ? "pointer" : "default",
    fontWeight: isSelected ? 800 : 600,
  };

  if (!asButton) return <span style={style}>{text}</span>;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.();
      }}
      style={style}
      aria-pressed={Boolean(isSelected)}
    >
      {text}
    </button>
  );
}

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
          <SmallPill
            key={tag}
            text={tag}
            isSelected={isSelected}
            onClick={() => onTagClick(tag)}
            stopPropagation
          />
        );
      })}
    </div>
  );
}

function GoodForPills({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {items.slice(0, 4).map((x) => (
        <span
          key={x}
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#555",
            fontWeight: 600,
          }}
        >
          {x}
        </span>
      ))}
    </div>
  );
}

function CategoryChips({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: string[];
  selectedCategory: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      <SmallPill
        text="All"
        isSelected={selectedCategory === ""}
        onClick={() => onSelect("")}
      />
      {categories.map((c) => (
        <SmallPill
          key={c}
          text={c}
          isSelected={selectedCategory === c}
          onClick={() => onSelect(c)}
        />
      ))}
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
  // Read progress for this list
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
  const timeLabel = formatTime(l.timeMins);

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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {timeLabel ? <SmallPill text={`⏱ ${timeLabel}`} /> : null}
        {l.difficulty ? <SmallPill text={`⚡ ${l.difficulty}`} /> : null}
      </div>

      <GoodForPills items={l.goodFor} />

      <TagPills tags={l.tags} selectedTag={selectedTag} onTagClick={onTagClick} />

      {/* Mini progress */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#444", fontWeight: 800 }}>
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
  const [selectedCategory, setSelectedCategory] = useState(""); // NEW
  const [activeId, setActiveId] = useState("");

  const active = useMemo(
    () => lists.find((l) => l.id === activeId) ?? null,
    [activeId, lists]
  );

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(lists.map((l) => l.category).filter(Boolean)));
    uniq.sort((a, b) => a.localeCompare(b));
    return uniq;
  }, [lists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tag = selectedTag.trim().toLowerCase();
    const cat = selectedCategory.trim().toLowerCase();

    return lists.filter((l) => {
      const matchesQuery = !q
        ? true
        : `${l.title} ${l.description} ${l.category} ${l.tags.join(" ")} ${
            l.goodFor?.join(" ") ?? ""
          }`.toLowerCase().includes(q);

      const matchesTag = !tag
        ? true
        : l.tags.some((t) => t.toLowerCase() === tag);

      const matchesCategory = !cat ? true : l.category.toLowerCase() === cat;

      return matchesQuery && matchesTag && matchesCategory;
    });
  }, [query, selectedTag, selectedCategory, lists]);

  const featured = useMemo(() => lists.slice(0, 3), [lists]);

  const featuredFiltered = useMemo(() => {
    // Featured but respecting current filters (tag/category/search)
    const ids = new Set(featured.map((x) => x.id));
    return filtered.filter((l) => ids.has(l.id));
  }, [featured, filtered]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, Template[]>();
    for (const l of filtered) {
      const k = l.category || "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(l);
    }
    // sort lists in each category by title
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.title.localeCompare(b.title));
      map.set(k, arr);
    }
    // sort categories by name
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

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

  function toggleTag(tag: string) {
    setSelectedTag((prev) =>
      prev.toLowerCase() === tag.toLowerCase() ? "" : tag
    );
  }

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

            <CategoryChips
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />

            <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
              Showing {filtered.length} of {lists.length}
            </p>

            {(selectedTag || selectedCategory) && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory("")}
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Category: {selectedCategory} ✕
                  </button>
                )}
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag("")}
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Tag: {selectedTag} ✕
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="sectionHead">
            <h3>Featured</h3>
            <div className="hint">Curated starters</div>
          </div>

          <div className="steps">
            {(featuredFiltered.length ? featuredFiltered : featured)
              .slice(0, 3)
              .map((l) => (
                <ListCard
                  key={l.id}
                  l={l}
                  selectedTag={selectedTag}
                  onOpen={setActiveId}
                  onTagClick={toggleTag}
                />
              ))}
          </div>

          <div className="sectionHead">
            <h3>Browse by category</h3>
            <div className="hint">Only showing matches</div>
          </div>

          {groupedByCategory.map(([cat, arr]) => (
            <div key={cat}>
              <div className="sectionHead" style={{ marginTop: 18 }}>
                <h3>{cat}</h3>
                <div className="hint">{arr.length} list{arr.length === 1 ? "" : "s"}</div>
              </div>
              <div className="steps">
                {arr.map((l) => (
                  <ListCard
                    key={l.id}
                    l={l}
                    selectedTag={selectedTag}
                    onOpen={setActiveId}
                    onTagClick={toggleTag}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ---------------- Runner ---------------- */

  const done = checked.filter(Boolean).length;
  const total = active.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const timeLabel = formatTime(active.timeMins);

  return (
    <>
      <Header mode="run" onBack={() => setActiveId("")} />
      <div className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{active.title}</h2>
          <p>{active.description}</p>

          <p style={{ fontSize: 12, color: "#666" }}>{active.category}</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {timeLabel ? <SmallPill text={`⏱ ${timeLabel}`} /> : null}
            {active.difficulty ? <SmallPill text={`⚡ ${active.difficulty}`} /> : null}
          </div>

          <GoodForPills items={active.goodFor} />

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
