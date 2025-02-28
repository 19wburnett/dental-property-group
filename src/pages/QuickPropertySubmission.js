import React, { useState, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';
import SellYourOffice from './SellYourOffice';
import { useNavigate } from 'react-router-dom';

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);

const validationSchema = Yup.object({
  mortgageOwed: Yup.number()
    .min(0, 'Must be 0 or greater')
    .required('Required'),
  isAssumable: Yup.boolean().required('Required'),
  anticipatedRepairs: Yup.string().required('Required'),
  askingPrice: Yup.number()
    .min(0, 'Must be 0 or greater')
    .required('Required'),
  streetAddress: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  zipCode: Yup.string()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code')
    .required('Required'),
  monthlyRent: Yup.number()
    .min(0, 'Must be 0 or greater')
    .required('Required'),
  paysUtilities: Yup.boolean(),
  monthlyUtilities: Yup.number().when('paysUtilities', {
    is: true,
    then: () => Yup.number()
      .min(0, 'Must be 0 or greater')
      .required('Required'),
    otherwise: () => Yup.number().notRequired(),
  }),
  paysTaxes: Yup.boolean(),
  annualTaxes: Yup.number().when('paysTaxes', {
    is: true,
    then: () => Yup.number()
      .min(0, 'Must be 0 or greater')
      .required('Required'),
    otherwise: () => Yup.number().notRequired(),
  }),
  paysInsurance: Yup.boolean(),
  annualInsurance: Yup.number().when('paysInsurance', {
    is: true,
    then: () => Yup.number()
      .min(0, 'Must be 0 or greater')
      .required('Required'),
    otherwise: () => Yup.number().notRequired(),
  }),
});

const QuickPropertySubmission = () => {
  const [submitStatus, setSubmitStatus] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const navigate = useNavigate();

  const initialValues = {
    mortgageOwed: '',
    isAssumable: false,
    askingPrice: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    monthlyRent: '',
    paysUtilities: false,
    monthlyUtilities: '',
    paysTaxes: false,
    annualTaxes: '',
    paysInsurance: false,
    annualInsurance: '',
  };

  // US States array for the dropdown
  const states = [
    { value: '', label: 'Select a State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District Of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  const FileUploadBox = ({ fieldName, acceptedTypes, onFileSelect, formik, maxFiles = null }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const files = formik.values[fieldName] || [];
    const fileErrors = formik.errors[fieldName];
    const hasError = formik.touched[fieldName] && fileErrors;

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    };

    const handleFiles = (newFiles) => {
      console.log('Selected files:', newFiles); // Log selected files
      const validFiles = newFiles.filter(file => {
        if (file.size > 10000000) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          return false;
        }

        const fileType = file.type;
        const validTypes = acceptedTypes.split(',').map(type => 
          type.replace('.', 'application/').replace('doc', 'msword')
        );

        if (!validTypes.includes(fileType)) {
          console.warn(`File ${file.name} has invalid type`);
          return false;
        }

        return true;
      });

      console.log('Valid files:', validFiles); // Log valid files after filtering

      // Ensure valid files are being passed to Formik
      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        onFileSelect(updatedFiles);
      } else {
        console.warn('No valid files selected');
      }
    };

    const handleRemoveFile = (index, e) => {
      e.stopPropagation();
      const updatedFiles = files.filter((_, i) => i !== index);
      onFileSelect(updatedFiles);
    };

    return (
      <div className={`file-upload-box ${isDragging ? 'dragging' : ''} ${hasError ? 'has-error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          style={{ display: 'none' }}
        />
        <div className="file-upload-content">
          <div className="file-upload-icon">📁</div>
          {files.length > 0 ? (
            <div className="file-list">
              {files.map((file, index) => (
                <div key={index} className="file-info">
                  <span className="file-name">{file.name}</span>
                  <button type="button" className="remove-file" onClick={(e) => handleRemoveFile(index, e)}>✕</button>
                </div>
              ))}
              {(!maxFiles || files.length < maxFiles) && (
                <div className="file-upload-text">Drop more files or click to select</div>
              )}
            </div>
          ) : (
            <div className="file-upload-text">Drag and drop files here, or click to select</div>
          )}
        </div>
        {hasError && <div className="file-error">{fileErrors}</div>}
      </div>
    );
  };

  const analyzeLease = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/analyze-lease', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data; // This will contain the rent amount and lease type
    } catch (error) {
        console.error('Lease analysis error:', error);
        throw error;
    }
  };

  const calculateReturnPercentage = (rentAmount, leaseType, askingPrice, values) => {
    if (!rentAmount || !askingPrice || askingPrice === 0) return 0;
    
    // Convert monthly rent to annual
    const annualRent = rentAmount * 12;
    
    // Count how many operating expenses the tenant pays
    const expensesCount = [
      values.paysUtilities,
      values.paysTaxes,
      values.paysInsurance
    ].filter(Boolean).length;
    
    // Determine multiplier based on number of expenses tenant pays
    let adjustmentMultiplier;
    switch (expensesCount) {
      case 1:
        adjustmentMultiplier = 0.9;
        break;
      case 2:
        adjustmentMultiplier = 0.8;
        break;
      case 3:
        adjustmentMultiplier = 0.7;
        break;
      default:
        adjustmentMultiplier = 1.0; // No expenses paid by tenant
    }
    
    const adjustedAnnualRent = annualRent * adjustmentMultiplier;
    const returnPercentage = (adjustedAnnualRent / askingPrice) * 100;
    
    console.log('Return calculation:', {
      monthlyRent: rentAmount,
      annualRent,
      expensesCount,
      adjustmentMultiplier,
      adjustedAnnualRent,
      askingPrice,
      returnPercentage
    });
    
    return returnPercentage;
  };

  const handleQuickSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    setProcessingStatus('Submitting your property information...');
    
    try {

      const baseSubmission = {
        street_address: values.streetAddress,
        mortgage_owed: Number(values.mortgageOwed),
        is_assumable: values.isAssumable,
        anticipated_repairs: values.anticipatedRepairs,
        asking_price: Number(values.askingPrice),
        monthly_rent: Number(values.monthlyRent),
        created_at: new Date().toISOString(),
        status: 'pending_review',
        submission_source: 'quick_form',
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        pays_utilities: values.paysUtilities,
        monthly_utilities: values.paysUtilities ? Number(values.monthlyUtilities) : null,
        pays_taxes: values.paysTaxes,
        annual_taxes: values.paysTaxes ? Number(values.annualTaxes) : null,
        pays_insurance: values.paysInsurance,
        annual_insurance: values.paysInsurance ? Number(values.annualInsurance) : null,
      };

      const { data: submissionData, error: submissionError } = await supabase
        .from('quick_property_submissions')
        .insert([baseSubmission])
        .select();

      if (submissionError) throw submissionError;

      if (!submissionData?.[0]?.id) {
        throw new Error('Failed to create submission record');
      }

      setSubmissionId(submissionData[0].id);

      // Calculate cap rate using input monthly rent and operating expenses
      const annualRent = Number(values.monthlyRent) * 12;
      const askingPrice = Number(values.askingPrice);
      
      const capRate = calculateReturnPercentage(
        Number(values.monthlyRent),
        'standard',
        askingPrice,
        values
      );

      // Check if cap rate meets criteria
      if (capRate < 9) {
        navigate('/contact-us');
      } else {
        navigate('/success');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
      setIsLoading(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="quick-submit-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding:'40px'}}>
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{processingStatus || 'Processing your submission...'}</p>
        </div>
      ) : !showCompleteForm ? (
        <>
          <h1>Quick Property Submission</h1>
          <p>Please complete this initial form for a quick review of your property.</p>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleQuickSubmit}
          >
            {(formikProps) => {
              console.log('Formik props:', formikProps); // Debugging line
              return (
                <Form className="quick-form" style={{ width: '100%', maxWidth: '800px' }}>
                  <div className="form-group">
                    <label>Street Address *</label>
                    <Field
                      name="streetAddress"
                      className="form-control"
                      placeholder="Enter street address"
                    />
                    {formikProps.errors.streetAddress && formikProps.touched.streetAddress && 
                      <div className="error">{formikProps.errors.streetAddress}</div>}
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <Field
                      name="city"
                      className="form-control"
                      placeholder="Enter city"
                    />
                    {formikProps.errors.city && formikProps.touched.city && 
                      <div className="error">{formikProps.errors.city}</div>}
                  </div>
                  <div className="form-row">
                    <div className="form-group state-select">
                      <label>State *</label>
                      <Field name="state" as="select" className="form-control">
                        {states.map(state => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </Field>
                      {formikProps.errors.state && formikProps.touched.state && 
                        <div className="error">{formikProps.errors.state}</div>}
                    </div>
                    <div className="form-group zip-code">
                      <label>ZIP Code *</label>
                      <Field
                        name="zipCode"
                        className="form-control"
                        placeholder="Enter ZIP code"
                      />
                      {formikProps.errors.zipCode && formikProps.touched.zipCode && 
                        <div className="error">{formikProps.errors.zipCode}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Amount Owed on Mortgage ($) *</label>
                    <Field
                      name="mortgageOwed"
                      type="number"
                      className="form-control"
                    />
                    {formikProps.errors.mortgageOwed && formikProps.touched.mortgageOwed && 
                      <div className="error">{formikProps.errors.mortgageOwed}</div>}
                  </div>

                  <div className="form-group">
                    <label>
                      <Field type="checkbox" name="isAssumable" />
                      Is the mortgage assumable? *
                    </label>
                    {formikProps.errors.isAssumable && formikProps.touched.isAssumable && 
                      <div className="error">{formikProps.errors.isAssumable}</div>}
                  </div>

                  <div className="form-group">
                    <label>Anticipated Repairs/Maintenance (Next 5 Years) *</label>
                    <Field
                      name="anticipatedRepairs"
                      as="textarea"
                      className="form-control text-input" // Add text-input class
                      placeholder="Describe any major interior or exterior repairs or maintenance projects"
                      style={{
                        fontFamily: 'inherit', // This will inherit the font from parent elements
                        fontSize: '1rem',      // Match the size of other inputs
                        lineHeight: '1.5',     // Standard line height
                        padding: '0.75rem'     // Consistent padding
                      }}
                    />
                    {formikProps.errors.anticipatedRepairs && formikProps.touched.anticipatedRepairs && 
                      <div className="error">{formikProps.errors.anticipatedRepairs}</div>}
                  </div>

                  <div className="form-group">
                    <label>Asking Price ($) *</label>
                    <Field
                      name="askingPrice"
                      type="number"
                      className="form-control"
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                        formikProps.setFieldValue('askingPrice', rawValue);
                      }}
                    />
                    {formikProps.errors.askingPrice && formikProps.touched.askingPrice && 
                      <div className="error">{formikProps.errors.askingPrice}</div>}
                  </div>

                  <div className="form-group">
                    <label>Monthly Rent ($) *</label>
                    <Field
                      name="monthlyRent"
                      type="number"
                      className="form-control"
                      placeholder="Enter current monthly rent"
                    />
                    {formikProps.errors.monthlyRent && formikProps.touched.monthlyRent && 
                      <div className="error">{formikProps.errors.monthlyRent}</div>}
                  </div>

                  <div className="expenses-section">
                    <h3>Operating Expenses</h3>
                    
                    <div className="form-group">
                      <label>
                        <Field type="checkbox" name="paysUtilities" />
                        Does the tenant pay utilities?
                      </label>
                      {formikProps.values.paysUtilities && (
                        <div className="nested-field">
                          <label>Monthly Utilities Cost ($)</label>
                          <Field
                            name="monthlyUtilities"
                            type="number"
                            className="form-control"
                            style={{maxWidth: '300px'}}
                            placeholder="Enter monthly utilities cost"
                          />
                          {formikProps.errors.monthlyUtilities && formikProps.touched.monthlyUtilities && 
                            <div className="error">{formikProps.errors.monthlyUtilities}</div>}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Field type="checkbox" name="paysTaxes" />
                        Does the tenant pay property taxes?
                      </label>
                      {formikProps.values.paysTaxes && (
                        <div className="nested-field">
                          <label>Annual Property Taxes ($)</label>
                          <Field
                            name="annualTaxes"
                            type="number"
                            className="form-control"
                            style={{maxWidth: '300px'}}
                            placeholder="Enter annual property taxes"
                          />
                          {formikProps.errors.annualTaxes && formikProps.touched.annualTaxes && 
                            <div className="error">{formikProps.errors.annualTaxes}</div>}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Field type="checkbox" name="paysInsurance" />
                        Does the tenant pay property insurance?
                      </label>
                      {formikProps.values.paysInsurance && (
                        <div className="nested-field">
                          <label>Annual Insurance Cost ($)</label>
                          <Field
                            name="annualInsurance"
                            type="number"
                            className="form-control"
                            style={{maxWidth: '300px'}}
                            placeholder="Enter annual insurance cost"
                          />
                          {formikProps.errors.annualInsurance && formikProps.touched.annualInsurance && 
                            <div className="error">{formikProps.errors.annualInsurance}</div>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions" style={{marginBottom:'20px'}}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={formikProps.isSubmitting}
                    >
                      {formikProps.isSubmitting ? (
                        <div className="loading-spinner">
                          <div className="spinner"></div>
                          Submitting...
                        </div>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </>
      ) : (
        <SellYourOffice submissionId={submissionId} />
      )}
      
      {submitStatus && !isLoading && (
        <div className={`submit-status ${submitStatus.includes('Error') ? 'error' : 'success'}`}>
          {submitStatus}
        </div>
      )}
    </div>
  );
};

// Update loading state styles
const styles = `
.loading-spinner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
}

.loading-state p {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--accent-color);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.expenses-section {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  width: 100%;
}

.expenses-section h3 {
  margin-bottom: 1rem;
}

.nested-field {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default QuickPropertySubmission;
