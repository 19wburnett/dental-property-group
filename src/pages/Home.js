import React from 'react';
import { Link } from 'react-router-dom';
import DentalBackground from '../images/Dental Office Background Photo.jpeg'

const Home = () => {
  return (
    <div>
      <div className="hero">
        <img src={DentalBackground} alt="Dental office" className="hero-background" />
        <div className="hero-content">
          <h1>Looking to access liquidity?</h1>
          <h2>You've come to the right place</h2>
          <p>Dental Property Group is the preferred real estate acquisition partner for dentists and dental groups/DSOs.</p>
        </div>
      </div>
      <div className="who-we-are">
        <div className='who-we-are-title'>Who we are</div>
        <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}> 
          <p className='who-we-are-subtitle'>DPG is a private equity backed, nationwide real estate acquisition firm
 focused exclusively on single-tenant properties with dental practices. 
Our team is made up of institutionally trained leaders and Board of Advisors comprised of seasoned professionals in the real estate and dental industries. Our aim is to become the go to acquisition partner in the dental industry.</p>
          <Link to='/partner-with-us' className='landing-page-button'>Partner with Us</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;