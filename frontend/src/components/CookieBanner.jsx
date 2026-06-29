import React, { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50 shadow-xl">
      <p className="text-sm text-gray-300">
        We use cookies to improve your experience. By using this site you agree to our{" "}
        <a href="/privacy" className="underline text-primary-400">Privacy Policy</a>.
      </p>
      <div className="flex gap-3">
        <button onClick={decline} className="text-sm px-4 py-2 rounded-lg border border-gray-500 hover:border-gray-300 transition-colors">Decline</button>
        <button onClick={accept} className="text-sm px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors">Accept</button>
      </div>
    </div>
  );
}
