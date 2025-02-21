import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <Image
            src="/images/logo.png"
            alt="DPG Logo"
            width={150}
            height={50}
          />
          <p>Your trusted partner in dental real estate</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <Link href="/sell-your-office">
            <div className="footer-link">Sell Your Office</div>
          </Link>
          <Link href="/partner-with-us">
            <div className="footer-link">Partner With Us</div>
          </Link>
          <Link href="/contact-us">
            <div className="footer-link">Contact</div>
          </Link>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: info@dentalpropgroup.com</p>
          <p>Phone: (555) 123-4567</p>
          <div className="social-links">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Image src="/images/linkedin.svg" alt="LinkedIn" width={24} height={24} />
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Dental Property Group. All rights reserved.</p>
      </div>
    </footer>
  );
}
