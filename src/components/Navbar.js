import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import DPGLogo from '../images/DPG Logo.png';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "link-text active" : "link-text";
  };

  return (
    <nav className="navbar">
        <img className="dpg-logo" src={DPGLogo}></img>
        <div className="links">
          <Link className={isActive("/")} to="/">Home</Link>
          <Link className={isActive("/sell-your-office")} to="/sell-your-office">Sell Your Office</Link>
          <Link className={isActive("/partner-with-us")} to="/partner-with-us">Partner with Us</Link>
        </div>
    </nav>
  );
};

export default Navbar;