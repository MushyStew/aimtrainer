export default function NavBar({ mode, setMode }) {
  const tabs = ["play", "settings", "maps"];

  return (
    <div className="navbar">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={"nav-tab " + (mode === tab ? "active" : "")}
          onClick={() => setMode(tab)}
        >
          {tab.toUpperCase()}
        </div>
      ))}
    </div>
  );
}
