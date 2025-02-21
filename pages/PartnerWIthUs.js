import React, { useState } from 'react';
import { supabase } from '../src/supabaseClient';

const PartnerWithUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const { error } = await supabase
        .from('partnership_leads')
        .insert([formData]);

      if (error) throw error;

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="partner-page">
      <div className="partner-content">
        <h1>Partner With Us</h1>
        
        <div className="partner-info">
          <h2>Why Partner with DPG?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Expertise</h3>
              <p>Benefit from our deep understanding of dental real estate and practice transitions.</p>
            </div>
            <div className="benefit-card">
              <h3>Network</h3>
              <p>Access our extensive network of dental professionals and industry experts.</p>
            </div>
            <div className="benefit-card">
              <h3>Growth</h3>
              <p>Expand your practice with strategic real estate investments and partnerships.</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <h2>Get in Touch</h2>
          <form onSubmit={handleSubmit} className="partner-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <div className="status-message success">
                Thank you for your interest! We'll be in touch soon.
              </div>
            )}
            {status === 'error' && (
              <div className="status-message error">
                There was an error sending your message. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerWithUs;