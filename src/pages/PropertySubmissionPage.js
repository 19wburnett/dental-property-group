import React, { useState } from 'react';
import FormSelector from '../components/FormSelector';
import QuickPropertySubmission from './QuickPropertySubmission';
import SellYourOffice from './SellYourOffice';

const PropertySubmissionPage = () => {
  const [formType, setFormType] = useState('quick');
  const [sharedFormData, setSharedFormData] = useState({
    propertyAddress: '',
    mortgageOwed: '',
    isAssumable: false,
    anticipatedRepairs: '',
    askingPrice: '',
    leaseDocuments: [],
    otherDocuments: [],
    mortgageStatement: []
  });

  const handleFormChange = (newFormType) => {
    setFormType(newFormType);
  };

  const handleDataUpdate = (data, sourceForm) => {
    if (sourceForm === 'quick') {
      // Map quick form data to complete form format
      const addressParts = data.propertyAddress.split('\n');
      const cityStateZip = (addressParts[1] || '').split(',');
      const stateZip = (cityStateZip[1] || '').trim().split(' ');

      setSharedFormData({
        streetAddress: addressParts[0] || '',
        city: cityStateZip[0] || '',
        state: stateZip[0] || '',
        zipCode: stateZip[1] || '',
        mortgageOwed: data.mortgageOwed,
        isAssumable: data.isAssumable,
        mortgageStatement: data.mortgageStatement || [],
        futureRepairs: {
          otherCapex: { 
            needed: !!data.anticipatedRepairs,
            description: data.anticipatedRepairs
          }
        },
        askingPrice: data.askingPrice,
        leaseAgreement: data.leaseDocuments,
        otherDocuments: data.otherDocuments
      });
    } else {
      // Map complete form data to quick form format
      setSharedFormData({
        propertyAddress: `${data.streetAddress}\n${data.city}, ${data.state} ${data.zipCode}`,
        mortgageOwed: data.mortgageOwed,
        isAssumable: data.isAssumable,
        mortgageStatement: data.mortgageStatement || [],
        anticipatedRepairs: Object.entries(data.futureRepairs)
          .filter(([_, value]) => value.needed)
          .map(([key, value]) => `${key}: ${value.yearsUntilNeeded} years`)
          .join('\n'),
        askingPrice: data.askingPrice,
        leaseDocuments: data.leaseAgreement,
        otherDocuments: data.otherDocuments
      });
    }
  };

  return (
    <div className="property-submission-page">
      <FormSelector currentForm={formType} onFormChange={handleFormChange} />
      
      <div className="form-container">
        {formType === 'quick' ? (
          <QuickPropertySubmission 
            initialData={sharedFormData}
            onDataChange={(data) => handleDataUpdate(data, 'quick')}
          />
        ) : (
          <SellYourOffice 
            initialData={sharedFormData}
            onDataChange={(data) => handleDataUpdate(data, 'complete')}
          />
        )}
      </div>
    </div>
  );
};

export default PropertySubmissionPage;
