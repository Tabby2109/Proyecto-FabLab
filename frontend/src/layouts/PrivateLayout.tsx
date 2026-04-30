import { useEffect, useRef, useState } from "react";
import { Bell, CalendarPlus2, ClipboardList, FileText, FolderKanban, Home, LayoutDashboard, LogOut, Menu, Settings, Settings2, Shield, UserCircle2, Wrench } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/mis-proyectos", label: "Mis proyectos", icon: FolderKanban },
  { to: "/mis-solicitudes", label: "Mis solicitudes", icon: FileText },
  { to: "/mis-reservas", label: "Mis reservas", icon: CalendarPlus2 },
  { to: "/maquinas", label: "Maquinas", icon: Wrench },
  { to: "/nueva-solicitud", label: "Nueva solicitud", icon: Settings2 }
];

export function PrivateLayout() {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const visibleNavigation = [
    ...navigation,
    ...(["STAFF", "ADMIN"].includes(user?.role ?? "")
      ? [
          { to: "/staff/dashboard", label: "Dashboard staff", icon: LayoutDashboard },
          { to: "/staff/solicitudes", label: "Revision staff", icon: ClipboardList },
          { to: "/staff/materiales", label: "Inventario staff", icon: Shield }
        ]
      : []),
    { to: "/notificaciones", label: "Notificaciones", icon: Bell },
    ...(user?.role === "ADMIN"
      ? [
          { to: "/admin/materiales", label: "Admin materiales", icon: Shield },
          { to: "/admin/maquinas", label: "Admin maquinas", icon: Shield },
          { to: "/admin/tipos-maquina", label: "Tipos de maquina", icon: Shield }
        ]
      : [])
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function goToAccount() {
    setMenuOpen(false);
    navigate("/cuenta");
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-topbar-left">
          <BrandLogo compact />
          <button type="button" className="icon-button" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
        </div>

        <div className="portal-user-menu" ref={menuRef}>
          <button type="button" className="portal-bell-button" onClick={() => navigate("/notificaciones")} aria-label="Abrir notificaciones">
            <Bell size={18} />
            {unreadNotifications > 0 ? <span className="portal-bell-badge">{unreadNotifications}</span> : null}
          </button>

          <button type="button" className="portal-user" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-haspopup="menu">
            <UserCircle2 size={21} />
            <span>{user?.firstName ?? user?.name ?? "Cuenta"}</span>
          </button>

          {menuOpen ? (
            <div className="portal-user-dropdown" role="menu">
              <button type="button" className="portal-user-action" onClick={goToAccount}>
                <Settings size={20} strokeWidth={2} />
                <span>Ajustes</span>
              </button>

              <button type="button" className="portal-user-action" onClick={handleLogout}>
                <LogOut size={20} strokeWidth={2} />
                <span>Salir</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <aside className="portal-sidebar">
        <nav className="portal-nav">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "portal-link portal-link-active" : "portal-link")} end={item.to === "/"}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button type="button" className="portal-link portal-link-logout" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} />
          <span>Salir</span>
        </button>
      </aside>

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}
