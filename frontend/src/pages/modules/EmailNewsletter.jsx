import React, { useState, useMemo, useEffect } from "react";
import api from "../../utils/api";
import Stepper from "../../components/Stepper";
import { EMAIL_TEMPLATES, generateDesktopLPPage, applyNewsletterAdvancedStyles } from "../../utils/templates";
import { downloadAsZip } from "../../utils/zipHelper";

const STEPS = ["Details", "Design", "Edit Content", "Preview & Save"];
const emptyContent = { headline: "", bodyCopy: "", ctaText: "Subscribe", redirectUrl: "" };

const defaultContent = (domain = "", topic = "") => ({
  headline: `Subscribe to ${domain || "our"} newsletter`,
  bodyCopy: `Sign up for ${topic || "exclusive offers"}, news and discounts from ${domain || "us"}.`,
  ctaText: "Subscribe",
  redirectUrl: ""
});

function TypographyRow({ title, form, setForm, sizeKey, weightKey, formatKey }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1.5">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Size (px)</label>
          <input type="number" className="input text-xs" placeholder="auto" value={form[sizeKey]}
            onChange={e => setForm({ ...form, [sizeKey]: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Weight</label>
          <select className="input text-xs" value={form[weightKey]}
            onChange={e => setForm({ ...form, [weightKey]: e.target.value })}>
            <option value="">Default</option>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
            <option value="800">Extrabold</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Format</label>
          <select className="input text-xs" value={form[formatKey]}
            onChange={e => setForm({ ...form, [formatKey]: e.target.value })}>
            <option value="normal">Normal</option>
            <option value="uppercase">Uppercase</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function EmailNewsletter() {
  const [step, setStep]         = useState(0);
  const [mode, setMode]         = useState(null); // "default" | "ai"
  const [form, setForm]         = useState({
    domain: "", topic: "",
    bgType: "color", bgColor: "", bgImage: "", bgOpacity: 0.6, image: "",
    advancedEnabled: false, headingColor: "", subColor: "", boxColor: "",
    btnColor: "", btnTextColor: "",
    fontSize: "", fontWeight: "", format: "normal",
    subFontSize: "", subFontWeight: "", subFormat: "normal",
    btnFontSize: "", btnFontWeight: "", btnFormat: "normal",
    boxRadius: "", btnRadius: ""
  });
  const [template, setTemplate] = useState(null);
  const [content, setContent]   = useState(emptyContent);
  const [tab, setTab]           = useState("preview");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [savedPageId, setSavedPageId] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Create LP for Desktop
  const [desktopLP, setDesktopLP] = useState(false);
  const [blogLP, setBlogLP]       = useState(null);
  const [lpDomain, setLpDomain]   = useState("");
  const [lpIndustry, setLpIndustry] = useState("");
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError]     = useState("");
  const [lpImage, setLpImage]     = useState(""); // user-uploaded blog image (overrides AI image)
  const [previewMode, setPreviewMode] = useState("desktop");

  const handleLpImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setLpImage(r.result);
    r.readAsDataURL(file);
  };

  // Connect with Google Sheet
  const [connectSheet, setConnectSheet] = useState(false);
  const [sheetWebhook, setSheetWebhook] = useState("");

  // Prefill the sheet webhook from the account-wide setting if present.
  useEffect(() => {
    api.get("/api/users/me/sheet").then(({ data }) => {
      if (data.sheet_webhook) setSheetWebhook(data.sheet_webhook);
    }).catch(() => {});
  }, []);

  // The signup popup (selected template + advanced styling). The form posts the
  // email to the Google Sheet webhook when "Connect with Sheet" is on.
  const emailHtml = useMemo(() => {
    if (!template || !content.headline) return "";
    const tmpl = EMAIL_TEMPLATES.find(t => t.id === template);
    const html = tmpl ? tmpl.generate({ ...form, ...content, actionUrl: connectSheet ? sheetWebhook.trim() : "" }) : "";
    if (!html) return "";
    return applyNewsletterAdvancedStyles(html, {
      enabled: form.advancedEnabled,
      headingColor: form.headingColor, subColor: form.subColor, boxColor: form.boxColor,
      btnColor: form.btnColor, btnTextColor: form.btnTextColor,
      fontSize: form.fontSize, fontWeight: form.fontWeight, format: form.format,
      subFontSize: form.subFontSize, subFontWeight: form.subFontWeight, subFormat: form.subFormat,
      btnFontSize: form.btnFontSize, btnFontWeight: form.btnFontWeight, btnFormat: form.btnFormat,
      boxRadius: form.boxRadius, btnRadius: form.btnRadius
    });
  }, [template, content, form, connectSheet, sheetWebhook]);

  // Image uploads (popup image + background image), from the user's system.
  const handlePopupImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const handleBgImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, bgImage: reader.result, bgType: "image" }));
    reader.readAsDataURL(file);
  };

  const lpActive = desktopLP && !!blogLP;
  const lpBlog = lpImage && blogLP ? { ...blogLP, imageUrl: lpImage } : blogLP;

  // Saved / downloaded output — real device detection on the live page.
  const outputHtml = useMemo(() =>
    lpActive ? generateDesktopLPPage({ blog: lpBlog, consentHtml: emailHtml, domain: lpDomain || form.domain }) : emailHtml,
    [lpActive, lpBlog, emailHtml, lpDomain, form.domain]);

  // In-app preview — forced by the desktop/phone toggle.
  const previewHtml = useMemo(() =>
    lpActive ? generateDesktopLPPage({ blog: lpBlog, consentHtml: emailHtml, domain: lpDomain || form.domain, mode: previewMode }) : emailHtml,
    [lpActive, lpBlog, emailHtml, lpDomain, form.domain, previewMode]);

  const generateLanding = async () => {
    const domain = (lpDomain || form.domain).trim();
    if (!domain) return;
    setLpError(""); setLpLoading(true);
    try {
      const { data } = await api.post("/api/generate/landing", { domain, industry: lpIndustry.trim() });
      setBlogLP(data);
    } catch (err) {
      setLpError(err.response?.data?.message || "Landing page generation failed");
    } finally { setLpLoading(false); }
  };

  const generate = async () => {
    setError(""); setGenerating(true);
    try {
      const { data } = await api.post("/api/generate", {
        domain: form.domain,
        type: "newsletter",
        templateName: EMAIL_TEMPLATES.find(t => t.id === template)?.name,
        extra: { topic: form.topic }
      });
      setContent(c => ({ ...c, ...data }));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed");
    } finally { setGenerating(false); }
  };

  const useDefault = () => { setContent(defaultContent(form.domain, form.topic)); setStep(2); };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/api/pages", {
        type: "newsletter", domain: form.domain, html_content: outputHtml,
        sheet_webhook: connectSheet ? sheetWebhook.trim() : ""
      });
      setSaved(true);
      setSavedPageId(data.id);
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  // Re-saving the output marks it unsaved again, then auto-save on the preview step.
  useEffect(() => { setSaved(false); }, [outputHtml]);
  useEffect(() => {
    if (step === 3 && outputHtml && !saved && !saving) save();
  }, [step, outputHtml]);

  const loadSubscribers = async () => {
    if (!savedPageId) return;
    setLoadingSubs(true);
    try {
      const { data } = await api.get(`/api/emails/${savedPageId}`);
      setSubscribers(data);
    } finally { setLoadingSubs(false); }
  };

  const exportFile = (type) => {
    const token = localStorage.getItem("token");
    window.open(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/emails/${savedPageId}/export/${type}?token=${token}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          <i className="fa-solid fa-envelope-open-text mr-2" style={{ color: "#6366f1" }} />Email Newsletter Generator
        </h1>
        <p className="text-slate-500 text-sm mt-1">Design professional email campaigns with AI</p>
      </div>

      <Stepper steps={STEPS} current={step} />

      {/* Step 0: Details */}
      {step === 0 && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-5">
            <i className="fa-solid fa-circle-info mr-2 text-indigo-500" />Campaign Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project name *</label>
              <input className="input" placeholder="e.g. Acme Monthly" value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })} />
              <p className="text-xs text-slate-400 mt-1">Used to save and identify this project.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Newsletter topic *</label>
              <input className="input" placeholder="Monthly update, Product launch, Summer sale…" value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })} />
            </div>

            {/* Create LP for Desktop */}
            <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={desktopLP}
                  onChange={e => { setDesktopLP(e.target.checked); setLpError(""); }}
                  className="w-4 h-4 accent-indigo-500" />
                <span className="text-xs font-semibold text-slate-700">
                  <i className="fa-solid fa-desktop mr-1.5 text-indigo-500" />Create LP for Desktop
                </span>
              </label>
              {desktopLP && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-3">Desktop visitors see an AI blog landing page; the email/signup shows on mobile.</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Domain *</label>
                      <input className="input text-sm" placeholder="e.g. acme.com" value={lpDomain}
                        onChange={e => setLpDomain(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Industry *</label>
                      <input className="input text-sm" placeholder="e.g. Fitness, Finance" value={lpIndustry}
                        onChange={e => setLpIndustry(e.target.value)} />
                    </div>
                  </div>
                  {blogLP ? (
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2">
                      <img src={blogLP.imageUrl} alt="" className="w-16 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{blogLP.title}</p>
                        <p className="text-xs text-slate-400 truncate">{blogLP.subtitle}</p>
                      </div>
                      <button type="button" onClick={generateLanding} disabled={lpLoading}
                        className="text-xs text-indigo-500 hover:text-indigo-600 whitespace-nowrap">
                        <i className="fa-solid fa-rotate mr-1" />Regenerate
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={generateLanding} disabled={lpLoading || !lpDomain.trim() || !lpIndustry.trim()}
                      className="btn-secondary text-xs">
                      {lpLoading
                        ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Generating landing page…</>
                        : <><i className="fa-solid fa-wand-magic-sparkles mr-1.5" />Generate blog landing page</>}
                    </button>
                  )}
                  {lpError && <p className="text-red-500 text-xs mt-2">{lpError}</p>}
                  {blogLP && (
                    <div className="mt-2">
                      {lpImage ? (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2">
                          <img src={lpImage} alt="" className="w-16 h-12 object-cover rounded" />
                          <span className="text-xs text-slate-600 flex-1">Your blog image</span>
                          <button type="button" onClick={() => setLpImage("")} className="text-xs text-red-400 hover:text-red-500">Remove</button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                          <i className="fa-solid fa-image" />Upload your own blog image
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleLpImage(e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connect with Google Sheet */}
            <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={connectSheet}
                  onChange={e => setConnectSheet(e.target.checked)}
                  className="w-4 h-4 accent-green-600" />
                <span className="text-xs font-semibold text-slate-700">
                  <i className="fa-solid fa-table-list mr-1.5 text-green-600" />Connect with Google Sheet
                </span>
              </label>
              {connectSheet && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Every email captured from this newsletter's signup will be appended to your Google Sheet.</p>
                  <input className="input text-sm" placeholder="https://script.google.com/macros/s/.../exec"
                    value={sheetWebhook} onChange={e => setSheetWebhook(e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Need a URL? Set it up on the Dashboard → Connect to Google Sheet.</p>
                </div>
              )}
            </div>

            <button className="btn-primary"
              disabled={!form.domain.trim() || !form.topic.trim() || lpLoading || (desktopLP && (!lpDomain.trim() || !lpIndustry.trim()))}
              onClick={async () => {
                if (desktopLP && !blogLP && lpDomain.trim() && lpIndustry.trim()) await generateLanding();
                setStep(1);
              }}>
              {lpLoading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Preparing…</> : <>Continue <i className="fa-solid fa-arrow-right ml-2" /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Design — mode chooser + templates */}
      {step === 1 && (
        <div>
          {!mode && (
            <div>
              <h2 className="font-semibold text-slate-800 mb-4">
                <i className="fa-solid fa-swatchbook mr-2 text-indigo-500" />How do you want to create this newsletter?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button onClick={() => setMode("default")}
                  className="card text-left p-6 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "#eef2ff" }}>
                    <i className="fa-solid fa-layer-group text-lg" style={{ color: "#6366f1" }} />
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">Use Default</p>
                  <p className="text-xs text-slate-500">Pick a template and edit the text yourself.</p>
                </button>
                <button onClick={() => setMode("ai")}
                  className="card text-left p-6 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "#1e293b" }}>
                    <i className="fa-solid fa-wand-magic-sparkles text-lg text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">Generate with AI</p>
                  <p className="text-xs text-slate-500">Pick a template, then let AI write the copy for your topic.</p>
                </button>
              </div>
              <button className="btn-secondary" onClick={() => setStep(0)}>
                <i className="fa-solid fa-arrow-left mr-2" />Back
              </button>
            </div>
          )}

          {mode && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">
                  <i className="fa-solid fa-swatchbook mr-2 text-indigo-500" />Choose a template
                </h2>
                <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => { setMode(null); setTemplate(null); }}>
                  <i className="fa-solid fa-rotate-left mr-1" />Change mode
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {EMAIL_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`card text-left p-3 transition-all hover:shadow-md cursor-pointer
                      ${template === t.id ? "ring-2 ring-indigo-500 border-indigo-200" : "hover:border-slate-300"}`}>
                    <div className="w-full h-28 rounded-lg mb-2 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      <iframe
                        srcDoc={t.generate({ headline: "Subscribe & Save", bodyCopy: "Sign up for exclusive offers and discounts.", ctaText: "Subscribe", domain: form.domain || "example.com" })}
                        title={t.name} sandbox=""
                        style={{ width: 760, height: 480, transform: "scale(0.245)", transformOrigin: "center", border: "none", pointerEvents: "none" }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                    {template === t.id && <i className="fa-solid fa-circle-check text-indigo-500 mt-1" />}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="flex gap-3 flex-wrap">
                <button className="btn-secondary" onClick={() => setStep(0)}>
                  <i className="fa-solid fa-arrow-left mr-2" />Back
                </button>
                {mode === "default" ? (
                  <button className="btn-primary" disabled={!template} onClick={useDefault}>
                    <i className="fa-solid fa-file-circle-check mr-2" />Use default content
                  </button>
                ) : (
                  <button className="btn-primary" disabled={!template || generating} onClick={generate}>
                    {generating ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Generating…</> : <><i className="fa-solid fa-wand-magic-sparkles mr-2" />Generate with AI</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Edit Content */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">
              <i className="fa-solid fa-pen-to-square mr-2 text-indigo-500" />Edit Content
            </h2>
            <div className="space-y-4">
              {[
                { key: "headline", label: "Heading",     tag: "input" },
                { key: "bodyCopy", label: "Sub-content", tag: "textarea" },
                { key: "ctaText",  label: "Button Text", tag: "input" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  {f.tag === "textarea"
                    ? <textarea rows={3} className="input resize-none text-sm" value={content[f.key] || ""}
                        onChange={e => setContent({ ...content, [f.key]: e.target.value })} />
                    : <input className="input text-sm" value={content[f.key] || ""}
                        onChange={e => setContent({ ...content, [f.key]: e.target.value })} />
                  }
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Redirect after subscribe (URL)</label>
                <input className="input text-sm" placeholder="blank = show a thank-you message" value={content.redirectUrl || ""}
                  onChange={e => setContent({ ...content, redirectUrl: e.target.value })} />
              </div>

              {/* Popup image */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-2"><i className="fa-solid fa-image mr-1.5 text-indigo-500" />Popup Image</p>
                <p className="text-xs text-slate-500 mb-2">Used by templates with a side image. Blank = default Unsplash image.</p>
                {form.image ? (
                  <div className="relative inline-block">
                    <img src={form.image} alt="popup" className="max-h-24 rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => setForm({ ...form, image: "" })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center hover:bg-slate-900">✕</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-lg py-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <i className="fa-solid fa-arrow-up-from-bracket text-slate-400" />
                    <span className="text-xs text-slate-500">Upload an image from your system</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePopupImage(e.target.files?.[0])} />
                  </label>
                )}
              </div>

              {/* Background behind popup */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-2"><i className="fa-solid fa-fill-drip mr-1.5 text-indigo-500" />Background (behind popup)</p>
                <div className="flex gap-2 mb-2">
                  <button type="button" className={`flex-1 text-xs font-semibold py-1.5 rounded-md border ${form.bgType === "color" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"}`} onClick={() => setForm({ ...form, bgType: "color" })}><i className="fa-solid fa-fill-drip mr-1" />Color</button>
                  <button type="button" className={`flex-1 text-xs font-semibold py-1.5 rounded-md border ${form.bgType === "image" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"}`} onClick={() => setForm({ ...form, bgType: "image" })}><i className="fa-solid fa-image mr-1" />Image</button>
                </div>
                {form.bgType === "color" ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bgColor || "#0f172a"} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                    <input className="input text-sm flex-1" placeholder="auto" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.bgImage ? (
                      <div className="relative inline-block">
                        <img src={form.bgImage} alt="bg" className="max-h-24 rounded-lg border border-slate-200" />
                        <button type="button" onClick={() => setForm({ ...form, bgImage: "" })} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center hover:bg-slate-900">✕</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-lg py-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                        <i className="fa-solid fa-arrow-up-from-bracket text-slate-400" />
                        <span className="text-xs text-slate-500">Choose an image from your system</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleBgImage(e.target.files?.[0])} />
                      </label>
                    )}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Dark overlay opacity: {form.bgOpacity}</label>
                      <input type="range" min="0" max="0.9" step="0.05" value={form.bgOpacity} onChange={e => setForm({ ...form, bgOpacity: parseFloat(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced styling */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.advancedEnabled} onChange={e => setForm({ ...form, advancedEnabled: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700"><i className="fa-solid fa-sliders mr-1.5 text-indigo-500" />Advanced — Heading, Sub-content &amp; Button</span>
                </label>
                {form.advancedEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "headingColor", label: "Heading Color" },
                        { key: "subColor",     label: "Sub-content Color" },
                        { key: "boxColor",     label: "Box Color" },
                        { key: "btnColor",     label: "Button Color" },
                        { key: "btnTextColor", label: "Button Text Color" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={form[f.key] || "#000000"} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                            <input className="input text-xs flex-1" placeholder="auto" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <TypographyRow title="Typography (Heading)" form={form} setForm={setForm} sizeKey="fontSize" weightKey="fontWeight" formatKey="format" />
                    <TypographyRow title="Typography (Sub-content)" form={form} setForm={setForm} sizeKey="subFontSize" weightKey="subFontWeight" formatKey="subFormat" />
                    <TypographyRow title="Typography (Button)" form={form} setForm={setForm} sizeKey="btnFontSize" weightKey="btnFontWeight" formatKey="btnFormat" />
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Corners</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Box radius</label>
                          <input type="number" className="input text-xs" placeholder="auto" value={form.boxRadius} onChange={e => setForm({ ...form, boxRadius: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Button radius</label>
                          <input type="number" className="input text-xs" placeholder="auto" value={form.btnRadius} onChange={e => setForm({ ...form, btnRadius: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                <i className="fa-solid fa-arrow-left mr-1" />Back
              </button>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Preview <i className="fa-solid fa-arrow-right ml-1" />
              </button>
            </div>
          </div>
          <div className="card self-start lg:sticky lg:top-6">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">
              <i className="fa-solid fa-eye mr-2 text-indigo-500" />Live Preview
            </h2>
            {emailHtml
              ? <iframe srcDoc={emailHtml} title="preview" className="w-full rounded-lg border border-slate-100" style={{ height: 340 }} sandbox="" />
              : <div className="flex items-center justify-center h-52 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">Fill fields to see preview</div>
            }
          </div>
        </div>
      )}

      {/* Step 3: Preview + save + subscribers */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-slate-800">
              <i className="fa-solid fa-eye mr-2 text-indigo-500" />Final Preview
            </h2>
            <div className="flex gap-2 flex-wrap items-center">
              {lpActive && (
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button onClick={() => setPreviewMode("desktop")} title="Desktop view"
                    className={`px-2.5 py-1 rounded-md text-sm ${previewMode === "desktop" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>
                    <i className="fa-solid fa-desktop" />
                  </button>
                  <button onClick={() => setPreviewMode("mobile")} title="Phone view"
                    className={`px-2.5 py-1 rounded-md text-sm ${previewMode === "mobile" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>
                    <i className="fa-solid fa-mobile-screen-button" />
                  </button>
                </div>
              )}
              <button onClick={() => setStep(2)} className="btn-secondary text-sm">
                <i className="fa-solid fa-arrow-left mr-1" />Edit
              </button>
              <button onClick={() => { setTab(tab === "preview" ? "code" : "preview"); }} className="btn-secondary text-sm">
                <i className={`fa-solid ${tab === "preview" ? "fa-code" : "fa-eye"} mr-1`} />
                {tab === "preview" ? "View HTML" : "View Preview"}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(outputHtml); }} className="btn-secondary text-sm">
                <i className="fa-solid fa-copy mr-1" />Copy HTML
              </button>
              <button onClick={() => downloadAsZip(outputHtml, `newsletter-${form.domain}`)} className="btn-secondary text-sm">
                <i className="fa-solid fa-download mr-1" />ZIP
              </button>
              <button onClick={save} disabled={saving || saved} className="btn-primary text-sm">
                {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1" />Saving…</>
                 : saved ? <><i className="fa-solid fa-check mr-1" />Saved!</>
                 :         <><i className="fa-solid fa-floppy-disk mr-1" />Save</>}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {tab === "preview" && lpActive && previewMode === "mobile" ? (
            <div className="flex justify-center bg-slate-100 rounded-xl py-6 mb-4" style={{ minHeight: 520 }}>
              <div className="bg-black rounded-[2rem] p-2 shadow-xl" style={{ width: 390 }}>
                <iframe srcDoc={previewHtml} title="Final preview (phone)" className="w-full bg-white rounded-[1.5rem]" style={{ height: 700 }} sandbox="allow-scripts" />
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden mb-4" style={{ height: 480 }}>
              {tab === "preview"
                ? <iframe srcDoc={previewHtml} title="Final preview" className="w-full h-full" sandbox="allow-scripts" />
                : <pre className="w-full h-full overflow-auto p-5 text-xs font-mono" style={{ background: "#0f172a", color: "#86efac" }}>{outputHtml}</pre>
              }
            </div>
          )}

          {/* Subscriber management (visible after save) */}
          {saved && savedPageId && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  <i className="fa-solid fa-inbox mr-2 text-indigo-500" />Subscribers
                  {connectSheet && sheetWebhook.trim() && (
                    <span className="ml-2 text-xs text-green-600 font-medium"><i className="fa-solid fa-table-list mr-1" />Syncing to Sheet</span>
                  )}
                </h3>
                <div className="flex gap-2">
                  <button onClick={loadSubscribers} disabled={loadingSubs} className="btn-secondary text-xs">
                    <i className="fa-solid fa-rotate mr-1" />Refresh
                  </button>
                  <button onClick={() => exportFile("csv")} className="btn-secondary text-xs">
                    <i className="fa-solid fa-file-csv mr-1" />Export CSV
                  </button>
                  <button onClick={() => exportFile("xlsx")} className="btn-primary text-xs">
                    <i className="fa-solid fa-file-excel mr-1" />Export Excel
                  </button>
                </div>
              </div>
              {subscribers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No subscribers yet. Embed the page on your site and share the link to collect emails.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th className="text-left py-2 text-xs text-slate-500 font-semibold uppercase">Email</th>
                    <th className="text-left py-2 text-xs text-slate-500 font-semibold uppercase">Subscribed</th>
                  </tr></thead>
                  <tbody>
                    {subscribers.map(s => (
                      <tr key={s.id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-700">{s.email}</td>
                        <td className="py-2 text-slate-400 text-xs">{new Date(s.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
