import React from "react";

export default function Stepper({ steps, current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done   ? "bg-indigo-500 text-white"
                : active ? "bg-indigo-500 text-white ring-4 ring-indigo-100"
                :          "bg-slate-100 text-slate-400"}`}>
                {done ? <i className="fa-solid fa-check text-xs" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block whitespace-nowrap
                ${active ? "text-slate-800" : done ? "text-indigo-500" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-all ${i < current ? "bg-indigo-500" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
