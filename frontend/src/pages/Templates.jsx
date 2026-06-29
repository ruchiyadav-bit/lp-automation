import React from "react";

const TEMPLATE_LIST = [
  { id: 1, name: "Cookie Consent Banner", type: "compliance", emoji: "🍪" },
  { id: 2, name: "Age Verification Gate", type: "compliance", emoji: "🔞" },
  { id: 3, name: "Welcome Email", type: "email", emoji: "✉️" },
  { id: 4, name: "Password Reset Email", type: "email", emoji: "🔑" },
  { id: 5, name: "SaaS Hero Landing", type: "landing", emoji: "🚀" },
  { id: 6, name: "Product Launch Page", type: "landing", emoji: "🎯" }
];

export default function Templates() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
      <p className="text-gray-500 mb-8">Pick a template and customise it in seconds.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATE_LIST.map(t => (
          <div key={t.id} className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-4xl mb-3">{t.emoji}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{t.name}</h3>
            <span className="inline-block mt-2 text-xs bg-primary-50 text-primary-700 rounded-full px-3 py-0.5 font-medium capitalize">{t.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
