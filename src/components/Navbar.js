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
        <a className={isActive("/")} href="https://dentalpropertygroup.com/" rel="noopener noreferrer">Home</a>
        <a className={isActive("/about")} href="https://dentalpropertygroup.com/whypartner" rel="noopener noreferrer">Why Partner</a>
        <div>
          <Link className="submit-deal" to="/get-an-estimate" onClick={() => setIsOpen(false)}>
            Submit Deal
            <span className="arrow-icon">➜</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const styles = document.createElement('style');
styles.textContent = `
  .submit-deal {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arrow-icon {
    transition: transform 0.2s ease;
  }

  .submit-deal:hover .arrow-icon {
    transform: translateX(4px);
  }
`;
document.head.appendChild(styles);

export default Navbar;