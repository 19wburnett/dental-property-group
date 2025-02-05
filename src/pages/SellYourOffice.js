import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);

// Update webhook endpoint to use Express server
const WEBHOOK_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? `${window.location.origin}/api/webhook`  // Production endpoint
  : 'http://localhost:3002/api/webhook'; // Development endpoint using Express server

const validationSchema = Yup.object({
  // Property Details
  streetAddress: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  zipCode: Yup.string()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code')
    .required('Required'),
  propertySize: Yup.number().required('Required'),
  
  // Building Information
  yearBuilt: Yup.number()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .required('Required'),
  hasBeenRenovated: Yup.boolean(),
  renovationYear: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      // If it's an empty string or not a number, return null
      if (originalValue === '' || isNaN(originalValue)) {
        return null;
      }
      return Number(originalValue);
    })
    .when('hasBeenRenovated', {
      is: true,
      then: () => Yup.number()
        .required('Required when renovated is checked')
        .min(1900, 'Year must be after 1900')
        .max(new Date().getFullYear(), 'Year cannot be in the future'),
      otherwise: () => Yup.mixed().nullable() // Allow any value when hasBeenRenovated is false
    }),
  monthlyUtilities: Yup.number().required('Required'),
  additionalFees: Yup.string(),

  // Financial Details
  askingPrice: Yup.number().required('Required'),
  annualRevenue: Yup.number().required('Required'),
  propertyType: Yup.string().required('Required'),

  // Personal Info
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string().required('Required'),

  // Make file uploads optional
  pnlDocuments: Yup.mixed().nullable(),
  leaseAgreement: Yup.mixed().nullable(),
  otherDocuments: Yup.mixed().nullable()
});

const SellYourOffice = () => {
  const [step, setStep] = useState(1);
  const [submitStatus, setSubmitStatus] = useState('');

  const initialValues = {
    // Property Details
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertySize: '',
    
    // Building Information
    yearBuilt: '',
    hasBeenRenovated: false,
    renovationYear: '',
    monthlyUtilities: '',
    additionalFees: '',

    // Financial Details
    askingPrice: '',
    annualRevenue: '',
    propertyType: 'owned',

    // Personal Info
    name: '',
    email: '',
    phone: '',

    // File Uploads
    pnlDocuments: null,
    leaseAgreement: null,
    otherDocuments: null
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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Validate all fields before submission
      await validationSchema.validate(values, { abortEarly: false });
      
      // Create the base submission object
      const baseSubmission = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        street_address: values.streetAddress,
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        property_size: Number(values.propertySize),
        year_built: Number(values.yearBuilt),
        has_been_renovated: values.hasBeenRenovated,
        renovation_year: values.hasBeenRenovated ? Number(values.renovationYear) : null,
        monthly_utilities: Number(values.monthlyUtilities),
        additional_fees: values.additionalFees,
        asking_price: Number(values.askingPrice),
        annual_revenue: Number(values.annualRevenue),
        property_type: values.propertyType,
        created_at: new Date().toISOString()
      };

      // Insert into Supabase
      const { data: submissionData, error: submissionError } = await supabase
        .from('property_submissions')
        .insert([baseSubmission])
        .select();

      if (submissionError) throw submissionError;

      // If we have a successful submission, send webhook
      if (submissionData?.[0]?.id) {
        const submissionId = submissionData[0].id;
        
        try {
          const webhookResponse = await fetch(WEBHOOK_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              submissionId: submissionId,
              ...baseSubmission
            })
          });

          if (!webhookResponse.ok) {
            console.warn(`Webhook returned status: ${webhookResponse.status}`);
            // Continue with the form submission even if webhook fails
          }
        } catch (webhookError) {
          console.warn('Webhook notification failed:', webhookError);
          // Continue with the form submission even if webhook fails
        }

        // Handle file uploads if present
        if (submissionData?.[0]?.id) {
          const submissionId = submissionData[0].id;
          
          // Array to store all file upload promises
          const fileUploads = [];

          // Handle each file type
          const fileTypes = [
            { field: 'pnlDocuments', type: 'pnl', label: 'P&L Documents' },
            { field: 'leaseAgreement', type: 'lease', label: 'Lease Agreement' },
            { field: 'otherDocuments', type: 'other', label: 'Other Documents' }
          ];

          for (const { field, type, label } of fileTypes) {
            if (values[field]) {
              const file = values[field];
              const filePath = `${submissionId}/${type}/${file.name}`;
              
              // Upload file to storage
              const { error: uploadError } = await supabase.storage
                .from('property-documents')
                .upload(filePath, file);

              if (!uploadError) {
                // Create file record in files table
                const fileRecord = {
                  submission_id: submissionId,
                  file_name: file.name,
                  file_type: type,
                  file_path: filePath,
                  file_size: file.size,
                  mime_type: file.type,
                  display_name: label,
                  status: 'uploaded',
                  uploaded_at: new Date().toISOString()
                };

                const { error: fileRecordError } = await supabase
                  .from('property_files')
                  .insert([fileRecord]);

                if (fileRecordError) {
                  console.error(`Error recording file metadata: ${fileRecordError.message}`);
                }
              }
            }
          }
        }
      }

      setSubmitStatus('Success! Your submission has been received.');
      resetForm();
      setStep(1);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Property Details' },
    { number: 2, label: 'Building Info' },
    { number: 3, label: 'Financial' },
    { number: 4, label: 'Documents' },
    { number: 5, label: 'Personal Info' }
  ];

  const ProgressBar = () => {
    const progress = ((step - 1) / (steps.length - 1)) * 100;
    
    return (
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
          {steps.map((s) => (
            <div
              key={s.number}
              className={`step ${
                step === s.number ? 'active' : 
                step > s.number ? 'completed' : ''
              }`}
            >
              {step > s.number ? '✓' : s.number}
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FileUploadBox = ({ fieldName, acceptedTypes, onFileSelect, formik }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileName = formik.values[fieldName]?.name;

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files?.length) {
        onFileSelect(files[0]);
      }
    };

    return (
      <div
        className={`file-upload-box ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={(event) => {
            const file = event.currentTarget.files[0];
            if (file) onFileSelect(file);
          }}
          accept={acceptedTypes}
        />
        <div className="file-upload-icon">📁</div>
        <div className="file-upload-text">
          Drag and drop a file here, or click to select
        </div>
        <div className="file-upload-text">
          Accepted files: {acceptedTypes}
        </div>
        {fileName && (
          <div className="file-name">Selected: {fileName}</div>
        )}
      </div>
    );
  };

  const renderStep = (props) => {
    switch (step) {
      case 1: // Property Details
        return (
          <div className="form-step">
            <h2>Property Details</h2>
            <div className="form-group">
              <label>Street Address</label>
              <Field name="streetAddress" className="form-control" />
              {props.errors.streetAddress && props.touched.streetAddress && 
                <div className="error">{props.errors.streetAddress}</div>}
            </div>
            <div className="form-group">
              <label>City</label>
              <Field name="city" className="form-control" />
              {props.errors.city && props.touched.city && 
                <div className="error">{props.errors.city}</div>}
            </div>
            <div className="form-row">
              <div className="form-group state-select">
                <label>State</label>
                <Field name="state" as="select" className="form-control">
                  {states.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </Field>
                {props.errors.state && props.touched.state && 
                  <div className="error">{props.errors.state}</div>}
              </div>
              <div className="form-group zip-code">
                <label>ZIP Code</label>
                <Field name="zipCode" className="form-control" />
                {props.errors.zipCode && props.touched.zipCode && 
                  <div className="error">{props.errors.zipCode}</div>}
              </div>
            </div>
            <div className="form-group">
              <label>Property Size (sq ft)</label>
              <Field name="propertySize" type="number" className="form-control" />
              {props.errors.propertySize && props.touched.propertySize && 
                <div className="error">{props.errors.propertySize}</div>}
            </div>
          </div>
        );

      case 2: // Building Information
        return (
          <div className="form-step">
            <h2>Building Information</h2>
            <div className="form-group">
              <label>Year Built</label>
              <Field name="yearBuilt" type="number" className="form-control" />
              {props.errors.yearBuilt && props.touched.yearBuilt && 
                <div className="error">{props.errors.yearBuilt}</div>}
            </div>
            <div className="form-group">
              <label>
                <Field type="checkbox" name="hasBeenRenovated" />
                Has the building been renovated?
              </label>
            </div>
            {props.values.hasBeenRenovated && (
              <div className="form-group">
                <label>Year of Last Renovation</label>
                <Field name="renovationYear" type="number" className="form-control" />
                {props.errors.renovationYear && props.touched.renovationYear && 
                  <div className="error">{props.errors.renovationYear}</div>}
              </div>
            )}
            <div className="form-group">
              <label>Monthly Utilities ($)</label>
              <Field name="monthlyUtilities" type="number" className="form-control" />
              {props.errors.monthlyUtilities && props.touched.monthlyUtilities && 
                <div className="error">{props.errors.monthlyUtilities}</div>}
            </div>
            <div className="form-group">
              <label>HOA/Additional Fees (Please describe)</label>
              <Field name="additionalFees" as="textarea" className="form-control" />
              {props.errors.additionalFees && props.touched.additionalFees && 
                <div className="error">{props.errors.additionalFees}</div>}
            </div>
          </div>
        );

      case 3: // Financial Details
        return (
          <div className="form-step">
            <h2>Financial Details</h2>
            <div className="form-group">
              <label>Asking Price ($)</label>
              <Field name="askingPrice" type="number" className="form-control" />
              {props.errors.askingPrice && props.touched.askingPrice && 
                <div className="error">{props.errors.askingPrice}</div>}
            </div>
            <div className="form-group">
              <label>Annual Revenue ($)</label>
              <Field name="annualRevenue" type="number" className="form-control" />
              {props.errors.annualRevenue && props.touched.annualRevenue && 
                <div className="error">{props.errors.annualRevenue}</div>}
            </div>
            <div className="form-group">
              <label>Property Type</label>
              <Field name="propertyType" as="select" className="form-control">
                <option value="owned">Owned</option>
                <option value="leased">Leased</option>
              </Field>
            </div>
          </div>
        );

      case 4: // Document Upload
        return (
          <div className="form-step">
            <h2>Document Upload</h2>
            <div className="form-group">
              <label>P&L and Operating Documents (Last 3 Years)</label>
              <FileUploadBox
                fieldName="pnlDocuments"
                acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx"
                onFileSelect={(file) => props.setFieldValue("pnlDocuments", file)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>All current leases (inclusive of all options and any amendments) </label>
              <FileUploadBox
                fieldName="leaseAgreement"
                acceptedTypes=".pdf,.doc,.docx"
                onFileSelect={(file) => props.setFieldValue("leaseAgreement", file)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>Other Documents (HOA, Additional Agreements, etc.)</label>
              <FileUploadBox
                fieldName="otherDocuments"
                acceptedTypes=".pdf,.doc,.docx"
                onFileSelect={(file) => props.setFieldValue("otherDocuments", file)}
                formik={props}
              />
            </div>
          </div>
        );

      case 5: // Personal Information
        return (
          <div className="form-step">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>Full Name</label>
              <Field name="name" className="form-control" />
              {props.errors.name && props.touched.name && <div className="error">{props.errors.name}</div>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <Field name="email" type="email" className="form-control" />
              {props.errors.email && props.touched.email && <div className="error">{props.errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <Field name="phone" className="form-control" />
              {props.errors.phone && props.touched.phone && <div className="error">{props.errors.phone}</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Update the form navigation to handle 5 steps
  return (
    <div className="sell-office-container">
      <h1>Sell Your Dental Office</h1>
      <ProgressBar />
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formikProps) => (
          <Form>
            {renderStep(formikProps)}
            <div className="form-navigation">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                  disabled={formikProps.isSubmitting}
                >
                  Previous
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-primary"
                  disabled={formikProps.isSubmitting}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formikProps.isSubmitting}
                >
                  {formikProps.isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
            {submitStatus && (
              <div className={`submit-status ${submitStatus.includes('Error') ? 'error' : 'success'}`}>
                {submitStatus}
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SellYourOffice;