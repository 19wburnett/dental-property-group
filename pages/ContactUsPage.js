import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    'https://wuisbxbfwwpmuamycjpv.supabase.co', // Replace with your Supabase URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5MTYyMiwiZXhwIjoyMDUzMDY3NjIyfQ.BLXhq6SXv3ZCQ82UDSp28OhhWIn1UTOuMDInWF4cFvg' // Replace with your Supabase anon key
);

const ContactUsPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        title: '',
        email: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Insert data into Supabase
            const { data, error } = await supabase
                .from('partnership_leads')
                .insert([
                    {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        title: formData.title,
                        email: formData.email
                    }
                ]);

            if (error) throw error;

            console.log('Contact form submitted:', data);
            // Redirect to a thank you page or similar
            navigate('/thank-you'); // Adjust this as needed
        } catch (error) {
            console.error('Error submitting contact form:', error);
            // Handle error (e.g., show a message to the user)
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>We Need to Discuss Your Deal Further</h1>
            <p>Please provide your contact information so our team can get back to you.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '20px 10%' }}>
                <input
                    className="form-control"
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className="btn-primary">Submit</button>
            </form>
        </div>
    );
};

export default ContactUsPage; 