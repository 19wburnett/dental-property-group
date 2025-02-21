import { useState, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Initialize Supabase client with Next.js environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5MTYyMiwiZXhwIjoyMDUzMDY3NjIyfQ.BLXhq6SXv3ZCQ82UDSp28OhhWIn1UTOuMDInWF4cFvg"
);

// Update webhook endpoint to use Next.js environment variables
const WEBHOOK_ENDPOINT = process.env.NEXT_PUBLIC_WEBHOOK_URL;

// Add validation schema definition
const validationSchema = Yup.object({
  // Property Details (Required)
  streetAddress: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  zipCode: Yup.string()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code')
    .required('Required'),
  
  // Property Details (Optional)
  propertySize: Yup.number().nullable(),
  
  // Building Information (All Optional)
  yearBuilt: Yup.number()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .nullable(),
  hasBeenRenovated: Yup.boolean(),
  renovationYear: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      if (originalValue === '' || isNaN(originalValue)) {
        return null;
      }
      return Number(originalValue);
    })
    .when('hasBeenRenovated', {
      is: true,
      then: () => Yup.number()
        .min(1900, 'Year must be after 1900')
        .max(new Date().getFullYear(), 'Year cannot be in the future'),
      otherwise: () => Yup.mixed().nullable()
    }),
  additionalFees: Yup.array().of(
    Yup.object().shape({
      feeType: Yup.string(),
      amount: Yup.number().min(0, 'Amount must be positive')
    })
  ).default([]),
  buildingType: Yup.string().nullable(),

  // Financial Details (All Optional)
  practiceName: Yup.string().nullable(),
  askingPrice: Yup.number().nullable(),
  numberOfTenants: Yup.number()
    .min(0, 'Must be 0 or greater')
    .nullable(),
  mortgageOwed: Yup.number()
    .min(0, 'Must be 0 or greater')
    .nullable(),
  isAssumable: Yup.boolean(),
  canBeTransferred: Yup.boolean()
    .when(['isAssumable'], {
      is: true,
      then: () => Yup.boolean(),
      otherwise: () => Yup.boolean().nullable()
    }),

  // Personal Info (Required)
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  
  // Personal Info (Optional)
  phone: Yup.string().nullable(),

  // File uploads (Optional)
  pnlDocuments: Yup.array().nullable().default([]),
  leaseAgreement: Yup.array().nullable().default([]),
  otherDocuments: Yup.array().nullable().default([]),
  practicePnlDocuments: Yup.array().nullable().default([]),
  mortgageStatement: Yup.array().nullable().default([])
});

const SellYourOffice = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitStatus, setSubmitStatus] = useState('');

  // Add initialValues definition here
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
    additionalFees: [],
    buildingType: '',

    // Repairs & Maintenance
    repairs: {
      roof: { done: false, year: '', cost: '' },
      siding: { done: false, year: '', cost: '' },
      windowsAndDoors: { done: false, year: '', cost: '' },
      hvac: { done: false, year: '', cost: '' },
      signage: { done: false, year: '', cost: '' },
      walkways: { done: false, year: '', cost: '' },
      parkingLot: { done: false, year: '', cost: '' },
      landscaping: { done: false, year: '', cost: '' },
      foundation: { done: false, year: '', cost: '' },
      otherCapex: { done: false, year: '', cost: '' }
    },

    // Future Repairs
    futureRepairs: {
      roof: { needed: false, yearsUntilNeeded: '' },
      siding: { needed: false, yearsUntilNeeded: '' },
      windowsAndDoors: { needed: false, yearsUntilNeeded: '' },
      hvac: { needed: false, yearsUntilNeeded: '' },
      signage: { needed: false, yearsUntilNeeded: '' },
      walkways: { needed: false, yearsUntilNeeded: '' },
      parkingLot: { needed: false, yearsUntilNeeded: '' },
      landscaping: { needed: false, yearsUntilNeeded: '' },
      foundation: { needed: false, yearsUntilNeeded: '' },
      otherCapex: { needed: false, yearsUntilNeeded: '' }
    },

    // Financial Details
    practiceName: '',
    askingPrice: '',
    numberOfTenants: '',
    mortgageOwed: '',
    isAssumable: false,
    canBeTransferred: false,

    // Personal Info
    name: '',
    email: '',
    phone: '',

    // File Uploads
    pnlDocuments: [],
    leaseAgreement: [],
    otherDocuments: [],
    practicePnlDocuments: [],
    mortgageStatement: []
  };

  // Add US States array for the dropdown
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

  // Define steps array
  const steps = [
    { number: 1, label: 'Property Details' },
    { number: 2, label: 'Building Info' },
    { number: 3, label: 'Past Repairs' },
    { number: 4, label: 'Future Repairs' },
    { number: 5, label: 'Financial' },
    { number: 6, label: 'Documents' },
    { number: 7, label: 'Personal Info' }
  ];

  // Define ProgressBar component
  const ProgressBar = () => {
    const progress = ((step - 1) / (steps.length - 1)) * 100;
    return (
      <div className="progress-bar-container">
        <div className="progress-steps">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          {steps.map((s) => (
            <div
              key={s.number}
              className={`step ${step === s.number ? 'active' : step > s.number ? 'completed' : ''}`}
            >
              {step > s.number ? '✓' : s.number}
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>
        <style jsx>{`
          .progress-bar-container {
            margin: 2rem 0;
            position: relative;
          }
          .progress-steps {
            display: flex;
            justify-content: space-between;
            position: relative;
            margin-top: 30px;
          }
          .progress-bar-fill {
            position: absolute;
            height: 2px;
            background: #007bff;
            top: 50%;
            transform: translateY(-50%);
            transition: width 0.3s ease;
            z-index: 1;
          }
          .step {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: white;
            border: 2px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
          }
          .step.active {
            border-color: #007bff;
            background: #007bff;
            color: white;
          }
          .step.completed {
            border-color: #007bff;
            background: #007bff;
            color: white;
          }
          .step-label {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 0.5rem;
            font-size: 0.75rem;
            white-space: nowrap;
          }
        `}</style>
      </div>
    );
  };

  // Add FileUploadBox component definition
  const FileUploadBox = ({ fieldName, acceptedTypes, onFileSelect, formik }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const files = formik.values[fieldName] || [];
    const fileErrors = formik.errors[fieldName];
    const hasError = formik.touched[fieldName] && fileErrors;

    const handleDragOver = (e) => {
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
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    };

    const handleFiles = (newFiles) => {
      const validFiles = newFiles.filter(file => {
        // Validate file type
        const fileType = file.type;
        const validTypes = acceptedTypes.split(',').map(type => 
          type.replace('.', 'application/').replace('doc', 'msword')
        );

        // Validate file size (10MB)
        if (file.size > 10000000) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          return false;
        }

        if (!validTypes.includes(fileType)) {
          console.warn(`File ${file.name} has invalid type`);
          return false;
        }

        return true;
      });

      onFileSelect([...files, ...validFiles]);
    };

    const handleClick = () => {
      fileInputRef.current?.click();
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
        onClick={handleClick}
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
              <div className="file-upload-text">
                Drop more files or click to select
              </div>
            </div>
          ) : (
            <div className="file-upload-text">
              Drag and drop files here, or click to select
            </div>
          )}
        </div>
        {hasError && <div className="file-error">{fileErrors}</div>}

        <style jsx>{`
          .file-upload-box {
            border: 2px dashed #ccc;
            border-radius: 4px;
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .file-upload-box.dragging {
            background-color: #f8f9fa;
            border-color: #0056b3;
          }

          .file-upload-box.has-error {
            border-color: #dc3545;
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
            max-width: 500px;
            margin: 0 auto;
          }

          .file-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            background: #f8f9fa;
            border-radius: 4px;
          }

          .file-name {
            flex: 1;
            margin-right: 1rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .remove-file {
            background: none;
            border: none;
            color: #dc3545;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            font-size: 1rem;
          }

          .file-error {
            color: #dc3545;
            margin-top: 0.5rem;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  };

  // Keep the same initialValues from the original file
  // ...existing code for initialValues...

  // Keep the same handleSubmit function but update the navigation
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log('Form is being submitted with values:', values); // Debugging line
    try {
      // Validate files before submission
      const validateFiles = (files) => {
        if (!files || !Array.isArray(files)) return true;
        return files.every(file => {
          if (!file) return true;
          const isValidSize = file.size <= 10000000; // 10MB
          const isValidType = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].includes(file.type);
          return isValidSize && isValidType;
        });
      };

      // Validate all file arrays
      const fileFields = ['pnlDocuments', 'leaseAgreement', 'otherDocuments', 'practicePnlDocuments', 'mortgageStatement'];
      const fileValidationErrors = fileFields.reduce((errors, field) => {
        if (!validateFiles(values[field])) {
          errors[field] = 'Invalid files detected. Please check file types and sizes.';
        }
        return errors;
      }, {});

      // If there are file validation errors, throw them
      if (Object.keys(fileValidationErrors).length > 0) {
        throw new Error(JSON.stringify(fileValidationErrors));
      }

      // Prepare base submission data
      const baseSubmission = {
        // Personal Info
        name: values.name,
        email: values.email,
        phone: values.phone,

        // Property Details
        street_address: values.streetAddress,
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        property_size: values.propertySize ? Number(values.propertySize) : null,

        // Building Information
        property_type: values.buildingType || 'unknown',
        year_built: values.yearBuilt ? Number(values.yearBuilt) : null,
        has_been_renovated: values.hasBeenRenovated,
        renovation_year: values.hasBeenRenovated && values.renovationYear ? Number(values.renovationYear) : null,
        additional_fees: values.additionalFees,

        // Past Repairs & Maintenance
        past_repairs: Object.entries(values.repairs).reduce((acc, [key, value]) => {
          if (value.done) {
            acc[key] = {
              year_completed: value.year ? Number(value.year) : null,
              cost: value.cost ? Number(value.cost) : null
            };
          }
          return acc;
        }, {}),

        // Future Repairs
        future_repairs: Object.entries(values.futureRepairs).reduce((acc, [key, value]) => {
          if (value.needed) {
            acc[key] = {
              years_until_needed: value.yearsUntilNeeded ? Number(value.yearsUntilNeeded) : null
            };
          }
          return acc;
        }, {}),

        // Financial Details
        practice_name: values.practiceName,
        asking_price: values.askingPrice ? Number(values.askingPrice) : null,
        number_of_tenants: values.numberOfTenants ? Number(values.numberOfTenants) : null,
        mortgage_owed: values.mortgageOwed ? Number(values.mortgageOwed) : null,
        is_assumable: values.isAssumable,
        can_be_transferred: values.isAssumable ? values.canBeTransferred : null,

        // Metadata
        created_at: new Date().toISOString(),
        status: 'new',
        submission_source: 'web_form'
      };

      // Insert into Supabase
      const { data: submissionData, error: submissionError } = await supabase
        .from('property_submissions')
        .insert([baseSubmission])
        .select();

      if (submissionError) throw submissionError;

      // Handle file uploads if we have a successful submission
      if (submissionData?.[0]?.id) {
        const submissionId = submissionData[0].id;
        const fileTypes = [
          { field: 'pnlDocuments', type: 'pnl', label: 'Property P&L Documents' },
          { field: 'practicePnlDocuments', type: 'practice_pnl', label: 'Practice P&L Documents' },
          { field: 'leaseAgreement', type: 'lease', label: 'Lease Agreement' },
          { field: 'mortgageStatement', type: 'mortgage', label: 'Mortgage Statement' },
          { field: 'otherDocuments', type: 'other', label: 'Other Documents' }
        ];

        // Upload files sequentially
        for (const { field, type, label } of fileTypes) {
          const files = values[field];
          if (files && Array.isArray(files) && files.length > 0) {
            for (const file of files) {
              try {
                const timestamp = new Date().getTime();
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${type}_${timestamp}_${safeFileName}`;
                const filePath = `${submissionId}/${type}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('property-documents')
                  .upload(filePath, file);

                if (uploadError) {
                  console.error(`Error uploading file ${file.name}:`, uploadError);
                  continue;
                }

                // Record file metadata
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
                  console.error(`Error recording file metadata for ${file.name}:`, fileRecordError);
                }
              } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
              }
            }
          }
        }
      }

      // Send webhook notification
      if (submissionData?.[0]?.id) {
        try {
          // Format data exactly as n8n expects it
          const webhookPayload = {
            id: submissionData[0].id,
            submissionDate: new Date().toISOString(),
            property: {
              address: values.streetAddress,
              city: values.city,
              state: values.state,
              zipCode: values.zipCode,
              size: values.propertySize,
              type: values.buildingType,
              yearBuilt: values.yearBuilt,
              renovated: values.hasBeenRenovated,
              renovationYear: values.renovationYear
            },
            financials: {
              practiceName: values.practiceName,
              askingPrice: values.askingPrice,
              numberOfTenants: values.numberOfTenants,
              mortgageOwed: values.mortgageOwed,
              isAssumable: values.isAssumable,
              canBeTransferred: values.canBeTransferred
            },
            repairs: {
              past: values.repairs,
              future: values.futureRepairs
            },
            contact: {
              name: values.name,
              email: values.email,
              phone: values.phone
            },
            documents: {
              pnlUploaded: values.pnlDocuments.length > 0,
              leaseUploaded: values.leaseAgreement.length > 0,
              practicePnlUploaded: values.practicePnlDocuments.length > 0,
              mortgageStatementUploaded: values.mortgageStatement.length > 0,
              otherDocumentsUploaded: values.otherDocuments.length > 0
            },
            additionalFees: values.additionalFees
          };

          // Send to webhook
          const response = await fetch(WEBHOOK_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
          });

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`);
          }

          console.log('Webhook notification sent successfully');
        } catch (webhookError) {
          console.error('Webhook notification failed:', webhookError);
          // Don't fail the submission if webhook fails
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

  // Keep the existing components (ProgressBar, FileUploadBox, etc.)
  // ...existing code for components...

  const renderStep = (props) => {
    switch (step) {
      case 1: // Property Details
        return (
          <div className="form-step">
            <h2>Property Details</h2>
            <div className="form-group">
              <label>Street Address - Required</label>
              <Field name="streetAddress" className="form-control" />
              {props.errors.streetAddress && props.touched.streetAddress && 
                <div className="error">{props.errors.streetAddress}</div>}
            </div>
            <div className="form-group">
              <label>City - Required</label>
              <Field name="city" className="form-control" />
              {props.errors.city && props.touched.city && 
                <div className="error">{props.errors.city}</div>}
            </div>
            <div className="form-row">
              <div className="form-group state-select">
                <label>State - Required</label>
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
                <label>ZIP Code - Required</label>
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
              <label>Property Type</label>
              <Field name="buildingType" as="select" className="form-control">
                <option value="">Select Property Type</option>
                <option value="condo">Condominium</option>
                <option value="whole">Whole Building</option>
              </Field>
              {props.errors.buildingType && props.touched.buildingType && 
                <div className="error">{props.errors.buildingType}</div>}
            </div>
            
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
              <label>Monthly Fees (COA, Service Contract, Property Management, etc.)</label>
              <div className="fees-container">
                {props.values.additionalFees.map((fee, index) => (
                  <div key={index} className="fee-row">
                    <Field
                      name={`additionalFees.${index}.feeType`}
                      placeholder="Fee Type (e.g., COA, Service Contract)"
                      className="form-control fee-type"
                    />
                    <Field
                      name={`additionalFees.${index}.amount`}
                      type="number"
                      placeholder="Amount"
                      className="form-control fee-amount"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFees = [...props.values.additionalFees];
                        newFees.splice(index, 1);
                        props.setFieldValue('additionalFees', newFees);
                      }}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    props.setFieldValue('additionalFees', [
                      ...props.values.additionalFees,
                      { feeType: '', amount: '' }
                    ]);
                  }}
                  className="btn-add"
                >
                  + Add Fee
                </button>
              </div>
            </div>
          </div>
        );

      case 3: // Repairs & Maintenance
        const repairItems = [
          { key: 'roof', label: 'Roof' },
          { key: 'siding', label: 'Siding' },
          { key: 'windowsAndDoors', label: 'Windows and Doors' },
          { key: 'hvac', label: 'HVAC' },
          { key: 'signage', label: 'Signage' },
          { key: 'walkways', label: 'Walkways' },
          { key: 'parkingLot', label: 'Parking Lot' },
          { key: 'landscaping', label: 'Landscaping' },
          { key: 'foundation', label: 'Foundation' },
          { key: 'otherCapex', label: 'Other Capital Expenses' }
        ];

        return (
          <div className="form-step">
            <h2>Repairs & Maintenance History</h2>
            <p>What repairs and maintenance has been done in the past?</p>
            <div className="form-group repairs-grid">
              {repairItems.map(({ key, label }) => (
                <div key={key} className="repair-item">
                  <label>
                    <Field
                      type="checkbox"
                      name={`repairs.${key}.done`}
                    />
                    {label}
                  </label>
                  {props.values.repairs[key]?.done && (
                    <div className="repair-details">
                      <Field
                        name={`repairs.${key}.year`}
                        type="number"
                        placeholder="Year"
                        className="form-control"
                      />
                      <Field
                        name={`repairs.${key}.cost`}
                        type="number"
                        placeholder="Cost ($)"
                        className="form-control"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // Future Repairs
        const futureRepairItems = [
          { key: 'roof', label: 'Roof' },
          { key: 'siding', label: 'Siding' },
          { key: 'windowsAndDoors', label: 'Windows and Doors' },
          { key: 'hvac', label: 'HVAC' },
          { key: 'signage', label: 'Signage' },
          { key: 'walkways', label: 'Walkways' },
          { key: 'parkingLot', label: 'Parking Lot' },
          { key: 'landscaping', label: 'Landscaping' },
          { key: 'foundation', label: 'Foundation' },
          { key: 'otherCapex', label: 'Other Capital Expenses' }
        ];

        return (
          <div className="form-step">
            <h2>Future Repairs</h2>
            <p>What repairs and maintenance should we plan for in the next 5 years?</p>
            <div className="form-group repairs-grid">
              {futureRepairItems.map(({ key, label }) => (
                <div key={key} className="repair-item">
                  <label>
                    <Field
                      type="checkbox"
                      name={`futureRepairs.${key}.needed`}
                    />
                    {label}
                  </label>
                  {props.values.futureRepairs[key]?.needed && (
                    <div className="repair-details">
                      <Field
                        name={`futureRepairs.${key}.yearsUntilNeeded`}
                        type="number"
                        placeholder="Years until needed"
                        className="form-control"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5: // Financial Details
        return (
          <div className="form-step">
            <h2>Financial Details</h2>
            <div className="form-group">
              <label>Practice Name</label>
              <Field name="practiceName" className="form-control" />
              {props.errors.practiceName && props.touched.practiceName && 
                <div className="error">{props.errors.practiceName}</div>}
            </div>
            <div className="form-group">
              <label>Asking Price ($)</label>
              <Field name="askingPrice" type="number" className="form-control" />
              {props.errors.askingPrice && props.touched.askingPrice && 
                <div className="error">{props.errors.askingPrice}</div>}
            </div>

            <div className="form-group">
              <label>Number of Tenants</label>
              <Field name="numberOfTenants" type="number" className="form-control" />
              {props.errors.numberOfTenants && props.touched.numberOfTenants && 
                <div className="error">{props.errors.numberOfTenants}</div>}
            </div>
            <div className="form-group">
              <label>Amount Owed on Mortgage ($)</label>
              <Field 
                name="mortgageOwed" 
                type="number" 
                className="form-control"
                onChange={(e) => {
                  props.setFieldValue('mortgageOwed', e.target.value);
                  if (!e.target.value || e.target.value === '0') {
                    props.setFieldValue('mortgageStatement', []);
                  }
                }}
              />
              {props.errors.mortgageOwed && props.touched.mortgageOwed && 
                <div className="error">{props.errors.mortgageOwed}</div>}
            </div>

            {props.values.mortgageOwed > 0 && (
              <div className="form-group">
                <label>Most Recent Mortgage Statement</label>
                <div className="form-hint">Please upload your most recent mortgage statement</div>
                <FileUploadBox
                  fieldName="mortgageStatement"
                  acceptedTypes=".pdf,.doc,.docx"
                  onFileSelect={(files) => props.setFieldValue("mortgageStatement", files)}
                  formik={props}
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <Field type="checkbox" name="isAssumable" />
                Is the mortgage assumable?
              </label>
              {props.errors.isAssumable && props.touched.isAssumable && 
                <div className="error">{props.errors.isAssumable}</div>}
            </div>
            {props.values.isAssumable && (
              <div className="form-group">
                <label>
                  <Field type="checkbox" name="canBeTransferred" />
                  Could it be transferred to us as part of the deal?
                </label>
                {props.errors.canBeTransferred && props.touched.canBeTransferred && 
                  <div className="error">{props.errors.canBeTransferred}</div>}
              </div>
            )}
          </div>
        );

      case 6: // Document Upload
        return (
          <div className="form-step">
            <h2>Document Upload</h2>
            <div className="form-group">
              <label>Property P&L and Operating Documents (Last 3 Years)</label>
              <div className="form-hint">Upload financial documents related to the real estate property</div>
              <FileUploadBox
                fieldName="pnlDocuments"
                acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx"
                onFileSelect={(files) => props.setFieldValue("pnlDocuments", files)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>Practice P&L Documents (Last 3 Years)</label>
              <div className="form-hint">Upload financial documents related to the dental practice operations</div>
              <FileUploadBox
                fieldName="practicePnlDocuments"
                acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx"
                onFileSelect={(files) => props.setFieldValue("practicePnlDocuments", files)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>All current leases (inclusive of all options and any amendments)</label>
              <FileUploadBox
                fieldName="leaseAgreement"
                acceptedTypes=".pdf,.doc,.docx"
                onFileSelect={(files) => props.setFieldValue("leaseAgreement", files)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>Other Documents (HOA, Additional Agreements, etc.)</label>
              <FileUploadBox
                fieldName="otherDocuments"
                acceptedTypes=".pdf,.doc,.docx"
                onFileSelect={(files) => props.setFieldValue("otherDocuments", files)}
                formik={props}
              />
            </div>
          </div>
        );

      case 7: // Personal Information
        return (
          <div className="form-step">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>Who should we contact about this deal? - Required</label>
              <Field name="name" className="form-control" placeholder="Name" />
              {props.errors.name && props.touched.name && 
                <div className="error">{props.errors.name}</div>}
            </div>
            <div className="form-group">
              <label>What is the best email to reach you? - Required</label>
              <Field name="email" type="email" className="form-control" placeholder="Email"/>
              {props.errors.email && props.touched.email && 
                <div className="error">{props.errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <Field name="phone" className="form-control" placeholder="Phone"/>
              {props.errors.phone && props.touched.phone && 
                <div className="error">{props.errors.phone}</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Sell Your Dental Office | Dental Property Group</title>
        <meta name="description" content="Submit your dental office property details for sale consideration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
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
              <div className="button-container">
                <div className="navigation-buttons">
                  {step > 1 && (
                    <button
                      type="button"
                      className="nav-button prev"
                      onClick={() => setStep(step - 1)}
                      disabled={formikProps.isSubmitting}
                    >
                      Previous
                    </button>
                  )}
                  {step < steps.length ? (
                    <button
                      type="button"
                      className="nav-button next"
                      onClick={() => setStep(step + 1)}
                      disabled={formikProps.isSubmitting}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="nav-button submit"
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
              </div>
            </Form>
          )}
        </Formik>

        <style jsx>{`
          .sell-office-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          .progress-bar-container {
            margin: 2rem 0;
            position: relative;
          }

          .form-step {
            margin-bottom: 2rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-control {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          .form-navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 2rem;
            gap: 1rem;
          }

          .btn-primary,
          .btn-secondary {
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s ease;
            min-width: 120px;
          }

          .btn-primary {
            background-color: #007bff;
            color: white;
          }

          .btn-primary:hover {
            background-color: #0056b3;
          }

          .btn-secondary {
            background-color: #6c757d;
            color: white;
          }

          .btn-secondary:hover {
            background-color: #545b62;
          }

          .submit-button {
            background-color: #28a745;
          }

          .submit-button:hover {
            background-color: #218838;
          }

          button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .error {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }

          .submit-status {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 4px;
          }

          .submit-status.success {
            background-color: #d4edda;
            color: #155724;
          }

          .submit-status.error {
            background-color: #f8d7da;
            color: #721c24;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .form-navigation {
              flex-direction: column-reverse;
            }

            .btn-primary,
            .btn-secondary {
              width: 100%;
            }
          }

          .button-container {
            margin-top: 2rem;
            padding: 1rem 0;
          }

          .navigation-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
          }

          .nav-button {
            background: #0056b3;
            color: white;
            border: none;
            padding: 0.75rem 2.5rem;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 150px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .nav-button:hover {
            background: #003d82;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
          }

          .nav-button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .nav-button.prev {
            background: #6c757d;
          }

          .nav-button.prev:hover {
            background: #545b62;
          }

          .nav-button.submit {
            background: #28a745;
          }

          .nav-button.submit:hover {
            background: #218838;
          }

          .nav-button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }

          @media (max-width: 768px) {
            .navigation-buttons {
              flex-direction: column;
              align-items: stretch;
            }

            .nav-button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default SellYourOffice;
