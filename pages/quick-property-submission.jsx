import { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AnalysisLoadingState from '../components/AnalysisLoadingState';

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('Environment check:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Full Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Temporary for debugging
}

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);

// Test connection immediately
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('quick_property_submissions')
      .select('id')
      .limit(1);
    
    console.log('Test query response:', { data, error }); // Debugging
    
    if (error) {
      console.error('Supabase test query error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};

testSupabaseConnection();

const validationSchema = Yup.object({
  leaseDocuments: Yup.array()
    .min(1, 'At least one lease document is required')
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
    .required('Required')
});

const LoadingState = ({ message }) => (
  <div className="loading-state">
    <div className="spinner"></div>
    <p>{message || 'Processing your submission...'}</p>
  </div>
);

const FormContent = ({ initialValues, validationSchema, onSubmit, FileUploadBox, states, submitStatus }) => (
  <>
    <h1>Quick Property Submission</h1>
    <p>Please complete this initial form for a quick review of your property.</p>
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formikProps) => (
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
            <div className="form-hint">Upload all current lease agreements, including any options and amendments</div>
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
              placeholder="Describe any major repairs or maintenance projects"
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
              {formikProps.isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
    {submitStatus && (
      <div className={`submit-status ${submitStatus.includes('Error') ? 'error' : 'success'}`}>
        {submitStatus}
      </div>
    )}
  </>
);

const QuickPropertySubmission = () => {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [analysisStep, setAnalysisStep] = useState(0);

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
    anticipatedRepairs: '',
  };

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

    // File upload box handlers
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
        const isValidSize = file.size <= 10000000;
        const fileType = file.type;
        const validTypes = acceptedTypes.split(',').map(type => 
          type.replace('.', 'application/').replace('doc', 'msword')
        );
        return isValidSize && validTypes.includes(fileType);
      });

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        onFileSelect(updatedFiles);
      }
    };

    const handleRemoveFile = (index, e) => {
      e.stopPropagation();
      const updatedFiles = files.filter((_, i) => i !== index);
      onFileSelect(updatedFiles);
    };

    return (
      <div 
        className={`file-upload-box ${isDragging ? 'dragging' : ''} ${hasError ? 'has-error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
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
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={(e) => handleRemoveFile(index, e)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(!maxFiles || files.length < maxFiles) && (
                <div className="file-upload-text">
                  Drop more files or click to select
                </div>
              )}
            </div>
          ) : (
            <div className="file-upload-text">
              Drag and drop files here, or click to select
            </div>
          )}
        </div>
        {hasError && <div className="file-error">{fileErrors}</div>}
      </div>
    );
  };

  const analyzeLease = async (file) => {
    const formData = new FormData();
    
    // Debug the file object
    console.log('File object:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    formData.append('file', file);
    
    try {
      console.log('Sending file to API...');
      
      const response = await fetch('/api/analyze-lease', {
        method: 'POST',
        body: formData,
      });

      console.log('API Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw API response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid API response format');
      }

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Lease analysis error:', error);
      throw error;
    }
  };

  const calculateCapRate = (rentAmount, leaseType, askingPrice) => {
    console.log('Cap Rate Calculation:', {
      monthlyRent: rentAmount,
      annualRent: rentAmount * 12,
      leaseType: leaseType,
      askingPrice: askingPrice
    });
  
    if (!rentAmount || !askingPrice || askingPrice === 0) {
      console.log('Invalid inputs for cap rate calculation');
      return 0;
    }
    
    const annualRent = rentAmount * 12;
    const adjustmentMultiplier = leaseType.toLowerCase() === 'triple net' ? 0.9 : 0.7;
    const capRate = (annualRent * adjustmentMultiplier) / askingPrice * 100;
    
    console.log('Cap Rate Details:', {
      annualRent,
      adjustmentMultiplier,
      adjustedAnnualRent: annualRent * adjustmentMultiplier,
      capRate: capRate.toFixed(2) + '%'
    });
    
    return capRate;
  };

  const handleQuickSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    setProcessingStatus('Analyzing your property submission...');
    
    try {
      if (!values.leaseDocuments?.length) {
        throw new Error('No lease document provided');
      }

      const leaseFile = values.leaseDocuments[0];
      
      // Database submission
      setProcessingStatus('Uploading documents...');
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

      if (submissionError) {
        throw submissionError;
      }

      setSubmissionId(submissionData[0].id);
      
      // Analysis steps
      setAnalysisStep(1); // Extract step
      setProcessingStatus('Extracting information from documents...');
      
      setAnalysisStep(2); // Analyze step
      const analysisResult = await analyzeLease(leaseFile);
      
      setAnalysisStep(3); // Calculate step
      setProcessingStatus('Calculating final results...');
      const capRate = calculateCapRate(
        analysisResult.rentAmount,
        analysisResult.leaseType,
        values.askingPrice
      );

      router.push(capRate < 9 ? '/contact-us' : '/success');
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
      setIsLoading(false);
      setProcessingStatus('');
      setAnalysisStep(0);
    }
  };

  // Add this near the top of the component
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('quick_property_submissions')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('Supabase connection test error:', error);
          setSubmitStatus('Error: Database connection failed');
        } else {
          console.log('Supabase connection successful');
        }
      } catch (err) {
        console.error('Supabase connection test exception:', err);
        setSubmitStatus('Error: Database connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <>
      <Head>
        <title>Quick Property Submission | Dental Property Group</title>
        <meta name="description" content="Submit your dental property for quick review" />
      </Head>

      <div className="quick-submit-container">
        {isLoading ? (
          <AnalysisLoadingState message={processingStatus} />
        ) : (
          <FormContent
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleQuickSubmit}
            FileUploadBox={FileUploadBox}
            states={states}
            submitStatus={submitStatus}
          />
        )}
      </div>

      <style jsx>{`
        .quick-submit-container {
          margin-top: 100px;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .loading-state {
          text-align: center;
          padding: 2rem;
        }

        .file-upload-box {
          border: 2px dashed #ccc;
          padding: 2rem;
          text-align: center;
          margin: 1rem 0;
          cursor: pointer;
        }

        .file-upload-box.dragging {
          border-color: #0070f3;
          background: rgba(0, 112, 243, 0.1);
        }

        .error {
          color: red;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .file-upload-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .file-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .file-name {
          margin-right: 1rem;
          word-break: break-all;
        }

        .remove-file {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          font-size: 1rem;
        }

        .remove-file:hover {
          color: #ff4444;
        }

        .file-upload-text {
          color: #666;
          margin: 1rem 0;
        }

        .file-error {
          color: red;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
    </>
  );
};

export default QuickPropertySubmission;
