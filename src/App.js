import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SellYourOfficeQuick from './pages/QuickPropertySubmission';
import SellYourOffice from './pages/SellYourOffice';
import PartnerWithUs from './pages/PartnerWIthUs';
import ChatAI from './pages/ChatAI';
import PropertySubmissionPage from './pages/PropertySubmissionPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SuccessPage from './pages/SuccessPage';
import ContactUsPage from './pages/ContactUsPage';
import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/get-an-estimate" element={<SellYourOfficeQuick />} />
          <Route path="/sell-your-office" element={<SellYourOffice />} />
          <Route path="/partner-with-us" element={<PartnerWithUs />} />
          <Route path="/chat" element={<ChatAI />} />
          <Route path="/sell" element={<PropertySubmissionPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/contact/:propertyId" element={<ContactUsPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;