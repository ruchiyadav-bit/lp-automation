import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary-600">
            LandingPageSaaS
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={({ isActive }) => isActive ? "text-primary-600 font-semibold" : "text-gray-600 hover:text-primary-600"}>Home</NavLink>
            <NavLink to="/templates" className={({ isActive }) => isActive ? "text-primary-600 font-semibold" : "text-gray-600 hover:text-primary-600"}>Templates</NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "text-primary-600 font-semibold" : "text-gray-600 hover:text-primary-600"}>Dashboard</NavLink>
            <Link to="/login" className="btn-secondary text-sm">Log in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 bg-white border-t border-gray-100">
          <NavLink to="/" className="text-gray-700 py-1">Home</NavLink>
          <NavLink to="/templates" className="text-gray-700 py-1">Templates</NavLink>
          <NavLink to="/dashboard" className="text-gray-700 py-1">Dashboard</NavLink>
          <Link to="/login" className="btn-secondary text-sm text-center">Log in</Link>
          <Link to="/register" className="btn-primary text-sm text-center">Get started</Link>
        </div>
      )}
    </nav>
  );
}
