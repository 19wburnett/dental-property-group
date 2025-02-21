import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: 'center', marginTop: '50px', height:'60vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <h1>Thank You!</h1>
            <p>DPG is interested in your deal. Please submit further information.</p>
            <div>
                <button onClick={() => navigate('/sell-your-office')} className="btn-primary">
                    Go to Sell Your Office Form
                </button>
            </div>

        </div>
    );
};

export default SuccessPage; 