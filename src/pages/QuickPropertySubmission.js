import React, { useState, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';
import SellYourOffice from './SellYourOffice';

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);

const validationSchema = Yup.object({
  leaseDocuments: Yup.array()
    .min(1, 'At least one lease document is required')
    .nullable()
    .default([]),
  otherDocuments: Yup.array()
    .max(5, 'Maximum 5 files allowed')
    .nullable()
    .default([]),
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
});

const QuickPropertySubmission = () => {
  const [submitStatus, setSubmitStatus] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const initialValues = {
    leaseDocuments: [],
    otherDocuments: [],
    mortgageOwed: '',
    isAssumable: false,
    askingPrice: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
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

      if (maxFiles) {
        const totalFiles = files.length + validFiles.length;
        if (totalFiles > maxFiles) {
          alert(`Maximum ${maxFiles} files allowed`);
          return;
        }
      }

      const updatedFiles = [...files, ...validFiles];
      onFileSelect(updatedFiles);
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

  const analyzeLease = async (fileUrl) => {
    try {
      console.log('Attempting to analyze lease with URL:', fileUrl);
      const response = await fetch('/api/analyze-lease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });
      
      // Log the raw response
      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse API response:', e);
        throw new Error('Invalid API response format');
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze lease');
      }
      
      return data;
    } catch (error) {
      console.error('Lease analysis error:', error);
      throw error;
    }
  };

  const calculateReturnPercentage = (rentAmount, leaseType, askingPrice) => {
    if (!rentAmount || !askingPrice || askingPrice === 0) return 0;
    
    // Convert monthly rent to annual
    const annualRent = rentAmount * 12;
    
    // Apply adjustment based on lease type
    const adjustmentMultiplier = leaseType === 'triple_net' ? 0.9 : 0.7;
    const adjustedAnnualRent = annualRent * adjustmentMultiplier;
    
    // Calculate return percentage
    const returnPercentage = (adjustedAnnualRent / askingPrice) * 100;
    
    console.log('Return calculation:', {
      monthlyRent: rentAmount,
      annualRent,
      leaseType,
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
      // Create base submission first
      const baseSubmission = {
        street_address: values.streetAddress,
        mortgage_owed: Number(values.mortgageOwed),
        is_assumable: values.isAssumable,
        anticipated_repairs: values.anticipatedRepairs,
        asking_price: Number(values.askingPrice),
        created_at: new Date().toISOString(),
        status: 'pending_review',
        submission_source: 'quick_form',
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
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
      
      // Handle lease document analysis
      setProcessingStatus('Analyzing lease documents...');
      const leaseFile = values.leaseDocuments[0];
      
      if (!leaseFile) {
        throw new Error('No lease document provided');
      }

      // Upload lease to Supabase storage
      const timestamp = new Date().getTime();
      const fileName = `lease_${timestamp}_${leaseFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${submissionData[0].id}/lease/${fileName}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(filePath, leaseFile);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for lease document');
      }

      // Analyze lease using ChatGPT
      setProcessingStatus('Analyzing lease terms...');
      const leaseAnalysis = await analyzeLease(publicUrl);
      
      if (!leaseAnalysis || !leaseAnalysis.rentAmount) {
        throw new Error('Failed to extract rent amount from lease');
      }

      // Calculate return percentage
      const returnPercentage = calculateReturnPercentage(
        leaseAnalysis.rentAmount,
        leaseAnalysis.leaseType,
        values.askingPrice
      );

      console.log('Analysis results:', {
        rentAmount: leaseAnalysis.rentAmount,
        leaseType: leaseAnalysis.leaseType,
        returnPercentage
      });

      // Update submission with analysis results
      const { error: updateError } = await supabase
        .from('quick_property_submissions')
        .update({
          monthly_rent: leaseAnalysis.rentAmount,
          lease_type: leaseAnalysis.leaseType,
          return_percentage: returnPercentage,
          lease_file_path: filePath
        })
        .eq('id', submissionData[0].id);

      if (updateError) throw updateError;

      // After successful file upload to storage, add record to property_files table
      const fileRecord = {
        submission_id: submissionData[0].id,
        file_name: leaseFile.name,
        file_type: 'lease',
        file_path: filePath,
        file_size: leaseFile.size,
        mime_type: leaseFile.type,
        display_name: 'Lease Agreement',
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      };

      const { error: fileRecordError } = await supabase
        .from('property_files')
        .insert([fileRecord]);

      if (fileRecordError) {
        console.error('Error recording file metadata:', fileRecordError);
        throw new Error('Failed to record file metadata');
      }

      // Check if return percentage meets criteria
      if (returnPercentage >= 9) {
        setShowCompleteForm(true);
        setSubmitStatus('Your property meets our initial criteria. Please complete the full form.');
      } else {
        setSubmitStatus('Thank you for your submission. We will review your property and contact you if it meets our investment criteria.');
        resetForm();
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
    <div className="quick-submit-container">
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
                <Form className="quick-form">
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
                    <label>Lease Agreements and Other Docs *</label>
                    <div className="form-hint">Upload all current lease agreements, including any options and amendments, and any other documents</div>
                    <FileUploadBox
                      fieldName="leaseDocuments"
                      acceptedTypes=".pdf,.doc,.docx"
                      onFileSelect={(files) => formikProps.setFieldValue("leaseDocuments", files)}
                      formik={formikProps}
                    />
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
                      className="form-control"
                      placeholder="Describe any major interior or exterior repairs or maintenance projects"
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

                  <div className="form-actions">
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
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default QuickPropertySubmission;
