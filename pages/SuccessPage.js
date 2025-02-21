import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Thank You!</h1>
            <p>DPG is interested in your deal. Please submit further information.</p>
            <button onClick={() => navigate('/sell-your-office')} className="btn-primary">
                Go to Sell Your Office Form
            </button>
        </div>
    );
};

export default SuccessPage; 