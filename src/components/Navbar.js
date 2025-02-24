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
      <a href="https://dentalpropertygroup.com/" rel="noopener noreferrer">
        <img className="dpg-logo" src={DPGLogo} alt="DPG Logo" />
      </a>
      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={`links ${isOpen ? 'mobile-active' : ''}`}>
        <Link className={isActive("/get-an-estimate")} to="/get-an-estimate" onClick={() => setIsOpen(false)}>Submit a Deal</Link>
      </div>
    </nav>
  );
};

export default Navbar;