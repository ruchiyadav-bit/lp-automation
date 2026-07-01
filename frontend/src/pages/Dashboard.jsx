import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { downloadAsZip } from "../utils/zipHelper";

const TYPE_META = {
  cookie:            { label: "Cookie Banner",    icon: "fa-solid fa-cookie-bite",        color: "bg-blue-50 text-blue-700" },
  "age-verification":{ label: "Age Gate",         icon: "fa-solid fa-shield-halved",       color: "bg-purple-50 text-purple-700" },
  newsletter:        { label: "Newsletter",        icon: "fa-solid fa-envelope-open-text",  color: "bg-green-50 text-green-700" },
  landing:           { label: "Landing Page",     icon: "fa-solid fa-globe",               color: "bg-yellow-50 text-yellow-700" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState({ pages: 0, emails: 0, users: 0 });
  const [pages, setPages]     = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  // Google Sheet integration (read-only, set by admin)
  const [sheetUrl, setSheetUrl] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/pages"),
      api.get("/api/emails/stats"),
      user?.role === "admin" ? api.get("/api/admin/stats") : Promise.resolve({ data: {} }),
      api.get("/api/users/me/sheet")
    ]).then(([pRes, eRes, aRes, shRes]) => {
      const totalEmails = eRes.data.reduce((a, p) => a + Number(p.email_count), 0);
      setStats({ pages: pRes.data.length, emails: totalEmails, users: aRes.data?.total_users ?? "—" });
      setPages(pRes.data);
      setSheetUrl(shRes.data.sheet_webhook || "");
    }).finally(() => setLoading(false));
  }, [user]);

  const openPreview = async (page) => {
    const { data } = await api.get(`/api/pages/${page.id}`);
    setPreview(data);
  };

  const deletePage = async (id) => {
    if (!window.confirm("Delete this page?")) return;
    setDeleting(id);
    try {
      await api.delete(`/api/pages/${id}`);
      setPages(p => p.filter(x => x.id !== id));
    } finally { setDeleting(null); }
  };

  const redownload = async (page) => {
    const { data } = await api.get(`/api/pages/${page.id}`);
    downloadAsZip(data.html_content, `${page.type}-${page.id}`);
  };

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const MODULES = [
    { to: "/dashboard/cookie",     label: "Cookie Banner",    icon: "fa-solid fa-cookie-bite",        desc: "GDPR-compliant consent banners", feat: "cookie_banner" },
    { to: "/dashboard/age-verify", label: "Age Verification", icon: "fa-solid fa-shield-halved",       desc: "Full-page age verification gates", feat: "age_gate" },
    { to: "/dashboard/newsletter", label: "Email Newsletter", icon: "fa-solid fa-envelope-open-text",  desc: "AI-powered email campaigns", feat: "email_newsletter" },
  ];
  const features = typeof user?.features_enabled === "string"
    ? JSON.parse(user.features_enabled) : (user?.features_enabled || {});

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your pages</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pages Generated", value: stats.pages, icon: "fa-solid fa-file-code", color: "#6366f1" },
          { label: "Emails Captured", value: stats.emails, icon: "fa-solid fa-inbox", color: "#0ea5e9" },
          { label: "Total Users",     value: stats.users,  icon: "fa-solid fa-users", color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.color + "1a" }}>
              <i className={`${s.icon} text-lg`} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">
        <i className="fa-solid fa-cubes mr-2 text-indigo-500" />Modules
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {MODULES.map(m => {
          const enabled = features[m.feat] !== false;
          return (
            <Link key={m.to} to={enabled ? m.to : "#"}
              className={`card group transition-all hover:shadow-md hover:border-indigo-200 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
              <i className={`${m.icon} text-2xl mb-3`} style={{ color: "#6366f1" }} />
              <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{m.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
              {!enabled && <span className="badge bg-gray-100 text-gray-400 mt-2">Disabled</span>}
            </Link>
          );
        })}
      </div>

      {/* Google Sheet integration (read-only) */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">
        <i className="fa-solid fa-table-list mr-2 text-green-600" />Google Sheet
      </h2>
      <div className="card mb-10">
        {sheetUrl ? (
          <>
            <p className="text-sm text-slate-600 mb-2">
              <i className="fa-solid fa-circle-check mr-1 text-green-600" />
              <span className="font-medium text-green-600">Connected</span> — All captured emails are sent to the linked Google Sheet.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 break-all select-all">
              {sheetUrl}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              <i className="fa-solid fa-lock mr-1" />This URL is managed by the admin.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            <i className="fa-solid fa-circle-xmark mr-1" />No Google Sheet connected. Contact admin to set up the integration.
          </p>
        )}
      </div>

      {/* History table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">
          <i className="fa-solid fa-clock-rotate-left mr-2 text-indigo-500" />Recent Pages
        </h2>
        <Link to="/dashboard/history" className="text-xs text-indigo-600 hover:underline font-medium">
          View all <i className="fa-solid fa-arrow-right ml-1" />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-500" />
        </div>
      ) : pages.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <i className="fa-solid fa-file-circle-xmark text-4xl mb-3" />
          <p className="text-sm">No pages yet — try a module above!</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                {["Type", "Domain / Name", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 8).map(p => {
                const m = TYPE_META[p.type] || TYPE_META.landing;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3.5">
                      <span className={`badge ${m.color}`}>
                        <i className={`${m.icon} text-xs`} /> {m.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{p.domain || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{fmt(p.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3">
                        <button onClick={() => openPreview(p)}
                          className="text-xs text-indigo-600 hover:underline font-medium">
                          <i className="fa-solid fa-eye mr-1" />Preview
                        </button>
                        <button onClick={() => redownload(p)}
                          className="text-xs text-slate-500 hover:underline font-medium">
                          <i className="fa-solid fa-download mr-1" />ZIP
                        </button>
                        <button onClick={() => deletePage(p.id)} disabled={deleting === p.id}
                          className="text-xs text-red-400 hover:underline font-medium disabled:opacity-40">
                          <i className="fa-solid fa-trash mr-1" />{deleting === p.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <span className="font-semibold text-slate-800">{preview.domain || "Page Preview"}</span>
              <div className="flex gap-3">
                <button onClick={() => downloadAsZip(preview.html_content, `${preview.type}-${preview.id}`)}
                  className="btn-secondary text-xs py-1.5 px-3">
                  <i className="fa-solid fa-download mr-1" />Download ZIP
                </button>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none px-1">×</button>
              </div>
            </div>
            <iframe srcDoc={preview.html_content} title="Preview" className="flex-1 w-full rounded-b-2xl" sandbox="allow-scripts" />
          </div>
        </div>
      )}
    </div>
  );
}
