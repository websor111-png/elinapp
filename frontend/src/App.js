import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #ddd6fe',
            color: '#1e293b',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '12px',
            borderRadius: '0.375rem',
          },
        }}
      />
    </div>
  );
}

export default App;
