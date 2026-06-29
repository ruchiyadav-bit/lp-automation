import React, { useState, useMemo, useEffect } from "react";
import api from "../../utils/api";
import Stepper from "../../components/Stepper";
import { AGE_TEMPLATES, generateDesktopLPPage, applyAgeAdvancedStyles } from "../../utils/templates";
import { downloadAsZip } from "../../utils/zipHelper";

const STEPS = ["Site Details", "Design", "Edit Content", "Preview & Save"];

const emptyContent = {
  headline: "Age Verification",
  bodyCopy: "You must be 18 years or older to enter this site. Please verify your age to continue.",
  ctaText: "I am 18+",
  exitText: "Exit",
  confirmUrl: "",
  exitUrl: ""
};

const defaultAgeContent = (minAge = "18") => ({
  headline: "Age Verification",
  bodyCopy: `You must be ${minAge} years or older to enter this site. Please verify your age to continue.`,
  ctaText: "I am 18+",
  exitText: "Exit",
  confirmUrl: "",
  exitUrl: ""
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

export default function AgeVerification() {
  const [step, setStep]         = useState(0);
  const [mode, setMode]         = useState(null); // "default" | "ai"
  const [form, setForm]         = useState({
    domain: "", minAge: "18",
    bgType: "color", bgColor: "", bgImage: "", bgOpacity: 0.6,
    advancedEnabled: false, headingColor: "", subColor: "", boxColor: "",
    fontSize: "", fontWeight: "", format: "normal",
    subFontSize: "", subFontWeight: "", subFormat: "normal",
    confirmColor: "", confirmTextColor: "", exitColor: "", exitTextColor: "",
    btnFontSize: "", btnFontWeight: "", btnFormat: "normal",
    buttonWidth: "", buttonPaddingX: "", buttonPaddingY: "",
    boxRadius: "", btnRadius: "", boxShadow: ""
  });
  const [template, setTemplate] = useState(null);
  const [referenceImage, setReferenceImage] = useState(""); // base64 screenshot for AI mode
  const [content, setContent]   = useState(emptyContent);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  // "Create LP for Desktop" feature
  const [desktopLP, setDesktopLP] = useState(false);
  const [blogLP, setBlogLP]       = useState(null);
  const [lpDomain, setLpDomain]   = useState("");
  const [lpIndustry, setLpIndustry] = useState("");
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError]     = useState("");
  const [lpImage, setLpImage]     = useState(""); // user-uploaded blog image (overrides AI image)

  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"

  const lpBlog = lpImage && blogLP ? { ...blogLP, imageUrl: lpImage } : blogLP;
  const handleLpImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setLpImage(r.result);
    r.readAsDataURL(file);
  };

  // The age-gate page itself (the selected template + advanced styling).
  const consentHtml = useMemo(() => {
    if (!template || !content.headline) return "";
    const tmpl = AGE_TEMPLATES.find(t => t.id === template);
    const html = tmpl ? tmpl.generate({ ...form, ...content }) : "";
    if (!html) return "";
    return applyAgeAdvancedStyles(html, {
      enabled: form.advancedEnabled,
      headingColor: form.headingColor, subColor: form.subColor, boxColor: form.boxColor,
      fontSize: form.fontSize, fontWeight: form.fontWeight, format: form.format,
      subFontSize: form.subFontSize, subFontWeight: form.subFontWeight, subFormat: form.subFormat,
      confirmColor: form.confirmColor, confirmTextColor: form.confirmTextColor,
      exitColor: form.exitColor, exitTextColor: form.exitTextColor,
      btnFontSize: form.btnFontSize, btnFontWeight: form.btnFontWeight, btnFormat: form.btnFormat,
      buttonWidth: form.buttonWidth, buttonPaddingX: form.buttonPaddingX, buttonPaddingY: form.buttonPaddingY,
      boxRadius: form.boxRadius, btnRadius: form.btnRadius, boxShadow: form.boxShadow
    });
  }, [template, content, form]);

  const lpActive = desktopLP && !!blogLP;

  // Saved / downloaded output — real device detection on the live page.
  const outputHtml = useMemo(() =>
    lpActive ? generateDesktopLPPage({ blog: lpBlog, consentHtml, domain: lpDomain || form.domain }) : consentHtml,
    [lpActive, lpBlog, consentHtml, lpDomain, form.domain]);

  // In-app preview — forced by the desktop/phone toggle.
  const previewHtml = useMemo(() =>
    lpActive ? generateDesktopLPPage({ blog: lpBlog, consentHtml, domain: lpDomain || form.domain, mode: previewMode }) : consentHtml,
    [lpActive, lpBlog, consentHtml, lpDomain, form.domain, previewMode]);

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
        type: "age-verification",
        templateName: AGE_TEMPLATES.find(t => t.id === template)?.name,
        extra: { minAge: form.minAge, referenceImage: referenceImage || undefined }
      });
      // Copy fields only.
      setContent(c => ({
        ...c,
        ...(data.headline ? { headline: data.headline } : {}),
        ...(data.bodyCopy ? { bodyCopy: data.bodyCopy } : {}),
        ...(data.ctaText ? { ctaText: data.ctaText } : {}),
        ...(data.exitText ? { exitText: data.exitText } : {}),
      }));
      // If the AI extracted a design from the screenshot, apply it via advanced styling.
      const hasDesign = data.bgColor || data.boxColor || data.headingColor || data.confirmColor;
      if (hasDesign) {
        setForm(f => ({
          ...f,
          advancedEnabled: true,
          bgType: data.bgColor ? "color" : f.bgType,
          bgColor: data.bgColor || f.bgColor,
          boxColor: data.boxColor || f.boxColor,
          headingColor: data.headingColor || f.headingColor,
          subColor: data.subColor || f.subColor,
          confirmColor: data.confirmColor || f.confirmColor,
          confirmTextColor: data.confirmTextColor || f.confirmTextColor,
          exitColor: data.exitColor || f.exitColor,
          exitTextColor: data.exitTextColor || f.exitTextColor,
          fontWeight: data.headingWeight || f.fontWeight,
          subFontWeight: data.bodyWeight || f.subFontWeight,
          btnFontWeight: data.buttonWeight || f.btnFontWeight,
        }));
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed");
    } finally { setGenerating(false); }
  };

  const useDefault = () => { setContent(defaultAgeContent(form.minAge)); setStep(2); };

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result);
    reader.readAsDataURL(file);
  };

  // Background image upload (from the user's system) for the gate background.
  const handleBgImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, bgImage: reader.result, bgType: "image" }));
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith("image/"));
    if (item) handleImageFile(item.getAsFile());
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/api/pages", { type: "age-verification", domain: form.domain, html_content: outputHtml });
      setSaved(true);
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  // Editing the output marks it unsaved again (re-enables save + re-triggers auto-save).
  useEffect(() => { setSaved(false); }, [outputHtml]);

  // Auto-save to page history when the final preview becomes visible.
  useEffect(() => {
    if (step === 3 && outputHtml && !saved && !saving) save();
  }, [step, outputHtml]); // re-runs when reaching the preview step

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          <i className="fa-solid fa-shield-halved mr-2" style={{ color: "#6366f1" }} />Age Verification Generator
        </h1>
        <p className="text-slate-500 text-sm mt-1">Create a full-page age gate with AI</p>
      </div>

      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-5">
            <i className="fa-solid fa-globe mr-2 text-indigo-500" />Site Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project name *</label>
              <input className="input" placeholder="e.g. My Age Gate" value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })} />
              <p className="text-xs text-slate-400 mt-1">Used to save and identify this project.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Minimum age</label>
              <select className="input" value={form.minAge} onChange={e => setForm({ ...form, minAge: e.target.value })}>
                {["13", "16", "18", "21"].map(a => <option key={a} value={a}>{a}+</option>)}
              </select>
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
                  <p className="text-xs text-slate-500 mb-3">
                    Desktop visitors see an AI-generated blog landing page; the age gate only shows on mobile.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Domain *</label>
                      <input className="input text-sm" placeholder="e.g. acme.com" value={lpDomain}
                        onChange={e => setLpDomain(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Industry *</label>
                      <input className="input text-sm" placeholder="e.g. Fitness, Finance, Travel" value={lpIndustry}
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

            <button className="btn-primary"
              disabled={!form.domain.trim() || lpLoading || (desktopLP && (!lpDomain.trim() || !lpIndustry.trim()))}
              onClick={async () => {
                if (desktopLP && !blogLP && lpDomain.trim() && lpIndustry.trim()) {
                  await generateLanding();
                }
                setStep(1);
              }}>
              {lpLoading
                ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Generating landing page…</>
                : <>Continue <i className="fa-solid fa-arrow-right ml-2" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          {!mode && (
            <div>
              <h2 className="font-semibold text-slate-800 mb-4">
                <i className="fa-solid fa-swatchbook mr-2 text-indigo-500" />How do you want to create this age gate?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button onClick={() => setMode("default")}
                  className="card text-left p-6 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "#eef2ff" }}>
                    <i className="fa-solid fa-layer-group text-lg" style={{ color: "#6366f1" }} />
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">Use Default</p>
                  <p className="text-xs text-slate-500">Pick a ready-made template and edit the text yourself.</p>
                </button>
                <button onClick={() => { setMode("ai"); setTemplate("bold-center"); }}
                  className="card text-left p-6 hover:shadow-md hover:border-indigo-200 transition-all">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ background: "#1e293b" }}>
                    <i className="fa-solid fa-wand-magic-sparkles text-lg text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">Generate with AI</p>
                  <p className="text-xs text-slate-500">Upload a screenshot (optional) and let AI write the gate for you — no template picking needed.</p>
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
                  <i className="fa-solid fa-swatchbook mr-2 text-indigo-500" />
                  {mode === "default" ? "Choose a template" : "Generate with AI"}
                </h2>
                <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => { setMode(null); setTemplate(null); }}>
                  <i className="fa-solid fa-rotate-left mr-1" />Change mode
                </button>
              </div>

              {mode === "default" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {AGE_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={`card text-left p-3 transition-all hover:shadow-md cursor-pointer
                        ${template === t.id ? "ring-2 ring-indigo-500 border-indigo-200" : "hover:border-slate-300"}`}>
                      <div className="w-full h-28 rounded-lg mb-2 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                        <iframe
                          srcDoc={t.generate({ headline: "Age Verification", bodyCopy: "You must be 18 years or older to enter this site.", ctaText: "I am 18+", exitText: "Exit", domain: form.domain || "example.com" })}
                          title={t.name} sandbox=""
                          style={{ width: 700, height: 460, transform: "scale(0.27)", transformOrigin: "center", border: "none", pointerEvents: "none" }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                      {template === t.id && <i className="fa-solid fa-circle-check text-indigo-500 mt-1" />}
                    </button>
                  ))}
                </div>
              )}

              {mode === "ai" && (
                <div className="card max-w-lg mb-6">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    <i className="fa-solid fa-image mr-1.5 text-indigo-500" />Optional — match a screenshot
                  </p>
                  <p className="text-xs text-slate-500 mb-3">Upload or paste (Ctrl+V) a screenshot of an age gate you like — AI will match its tone and copy style.</p>
                  {referenceImage ? (
                    <div className="relative inline-block">
                      <img src={referenceImage} alt="Reference" className="max-h-32 rounded-lg border border-slate-200" />
                      <button type="button" onClick={() => setReferenceImage("")}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center hover:bg-slate-900">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label onPaste={handlePaste} tabIndex={0}
                      className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-lg py-5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors focus:outline-none focus:border-indigo-400">
                      <i className="fa-solid fa-arrow-up-from-bracket text-slate-400" />
                      <span className="text-xs text-slate-500">Click to upload, or click here and press Ctrl+V to paste</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => handleImageFile(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              )}

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
                  <button className="btn-primary" disabled={generating} onClick={generate}>
                    {generating ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Generating…</> : <><i className="fa-solid fa-wand-magic-sparkles mr-2" />Generate with AI</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">
              <i className="fa-solid fa-pen-to-square mr-2 text-indigo-500" />Edit Content
            </h2>
            <div className="space-y-4">
              {[
                { key: "headline", label: "Heading",        tag: "input" },
                { key: "bodyCopy", label: "Sub-content",    tag: "textarea" },
                { key: "ctaText",  label: "Confirm Button", tag: "input" },
                { key: "exitText", label: "Exit Button",    tag: "input" },
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

              {/* Per-button link URLs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Confirm Button URL</label>
                  <input className="input text-sm" placeholder="blank = enter site" value={content.confirmUrl || ""}
                    onChange={e => setContent({ ...content, confirmUrl: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Exit Button URL</label>
                  <input className="input text-sm" placeholder="e.g. https://google.com" value={content.exitUrl || ""}
                    onChange={e => setContent({ ...content, exitUrl: e.target.value })} />
                </div>
              </div>

              {/* Background */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  <i className="fa-solid fa-fill-drip mr-1.5 text-indigo-500" />Background
                </p>
                <div className="flex gap-2 mb-2">
                  <button type="button"
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-md border ${form.bgType === "color" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"}`}
                    onClick={() => setForm({ ...form, bgType: "color" })}>
                    <i className="fa-solid fa-fill-drip mr-1" />Dark Color
                  </button>
                  <button type="button"
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-md border ${form.bgType === "image" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-600 border-slate-200"}`}
                    onClick={() => setForm({ ...form, bgType: "image" })}>
                    <i className="fa-solid fa-image mr-1" />Image
                  </button>
                </div>
                {form.bgType === "color" ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bgColor || "#0f172a"}
                      onChange={e => setForm({ ...form, bgColor: e.target.value })}
                      className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                    <input className="input text-sm flex-1" placeholder="#0f172a" value={form.bgColor}
                      onChange={e => setForm({ ...form, bgColor: e.target.value })} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.bgImage ? (
                      <div className="relative inline-block">
                        <img src={form.bgImage} alt="background" className="max-h-28 rounded-lg border border-slate-200" />
                        <button type="button" onClick={() => setForm({ ...form, bgImage: "" })}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center hover:bg-slate-900">✕</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-lg py-5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                        <i className="fa-solid fa-arrow-up-from-bracket text-slate-400" />
                        <span className="text-xs text-slate-500">Choose an image from your system</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => handleBgImage(e.target.files?.[0])} />
                      </label>
                    )}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Dark overlay opacity: {form.bgOpacity}</label>
                      <input type="range" min="0" max="0.9" step="0.05" value={form.bgOpacity}
                        onChange={e => setForm({ ...form, bgOpacity: parseFloat(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced — Heading / Subheading / Buttons */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.advancedEnabled}
                    onChange={e => setForm({ ...form, advancedEnabled: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    <i className="fa-solid fa-sliders mr-1.5 text-indigo-500" />Advanced — Heading, Subheading &amp; Buttons
                  </span>
                </label>
                {form.advancedEnabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "headingColor",     label: "Heading Color" },
                        { key: "subColor",         label: "Subheading Color" },
                        { key: "boxColor",         label: "Box Color" },
                        { key: "confirmColor",     label: "Confirm Btn Color" },
                        { key: "confirmTextColor", label: "Confirm Text Color" },
                        { key: "exitColor",        label: "Exit Btn Color" },
                        { key: "exitTextColor",    label: "Exit Text Color" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={form[f.key] || "#000000"}
                              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                              className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                            <input className="input text-xs flex-1" placeholder="auto" value={form[f.key]}
                              onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <TypographyRow title="Typography (Heading)" form={form} setForm={setForm}
                      sizeKey="fontSize" weightKey="fontWeight" formatKey="format" />
                    <TypographyRow title="Typography (Subheading)" form={form} setForm={setForm}
                      sizeKey="subFontSize" weightKey="subFontWeight" formatKey="subFormat" />
                    <TypographyRow title="Typography (Buttons)" form={form} setForm={setForm}
                      sizeKey="btnFontSize" weightKey="btnFontWeight" formatKey="btnFormat" />
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Button Size &amp; Spacing</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Width</label>
                          <select className="input text-xs" value={form.buttonWidth}
                            onChange={e => setForm({ ...form, buttonWidth: e.target.value })}>
                            <option value="">Auto</option>
                            <option value="full">Full width</option>
                            <option value="120">120px</option>
                            <option value="160">160px</option>
                            <option value="200">200px</option>
                            <option value="240">240px</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Padding X</label>
                          <input type="number" className="input text-xs" placeholder="24" value={form.buttonPaddingX}
                            onChange={e => setForm({ ...form, buttonPaddingX: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Padding Y</label>
                          <input type="number" className="input text-xs" placeholder="14" value={form.buttonPaddingY}
                            onChange={e => setForm({ ...form, buttonPaddingY: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Corners &amp; Shadow</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Box radius</label>
                          <input type="number" className="input text-xs" placeholder="auto" value={form.boxRadius}
                            onChange={e => setForm({ ...form, boxRadius: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Button radius</label>
                          <input type="number" className="input text-xs" placeholder="auto" value={form.btnRadius}
                            onChange={e => setForm({ ...form, btnRadius: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Box shadow</label>
                          <select className="input text-xs" value={form.boxShadow}
                            onChange={e => setForm({ ...form, boxShadow: e.target.value })}>
                            <option value="">Default</option>
                            <option value="none">None</option>
                            <option value="soft">Soft</option>
                            <option value="strong">Strong</option>
                          </select>
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
            {consentHtml
              ? <iframe srcDoc={consentHtml} title="preview" className="w-full rounded-lg border border-slate-100" style={{ height: 340 }} sandbox="allow-scripts" />
              : <div className="flex items-center justify-center h-52 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">Fill fields to see preview</div>
            }
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              <i className="fa-solid fa-eye mr-2 text-indigo-500" />Final Preview
            </h2>
            <div className="flex gap-3 items-center">
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
              <button onClick={() => downloadAsZip(outputHtml, `age-gate-${form.domain}`)} className="btn-secondary text-sm">
                <i className="fa-solid fa-download mr-1" />Download ZIP
              </button>
              <button onClick={save} disabled={saving || saved} className="btn-primary text-sm">
                {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1" />Saving…</>
                 : saved ? <><i className="fa-solid fa-check mr-1" />Saved!</>
                 :         <><i className="fa-solid fa-floppy-disk mr-1" />Save Page</>}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {lpActive && previewMode === "mobile" ? (
            <div className="flex justify-center bg-slate-100 rounded-xl py-6" style={{ minHeight: 540 }}>
              <div className="bg-black rounded-[2rem] p-2 shadow-xl" style={{ width: 390 }}>
                <iframe srcDoc={previewHtml} title="Final preview (phone)" className="w-full bg-white rounded-[1.5rem]" style={{ height: 720 }} sandbox="allow-scripts" />
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden" style={{ height: 520 }}>
              <iframe srcDoc={previewHtml} title="Final preview" className="w-full h-full" sandbox="allow-scripts" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
