import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("API error"));
  }, []);

  return (
    <div style={{ padding: "2 rem", fontFamily: "Arial" }}>
      <h1>AI-Powered Childcare Platform</h1>
      <p>Backend status: {status}</p>
    </div>
  )
}

export default App;