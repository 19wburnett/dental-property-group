import React from 'react';
import { Link } from 'react-router-dom';
import DentalBackground from '../images/Dental Office Background Photo.jpeg'
import Nic from '../images/Nic.png'
import Spencer from '../images/Spencer.png'
import Jaime from '../images/Jaime Dunn.jpeg'
import Rob from '../images/Rob Bay.jpeg'
import Fabio from '../images/Fabio Oliveira.jpeg'
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
      <div className="who-we-are-secondary">
        <div className='who-we-are-title secondary'>Who We Serve</div>
        <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}> 
          <p className='who-we-are-subtitle secondary'>DPG serves the single practice owner to large established DSOs that are looking for liquidity. DPG has the capability to acquire large portfolios or individual deals. We strive to prioritize relationships over profits and to ensure that the outcome of all transactions that are fair.</p>
          <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: '40px'}}>
            <Link to='/sell-your-office' className='landing-page-button secondary'>I have an Individual Deal</Link>
            <Link to='/partner-with-us' className='landing-page-button secondary'>I have a Large Portfolio</Link>
          </div>

        </div>
      </div>
      <div className="who-we-are">
        <div className='who-we-are-title'>How we Serve</div>
        <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}> 
          <p className='who-we-are-subtitle'>DPG can be involved in any part of the M&A process. We can be brought in if the real estate is a sticking point, or after an acquisition is made and owner of the property is looking for an exit. DPG believes strongly in the long-term value of dental and our business strategy reflects that. We’re here to stay and not follow the typical real estate model of buy – hold – sell. This continuity in ownership will provide stability and reliability to all our dental tenants.</p>
          <Link to='/partner-with-us' className='landing-page-button'>Learn More</Link>
        </div>
      </div>
      <div className="meet-the-team">
        <div className='who-we-are-title secondary'>Meet the Team</div>
        <div className='team-grid'>
            <div className='team-member-container'>
              <img src={Nic} alt='team member' className='team-member-image'/>
              <div className='team-member-name'>Nic Blosil</div>
              <div className='team-member-title'>Managing Partner</div>
              <div className='team-member-description'>Nic was introduced to the world of dental in the summer of 2022. He recognized the unique market factors in the industry and drawing upon his previous experience in the residential real estate market, identified the real estate opportunity in the dental market. With over seven years of experience in real estate, Nic co-founded Dental Property Group in the fall of 2022. Nic is a graduate of BYU’s Marriott School of Business. In his spare time, he is actively involved in organizing events and firesides focused on faith, music, business, or philanthropy.</div>
            </div> 
            <div className='team-member-container'>
              <img src={Spencer} alt='team member' className='team-member-image'/>
              <div className='team-member-name'>Spencer Hatfield</div>
              <div className='team-member-title'>Managing Partner</div>
              <div className='team-member-description'>Spencer has over seven years of experience providing valuation services to both public and private-sector clients. He has extensive expertise across a broad range of industries, including technology, financial services, pharma/life sciences, and real estate, among others. Spencer is a graduate from BYU’s Marriott School of Business with a B.A. of Finance. Spencer has also personally been investing in real estate for over five years.</div>
            </div>
            <div className='team-member-container'>
              <img src={Jaime} alt='team member' className='team-member-image'/>
              <div className='team-member-name'>Jaime Dunn</div>
              <div className='team-member-title'>Managing Partner</div>
              <div className='team-member-description'>Co-founder of Peak Capital, a real estate firm with $10B in multi-family assets acquired. Co-founder of Peak Ventures, VC or angel investor in over 250 companies. 
              </div>
            </div>
            <div className='team-member-container'>
              <img src={Rob} alt='team member' className='team-member-image'/>
              <div className='team-member-name'>Rob Bay</div>
              <div className='team-member-title'>Managing Partner</div>
              <div className='team-member-description'>Spencer has over seven years of experience providing valuation services to both public and private-sector clients. He has extensive expertise across a broad range of industries, including technology, financial services, pharma/life sciences, and real estate, among others. Spencer is a graduate from BYU’s Marriott School of Business with a B.A. of Finance. Spencer has also personally been investing in real estate for over five years.</div>
            </div>
            <div className='team-member-container'>
              <img src={Fabio} alt='team member' className='team-member-image'/>
              <div className='team-member-name'>Fabio Oliveira</div>
              <div className='team-member-title'>Director</div>
              <div className='team-member-description'>Spencer has over seven years of experience providing valuation services to both public and private-sector clients. He has extensive expertise across a broad range of industries, including technology, financial services, pharma/life sciences, and real estate, among others. Spencer is a graduate from BYU’s Marriott School of Business with a B.A. of Finance. Spencer has also personally been investing in real estate for over five years.</div>
            </div>    
          </div>
          </div>
    </div>
  );
};

export default Home;