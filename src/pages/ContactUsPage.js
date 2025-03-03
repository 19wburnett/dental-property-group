import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    'https://wuisbxbfwwpmuamycjpv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5MTYyMiwiZXhwIjoyMDUzMDY3NjIyfQ.BLXhq6SXv3ZCQ82UDSp28OhhWIn1UTOuMDInWF4cFvg'
);

const ContactUsPage = () => {
    const { propertyId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const propertyIdFromQuery = queryParams.get('propertyId');
    
    // Use propertyId from either URL params or query params
    const submissionPropertyId = propertyId || propertyIdFromQuery;
    
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        email: '',
        dsoName: '',
        phoneNumber: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState(null);
    const navigate = useNavigate();

    // Fetch property details if ID is available
    useEffect(() => {
        if (submissionPropertyId) {
            const fetchPropertyDetails = async () => {
                try {
                    const { data, error } = await supabase
                        .from('property_submissions')
                        .select('*')
                        .eq('id', submissionPropertyId)
                        .single();
                    
                    if (error) throw error;
                    if (data) setPropertyDetails(data);
                } catch (error) {
                    console.error('Error fetching property details:', error);
                }
            };
            
            fetchPropertyDetails();
        }
    }, [submissionPropertyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Insert data into partnership_leads table in Supabase
            const { data, error } = await supabase
                .from('partnership_leads')  // Make sure this matches your table name
                .insert([
                    {
                        name: formData.name,
                        dso_name: formData.dsoName,
                        phone_number: formData.phoneNumber,
                        email: formData.email,
                        title: formData.title,
                        property_id: submissionPropertyId || null
                    }
                ]);

            if (error) throw error;

            setIsSuccess(true);
        } catch (error) {
            console.error('Error submitting contact form:', error);
            // Handle error (e.g., show a message to the user)
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', height:'60vh', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div className="success-message">
                    <h2>Thank you for your submission.</h2>
                    <p>Please allow up to 24 hours for a response.</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="btn-primary"
                        style={{ marginTop: '20px' }}
                    >
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Thank You For Your Submission</h1>
            <h2>Who should we reach out to?</h2>
            <p>Please allow up to 24 hours for a response.</p>
            
            {propertyDetails && (
                <div className="property-info" style={{ margin: '20px auto', maxWidth: '800px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>Submitted Property Information</h3>
                    <p><strong>Address:</strong> {propertyDetails.address}</p>
                    {propertyDetails.city && <p><strong>City:</strong> {propertyDetails.city}</p>}
                    {propertyDetails.state && <p><strong>State:</strong> {propertyDetails.state}</p>}
                </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '20px 10%', maxWidth: '800px', margin: '0 auto' }}>
                <input
                    className="form-control"
                    type="text"
                    name="name"
                    placeholder="Contact Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="text"
                    name="dsoName"
                    placeholder="DSO Name"
                    value={formData.dsoName}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                />
                <input
                    className="form-control"
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
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
                <button 
                    type="submit" 
                    className={`btn-primary ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <span>Submitting...</span>
                        </div>
                    ) : (
                        'Submit'
                    )}
                </button>
            </form>
            <style>{`
                .loading-spinner {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .success-message {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .checkmark {
                    color: #4CAF50;
                    font-size: 48px;
                    margin: 20px 0;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .btn-primary.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ContactUsPage;