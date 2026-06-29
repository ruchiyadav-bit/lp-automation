import React from "react";
import { Link } from "react-router-dom";

const MODULES = [
  { icon: "fa-solid fa-cookie-bite",       title: "Cookie Banners",    desc: "GDPR-compliant consent banners — bottom bar, floating card, modal, or top banner." },
  { icon: "fa-solid fa-shield-halved",     title: "Age Verification",  desc: "Full-page age gates with dark, split-screen, minimal, or gradient layouts." },
  { icon: "fa-solid fa-envelope-open-text", title: "Email Newsletters", desc: "HTML campaigns with subscriber capture and CSV/Excel export, ready to send." },
];

const STEPS = [
  { icon: "fa-solid fa-globe",        title: "Enter your domain",  desc: "Tell us about your site and pick the module you need." },
  { icon: "fa-solid fa-swatchbook",   title: "Pick a template",    desc: "Choose from 3–4 professionally designed layouts." },
  { icon: "fa-solid fa-wand-magic-sparkles", title: "AI writes the copy", desc: "GPT generates a headline, body copy, and CTA tailored to your domain." },
  { icon: "fa-solid fa-download",     title: "Edit, preview & download", desc: "Fine-tune the content, preview live, then download a ready-to-deploy ZIP." },
];

const FEATURES = [
  { icon: "fa-solid fa-wand-magic-sparkles", title: "AI-Generated Copy",  desc: "OpenAI writes headline, body, and CTA copy from just a domain name." },
  { icon: "fa-solid fa-file-zipper",         title: "Instant ZIP Export", desc: "Download production-ready HTML in one click — no setup required." },
  { icon: "fa-solid fa-chart-line",          title: "Dashboard & History", desc: "Track every page you've generated, with one-click re-download." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center">
            <i className="fa-solid fa-layer-group mr-2" style={{ color: "#6366f1" }} />
            LandingPageSaaS
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#modules" className="hover:text-slate-900 transition-colors">Modules</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">Log in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#0f172a" }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, #6366f1 0, transparent 45%), radial-gradient(circle at 80% 0%, #6366f1 0, transparent 40%)"
        }} />
        <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1 mb-6">
            <i className="fa-solid fa-sparkles" /> Powered by GPT-3.5 Turbo
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 text-white leading-tight tracking-tight">
            Launch compliant pages<br />in minutes, not days
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Generate cookie banners, age verification gates, and email newsletters with AI-written copy — preview instantly, download as a ready-to-deploy ZIP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-indigo-500/30">
              Get started free
            </Link>
            <a href="#modules" className="border border-slate-600 text-slate-200 hover:bg-white/5 font-semibold py-3 px-8 rounded-lg transition-colors">
              Explore modules
            </a>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Three modules, one workflow</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Every module follows the same simple flow: pick a template, let AI write the copy, edit, preview, and download.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODULES.map(m => (
            <div key={m.title} className="card hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: "#eef2ff" }}>
                <i className={`${m.icon} text-lg`} style={{ color: "#6366f1" }} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{m.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">From domain to downloadable ZIP in four steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 text-white font-bold text-lg" style={{ background: "#1e293b" }}>
                  <i className={s.icon} />
                </div>
                <div className="text-xs font-semibold text-indigo-500 mb-1">STEP {i + 1}</div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Built for speed and compliance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="text-center px-4">
              <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4" style={{ background: "#1e293b" }}>
                <i className={`${f.icon} text-lg text-white`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1e293b" }}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">Ready to ship your first page?</h2>
          <p className="text-slate-300 mb-8">Create a free account and generate your first AI-written page in under five minutes.</p>
          <Link to="/register" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-bold text-slate-900 flex items-center text-sm">
            <i className="fa-solid fa-layer-group mr-2" style={{ color: "#6366f1" }} />
            LandingPageSaaS
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} LandingPageSaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
