import templates from "./templates.json";

export default function App() {
  const list = templates[0]; // for now, just show the first list

  return (
    <div className="container">
      <h1>Love Lists</h1>
      <p>Life, thought through.</p>

      <div className="card">
        <h2>{list.title}</h2>
        <p>{list.description}</p>

        <ol>
          {list.steps.map((step, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {step}
            </li>
          ))}
        </ol>

        <button>Use this list</button>
      </div>
    </div>
  );
}
