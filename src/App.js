import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SellYourOffice from './pages/SellYourOffice';
import PartnerWithUs from './pages/PartnerWIthUs';
import ChatAI from './pages/ChatAI';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sell-your-office" element={<SellYourOffice />} />
          <Route path="/partner-with-us" element={<PartnerWithUs />} />
          <Route path="/chat" element={<ChatAI />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;