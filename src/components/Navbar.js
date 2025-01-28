import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DPGLogo from '../images/DPG Logo.png';

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? "link-text active" : "link-text";
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <img className="dpg-logo" src={DPGLogo} alt="DPG Logo"></img>
      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={`links ${isOpen ? 'mobile-active' : ''}`}>
        <Link className={isActive("/")} to="/" onClick={() => setIsOpen(false)}>Home</Link>
        <Link className={isActive("/sell-your-office")} to="/sell-your-office" onClick={() => setIsOpen(false)}>Sell Your Office</Link>
        <Link className={isActive("/partner-with-us")} to="/partner-with-us" onClick={() => setIsOpen(false)}>Partner with Us</Link>
        <Link className={isActive("/chat")} to="/chat" onClick={() => setIsOpen(false)}>AI Assistant</Link>
      </div>
    </nav>
  );
};

export default Navbar;