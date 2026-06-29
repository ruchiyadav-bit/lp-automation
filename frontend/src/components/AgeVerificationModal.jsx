import React, { useState, useEffect, useMemo, useCallback } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STORAGE_KEY = "age_verified";

/** Years offered in the picker: current year back 120 years. */
function buildYears() {
  const now = new Date().getFullYear();
  return Array.from({ length: 121 }, (_, i) => now - i);
}

/** Whole-years age from a Date of birth. */
function ageFrom(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

/**
 * Full-page age gate.
 *
 * Props:
 *   minAge      – minimum age required (default 18)
 *   redirectUrl – where underage / declining visitors are sent
 *   onVerified  – optional callback fired once the visitor passes
 */
export default function AgeVerificationModal({
  minAge = 18,
  redirectUrl = "https://www.google.com",
  onVerified,
}) {
  const [visible, setVisible] = useState(false);
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [error, setError] = useState("");

  const years = useMemo(buildYears, []);
  const ready = dob.day && dob.month && dob.year;

  useEffect(() => {
    let verified = false;
    try {
      verified = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch (e) {
      /* sessionStorage may be unavailable (private mode) */
    }
    if (verified) onVerified?.();
    else setVisible(true);
  }, [onVerified]);

  const update = (key) => (e) => {
    setError("");
    setDob((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const confirm = useCallback(() => {
    const dd = +dob.day, mm = +dob.month, yy = +dob.year;
    const date = new Date(yy, mm - 1, dd);
    // Reject impossible dates (e.g. 31 Feb) and future dates.
    if (date.getDate() !== dd || date.getMonth() !== mm - 1 || date > new Date()) {
      setError("Please enter a valid date of birth.");
      return;
    }
    if (ageFrom(date) >= minAge) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {
        /* ignore */
      }
      setVisible(false);
      onVerified?.();
    } else {
      window.location.href = redirectUrl;
    }
  }, [dob, minAge, redirectUrl, onVerified]);

  const deny = () => {
    window.location.href = redirectUrl;
  };

  if (!visible) return null;

  const selectClass =
    "flex-1 rounded-lg border border-gray-300 bg-white px-2 py-3 text-sm text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-modal-title"
      aria-describedby="age-modal-desc"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🔞</div>
        <h2 id="age-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
          Age Verification
        </h2>
        <p id="age-modal-desc" className="text-gray-600 mb-5">
          You must be {minAge} or older to access this site. Please enter your date of birth.
        </p>

        <div className="flex gap-2 mb-3">
          <select className={selectClass} aria-label="Day of birth" value={dob.day} onChange={update("day")}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select className={selectClass} aria-label="Month of birth" value={dob.month} onChange={update("month")}>
            <option value="">Month</option>
            {MONTHS.map((label, i) => (
              <option key={label} value={i + 1}>{label}</option>
            ))}
          </select>
          <select className={selectClass} aria-label="Year of birth" value={dob.year} onChange={update("year")}>
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <p className="text-red-500 text-sm font-semibold min-h-[20px] mb-3" role="alert" aria-live="assertive">
          {error}
        </p>

        <div className="flex flex-col gap-3">
          <button onClick={confirm} disabled={!ready} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            Enter Site
          </button>
          <button onClick={deny} className="btn-secondary w-full">
            I am under {minAge}
          </button>
        </div>
      </div>
    </div>
  );
}
