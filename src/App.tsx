import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ProfesionalesPage } from "./pages/ProfesionalesPage";
import { TramitesPage } from "./pages/TramitesPage";
import { ExpedienteDetallePage } from "./pages/ExpedienteDetallePage";
import { ExpedientesPage } from "./pages/ExpedientesPage";

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
            <NavLink to="/tramites" className={({ isActive }) => (isActive ? "active" : "")}>
              Tramites
            </NavLink>
            <NavLink to="/expedientes" className={({ isActive }) => (isActive ? "active" : "")}>
              Expedientes
            </NavLink>
          </nav>
        </aside>

        <div className="content">
          <Routes>
            <Route path="/" element={<ProfesionalesPage />} />
            <Route path="/profesionales" element={<ProfesionalesPage />} />
            <Route path="/tramites" element={<TramitesPage />} />
            <Route path="/expedientes" element={<ExpedientesPage />} />
            <Route path="/expedientes/:id" element={<ExpedienteDetallePage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
