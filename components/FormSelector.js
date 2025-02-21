import React from 'react';
import '../styles/FormSelector.css';

const FormSelector = ({ currentForm, onFormChange }) => {
  return (
    <div className="form-selector">
      <h2>Choose Form Type</h2>
      <div className="selector-buttons">
        <button
          className={`selector-btn ${currentForm === 'quick' ? 'active' : ''}`}
          onClick={() => onFormChange('quick')}
        >
          Submit an Estimate
        </button>
        <button
          className={`selector-btn ${currentForm === 'complete' ? 'active' : ''}`}
          onClick={() => onFormChange('complete')}
        >
          Submit an Offer
        </button>
      </div>
      <p className="selector-description">
        {currentForm === 'quick' 
          ? 'Quick form for a basic ballpark property estimate'
          : 'Complete form for a detailed property offer'}
      </p>
    </div>
  );
};

export default FormSelector;
