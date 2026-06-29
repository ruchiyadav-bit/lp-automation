import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const FEATURES = [
  { key: "ai_generation",    label: "AI Generation",     icon: "fa-solid fa-wand-magic-sparkles" },
  { key: "custom_templates", label: "Custom Templates",  icon: "fa-solid fa-swatchbook" },
  { key: "email_export",     label: "Email Export",      icon: "fa-solid fa-file-export" },
  { key: "analytics",        label: "Analytics",         icon: "fa-solid fa-chart-line" },
];

const emptyUser = { name: "", email: "", password: "", role: "user" };

export default function AdminPanel() {
  const [users, setUsers]     = useState([]);
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | { mode: "add"|"edit", user }
  const [formData, setFormData] = useState(emptyUser);
  const [saving, setSaving]   = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([api.get("/api/admin/users"), api.get("/api/admin/stats")]);
      setUsers(u.data); setStats(s.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setFormData(emptyUser); setFormError(""); setModal({ mode: "add" }); };
  const openEdit = (u) => {
    setFormData({ name: u.name, email: u.email, password: "", role: u.role });
    setFormError(""); setModal({ mode: "edit", user: u });
  };

  const submitForm = async () => {
    setFormError(""); setSaving(true);
    try {
      if (modal.mode === "add") {
        const { data } = await api.post("/api/admin/users", formData);
        setUsers(prev => [data, ...prev]);
      } else {
        await api.put(`/api/admin/users/${modal.user.id}`, formData);
        setUsers(prev => prev.map(u => u.id === modal.user.id ? { ...u, ...formData } : u));
      }
      setModal(null);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their data?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally { setDeletingId(null); }
  };

  const toggleFeature = async (userId, key, current) => {
    setTogglingId(`${userId}-${key}`);
    const userObj  = users.find(u => u.id === userId);
    const features = parseFeatures(userObj.features_enabled);
    const updated  = { ...features, [key]: !current };
    try {
      await api.put(`/api/admin/users/${userId}/features`, { features_enabled: updated });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, features_enabled: updated } : u));
    } finally { setTogglingId(null); }
  };

  const parseFeatures = (f) => {
    if (!f) return {};
    return typeof f === "string" ? JSON.parse(f) : f;
  };

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            <i className="fa-solid fa-user-shield mr-2" style={{ color: "#6366f1" }} />Admin Panel
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage users, roles, and feature access</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <i className="fa-solid fa-user-plus mr-2" />Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users",      value: stats.total_users,  icon: "fa-solid fa-users",     color: "#6366f1" },
          { label: "Pages Generated",  value: stats.total_pages,  icon: "fa-solid fa-file-code", color: "#0ea5e9" },
          { label: "Emails Captured",  value: stats.total_emails, icon: "fa-solid fa-inbox",     color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: s.color + "1a" }}>
              <i className={`${s.icon} text-lg`} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value ?? "—"}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-500" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Users ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <tr>
                  {["User", "Role", "Feature Toggles", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const features = parseFeatures(u.features_enabled);
                  return (
                    <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${u.role === "admin" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                          <i className={`${u.role === "admin" ? "fa-solid fa-crown" : "fa-solid fa-user"} text-xs`} />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {FEATURES.map(f => {
                            const on  = features[f.key] !== false;
                            const tid = `${u.id}-${f.key}`;
                            return (
                              <label key={f.key} className="flex items-center gap-2 cursor-pointer select-none">
                                <button
                                  disabled={togglingId === tid}
                                  onClick={() => toggleFeature(u.id, f.key, on)}
                                  className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-indigo-500" : "bg-slate-300"} disabled:opacity-50`}
                                >
                                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-4" : ""}`} />
                                </button>
                                <span className={`text-xs ${on ? "text-slate-700" : "text-slate-400"}`}>
                                  <i className={`${f.icon} mr-1`} />{f.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => openEdit(u)}
                            className="text-xs text-indigo-600 hover:underline font-medium text-left">
                            <i className="fa-solid fa-pen mr-1" />Edit
                          </button>
                          <button onClick={() => deleteUser(u.id)} disabled={deletingId === u.id}
                            className="text-xs text-red-500 hover:underline font-medium text-left disabled:opacity-40">
                            <i className="fa-solid fa-trash mr-1" />
                            {deletingId === u.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                <i className={`fa-solid ${modal.mode === "add" ? "fa-user-plus" : "fa-user-pen"} mr-2 text-indigo-500`} />
                {modal.mode === "add" ? "Add New User" : "Edit User"}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              {[
                { key: "name",     label: "Full Name", type: "text",     req: true },
                { key: "email",    label: "Email",     type: "email",    req: true },
                { key: "password", label: modal.mode === "add" ? "Password" : "New Password (leave blank to keep)", type: "password", req: modal.mode === "add" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {f.label}{f.req && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input type={f.type} required={f.req} className="input"
                    value={formData[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="input" value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitForm} disabled={saving} className="btn-primary">
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving…</>
                  : <><i className="fa-solid fa-floppy-disk mr-2" />{modal.mode === "add" ? "Create User" : "Save Changes"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
