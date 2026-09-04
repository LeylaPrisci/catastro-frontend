import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ProfesionalesPage } from "./pages/ProfesionalesPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h1>Catastro</h1>
            <p>Direccion de Catastro y Edificacion</p>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/profesionales" className={({ isActive }) => (isActive ? "active" : "")}>
              Profesionales
            </NavLink>
            <span>Tramites (proximamente)</span>
            <span>Expedientes (proximamente)</span>
          </nav>
        </aside>

        <div className="content">
          <Routes>
            <Route path="/" element={<ProfesionalesPage />} />
            <Route path="/profesionales" element={<ProfesionalesPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
