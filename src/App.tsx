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

function progressKey(listId: string) {
  return `lovelists_progress_${listId}`;
}

const SAVED_KEY = "lovelists_saved";
const RECENT_KEY = "lovelists_recent";
const RECENT_MAX = 8;

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

function writeStringArray(key: string, arr: string[]) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function formatTime(mins: number) {
  if (!mins || mins <= 0) return "";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.round((mins / 60) * 10) / 10;
  return `${Number.isInteger(hrs) ? hrs : hrs} hrs`;
}

function getProgress(list: Template) {
  let done = 0;
  try {
    const raw = localStorage.getItem(progressKey(list.id));
    if (raw) {
      const arr = JSON.parse(raw) as boolean[];
      done = Array.isArray(arr) ? arr.filter(Boolean).length : 0;
    }
  } catch {
    done = 0;
  }
  const total = list.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
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
  isSaved,
  onToggleSaved,
}: {
  l: Template;
  selectedTag: string;
  onOpen: (id: string) => void;
  onTagClick: (tag: string) => void;
  isSaved: boolean;
  onToggleSaved: (id: string) => void;
}) {
  const { done, total, pct } = getProgress(l);
  const timeLabel = formatTime(l.timeMins);

  return (
    <div
      className="card"
      style={{ cursor: "pointer" }}
      onClick={() => onOpen(l.id)}
      role="button"
      tabIndex={0}
    >
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>{l.title}</h2>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSaved(l.id);
          }}
          aria-label={isSaved ? "Unsave list" : "Save list"}
          title={isSaved ? "Saved" : "Save"}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 12,
            padding: "8px 10px",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          {isSaved ? "★" : "☆"}
        </button>
      </div>

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

/* ---------------- Accordion Category Section ---------------- */

function CategoryAccordion({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fff",
        padding: 10,
        marginTop: 12,
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          fontWeight: 800,
          color: "#222",
          padding: "6px 6px",
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 12, color: "#666", fontWeight: 700 }}>
          {count} list{count === 1 ? "" : "s"} ▾
        </span>
      </summary>

      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const lists = templates as Template[];

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeId, setActiveId] = useState("");

  const [savedIds, setSavedIds] = useState<string[]>(() =>
    readStringArray(SAVED_KEY)
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readStringArray(RECENT_KEY)
  );

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
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.title.localeCompare(b.title));
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const savedLists = useMemo(() => {
    const set = new Set(savedIds);
    return lists.filter((l) => set.has(l.id));
  }, [savedIds, lists]);

  const recentLists = useMemo(() => {
    const map = new Map(lists.map((l) => [l.id, l]));
    return recentIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .slice(0, RECENT_MAX) as Template[];
  }, [recentIds, lists]);

  function toggleTag(tag: string) {
    setSelectedTag((prev) =>
      prev.toLowerCase() === tag.toLowerCase() ? "" : tag
    );
  }

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const next = Array.from(set);
      writeStringArray(SAVED_KEY, next);
      return next;
    });
  }

  function addRecent(id: string) {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_MAX);
      writeStringArray(RECENT_KEY, next);
      return next;
    });
  }

  function openList(id: string) {
    setActiveId(id);
    addRecent(id);
  }

  /* -------- Checklist state -------- */

  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    if (!active) return;
    const raw = localStorage.getItem(progressKey(active.id));
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
    localStorage.setItem(progressKey(active.id), JSON.stringify(checked));
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
    const showSaved = savedLists.length > 0;
    const showRecent = recentLists.length > 0;

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
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
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

          {showSaved && (
            <>
              <div className="sectionHead">
                <h3>Saved</h3>
                <div className="hint">Your favourites</div>
              </div>
              <div className="steps">
                {savedLists.map((l) => (
                  <ListCard
                    key={l.id}
                    l={l}
                    selectedTag={selectedTag}
                    onOpen={openList}
                    onTagClick={toggleTag}
                    isSaved={savedIds.includes(l.id)}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            </>
          )}

          {showRecent && (
            <>
              <div className="sectionHead">
                <h3>Recent</h3>
                <div className="hint">Pick up where you left off</div>
              </div>
              <div className="steps">
                {recentLists.map((l) => (
                  <ListCard
                    key={l.id}
                    l={l}
                    selectedTag={selectedTag}
                    onOpen={openList}
                    onTagClick={toggleTag}
                    isSaved={savedIds.includes(l.id)}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            </>
          )}

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
                  onOpen={openList}
                  onTagClick={toggleTag}
                  isSaved={savedIds.includes(l.id)}
                  onToggleSaved={toggleSaved}
                />
              ))}
          </div>

          <div className="sectionHead">
            <h3>Browse by category</h3>
            <div className="hint">Tap to expand</div>
          </div>

          {groupedByCategory.map(([cat, arr]) => (
            <CategoryAccordion
              key={cat}
              title={cat}
              count={arr.length}
              defaultOpen={
                selectedCategory
                  ? cat.toLowerCase() === selectedCategory.toLowerCase()
                  : false
              }
            >
              <div className="steps">
                {arr.map((l) => (
                  <ListCard
                    key={l.id}
                    l={l}
                    selectedTag={selectedTag}
                    onOpen={openList}
                    onTagClick={toggleTag}
                    isSaved={savedIds.includes(l.id)}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            </CategoryAccordion>
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
  const isSaved = savedIds.includes(active.id);

  return (
    <>
      <Header mode="run" onBack={() => setActiveId("")} />
      <div className="container">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginTop: 0 }}>{active.title}</h2>
              <p>{active.description}</p>
            </div>

            <button
              type="button"
              onClick={() => toggleSaved(active.id)}
              aria-label={isSaved ? "Unsave list" : "Save list"}
              title={isSaved ? "Saved" : "Save"}
              style={{
                border: "1px solid #e5e7eb",
                background: "#fff",
                borderRadius: 12,
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                height: 40,
              }}
            >
              {isSaved ? "★" : "☆"}
            </button>
          </div>

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
