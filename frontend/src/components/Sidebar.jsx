import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard",             label: "Dashboard",        icon: "fa-solid fa-gauge",          end: true },
  { to: "/dashboard/cookie",      label: "Cookie Banner",    icon: "fa-solid fa-cookie-bite" },
  { to: "/dashboard/age-verify",  label: "Age Verification", icon: "fa-solid fa-shield-halved" },
  { to: "/dashboard/newsletter",  label: "Email Newsletter", icon: "fa-solid fa-envelope-open-text" },
  { to: "/dashboard/history",     label: "Page History",     icon: "fa-solid fa-clock-rotate-left" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{ background: "#1e293b", width: collapsed ? 64 : 240 }}
      className="min-h-screen flex flex-col transition-all duration-200 shrink-0"
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #334155" }}>
        {!collapsed && (
          <span className="font-extrabold text-white text-sm tracking-tight truncate">
            <i className="fa-solid fa-layer-group mr-2" style={{ color: "#6366f1" }} />
            LandingPageSaaS
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <i className={`fa-solid ${collapsed ? "fa-chevron-right" : "fa-chevron-left"} text-xs`} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
               ${isActive
                 ? "text-white"
                 : "text-slate-400 hover:text-white hover:bg-slate-700"
               }`
            }
            style={({ isActive }) => isActive ? { background: "#6366f1" } : {}}
          >
            <i className={`${item.icon} w-4 text-center shrink-0`} style={{ fontSize: 14 }} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}

        {/* Admin link */}
        {user?.role === "admin" && (
          <>
            <div className="my-3 mx-2" style={{ borderTop: "1px solid #334155" }} />
            <NavLink
              to="/admin"
              title={collapsed ? "Admin Panel" : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                 ${isActive ? "bg-red-600 text-white" : "text-red-400 hover:bg-slate-700 hover:text-red-300"}`
              }
            >
              <i className="fa-solid fa-user-shield w-4 text-center shrink-0" style={{ fontSize: 14 }} />
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User + logout */}
      <div className="px-2 py-3" style={{ borderTop: "1px solid #334155" }}>
        {!collapsed && (
          <div className="px-3 pb-2">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-right-from-bracket w-4 text-center shrink-0" style={{ fontSize: 14 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
