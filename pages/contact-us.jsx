import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ContactUs() {
  const [formStatus, setFormStatus] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');

    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      phone: e.target.phone.value,
      message: e.target.message.value,
    };

    try {
      // For now, just console.log the form data
      console.log('Contact form submission:', formData);
      setFormStatus('success');
      // TODO: Add actual form submission logic
    } catch (error) {
      console.error('Contact form error:', error);
      setFormStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | Dental Property Group</title>
        <meta name="description" content="Contact us to discuss your dental property" />
      </Head>

      <div className="contact-container">
        <h1>Contact Us</h1>
        <p>We'd love to discuss your property in more detail. Please fill out the form below.</p>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              required
              className="form-control"
              rows="5"
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={formStatus === 'sending'}
          >
            {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {formStatus === 'success' && (
            <div className="form-status success">
              Thank you for your message. We'll be in touch soon!
            </div>
          )}

          {formStatus === 'error' && (
            <div className="form-status error">
              Sorry, there was an error sending your message. Please try again.
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        .contact-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .contact-form {
          margin-top: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .form-status {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 4px;
        }

        .success {
          background: #d4edda;
          color: #155724;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </>
  );
}
