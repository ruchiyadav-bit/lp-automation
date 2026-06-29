import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-2">LandingPageSaaS</h3>
          <p className="text-sm">Build beautiful landing pages in minutes with our template library.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Product</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/templates" className="hover:text-white">Templates</Link></li>
            <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Account</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            <li><Link to="/register" className="hover:text-white">Sign up</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs mt-8">© {new Date().getFullYear()} LandingPageSaaS. All rights reserved.</p>
    </footer>
  );
}
