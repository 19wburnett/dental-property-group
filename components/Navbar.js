import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import DPGLogo from '../public/images/DPG Logo.png';
import '../styles/app.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link href="/">
          <div>
            <Image
              src={DPGLogo}
              alt="DPG Logo"
              width={150}
              height={50}
              priority
            />
          </div>
        </Link>
      </div>

      <div className={`nav-links ${isOpen ? 'active' : ''}`}>
        <Link href="/quick-property-submission">
          <div className="nav-link">Submit A Deal</div>
        </Link>
      </div>
    </nav>
  );
}