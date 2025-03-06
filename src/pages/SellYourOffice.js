import React, { useState, useRef } from 'react';
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
  ? process.env.REACT_APP_WEBHOOK_URL_PROD  // Use N8N webhook URL directly
  : process.env.REACT_APP_WEBHOOK_URL_TEST;  // Use test webhook URL directly

// Update validation schema
const validationSchema = Yup.object({

  // Property Details (Required)
  
  fullAddress: Yup.string().required('Address is required'),
  
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
  numberOfTenants: Yup.number()
    .min(0, 'Must be 0 or greater')
    .nullable(),

  // Add new lease-related validations
  tenantPaysUtilities: Yup.boolean(),
  tenantPaysTaxes: Yup.boolean(),
  tenantPaysInsurance: Yup.boolean(),

  // Personal Info (Required)
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  
  // Personal Info (Optional)
  phone: Yup.string().nullable(),

  // File uploads (Optional)
  pnlDocuments: Yup.array().nullable().default([]),
  leaseAgreement: Yup.array().nullable().default([]),
  otherDocuments: Yup.array().nullable().default([]),

  // Add new file upload field validation
  practicePnlDocuments: Yup.array().nullable().default([]),

  // Add mortgage statement file validation
  mortgageStatement: Yup.array().nullable().default([]),

  // Add notes field validation
  notes: Yup.string().nullable(),
});

const SellYourOffice = () => {
  const [step, setStep] = useState(1);
  const [submitStatus, setSubmitStatus] = useState('');

  const initialValues = {
    // Property Details
    fullAddress: '',  // New consolidated address field
    propertySize: '',
    
    // Building Information
    yearBuilt: '',
    hasBeenRenovated: false,
    renovationYear: '',
    commonFees: {
      propertymanagement: { applicable: false, amount: '' },
      hoa: { applicable: false, amount: '' },
      servicecontract: { applicable: false, amount: '' },
      utilities: { applicable: false, amount: '' },
      insurance: { applicable: false, amount: '' }
    },
    additionalFees: [], // For custom fees
    buildingType: '',

    // Repairs & Maintenance
    repairs: {
      roof: { done: false, year: '', cost: '' },
      siding: { done: false, year: '', cost: '' },
      windowsanddoors: { done: false, year: '', cost: '' },
      hvac: { done: false, year: '', cost: '' },
      signage: { done: false, year: '', cost: '' },
      walkways: { done: false, year: '', cost: '' },
      parkinglot: { done: false, year: '', cost: '' },
      landscaping: { done: false, year: '', cost: '' },
      foundation: { done: false, year: '', cost: '' },
      // Change othercapex from single item to array
      otherCapexItems: []
    },

    // Future Repairs
    futureRepairs: {
      roof: { needed: false, yearsUntilNeeded: '' },
      siding: { needed: false, yearsUntilNeeded: '' },
      windowsanddoors: { needed: false, yearsUntilNeeded: '' },
      hvac: { needed: false, yearsUntilNeeded: '' },
      signage: { needed: false, yearsUntilNeeded: '' },
      walkways: { needed: false, yearsUntilNeeded: '' },
      parkinglot: { needed: false, yearsUntilNeeded: '' },
      landscaping: { needed: false, yearsUntilNeeded: '' },
      foundation: { needed: false, yearsUntilNeeded: '' },
      // Change othercapex from single item to array
      otherCapexItems: []
    },

    // Financial Details
    practiceName: '',
    numberOfTenants: '',

    // Add new lease-related fields
    tenantPaysUtilities: false,
    tenantPaysTaxes: false,
    tenantPaysInsurance: false,

    // Personal Info
    name: '',
    email: '',
    phone: '',

    // File Uploads
    pnlDocuments: [],
    leaseAgreement: [],
    otherDocuments: [],

    // Add new file upload field
    practicePnlDocuments: [],

    // Add mortgage statement file field
    mortgageStatement: [],

    // Add notes field
    notes: '',
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
        address: values.fullAddress,  // Use consolidated address field
        property_size: values.propertySize ? Number(values.propertySize) : null,

        // Building Information
        property_type: values.buildingType || 'unknown', // Changed from building_type and added default
        year_built: values.yearBuilt ? Number(values.yearBuilt) : null,
        has_been_renovated: values.hasBeenRenovated,
        renovation_year: values.hasBeenRenovated && values.renovationYear ? Number(values.renovationYear) : null,
        
        // Flatten additional fees into separate columns
        // Convert array to numbered fields
        ...values.additionalFees.reduce((acc, fee, index) => ({
          ...acc,
          [`fee_type_${index + 1}`]: fee.feeType,
          [`fee_amount_${index + 1}`]: fee.amount
        }), {}),

        // Flatten common fees into separate columns
        ...Object.entries(values.commonFees).reduce((acc, [key, value]) => ({
          ...acc,
          [`fee_${key}_applicable`]: value.applicable,
          [`fee_${key}_amount`]: value.applicable ? Number(value.amount) : null
        }), {}),

        // Past Repairs & Maintenance - Flatten into individual fields
        ...Object.entries(values.repairs).reduce((acc, [key, value]) => {
          if (key !== 'otherCapexItems') {
            return {
              ...acc,
              [`repair_${key}_done`]: value.done,
              [`repair_${key}_year`]: value.done ? value.year : null,
              [`repair_${key}_cost`]: value.done ? value.cost : null
            };
          }
          return acc;
        }, {}),

        // Add other capex items for past repairs
        ...values.repairs.otherCapexItems.reduce((acc, item, index) => {
          if (index < 5) { // Limit to 5 items as defined in the database
            return {
              ...acc,
              [`repair_othercapexitems_${index}_done`]: item.done,
              [`repair_othercapexitems_${index}_type`]: item.type,
              [`repair_othercapexitems_${index}_year`]: item.done ? item.year : null,
              [`repair_othercapexitems_${index}_cost`]: item.done ? item.cost : null
            };
          }
          return acc;
        }, {}),

        // Future Repairs - Flatten into individual fields
        ...Object.entries(values.futureRepairs).reduce((acc, [key, value]) => {
          if (key !== 'otherCapexItems') {
            return {
              ...acc,
              [`future_repair_${key}_needed`]: value.needed,
              [`future_repair_${key}_years_until_needed`]: value.needed ? value.yearsUntilNeeded : null
            };
          }
          return acc;
        }, {}),

        // Add other capex items for future repairs
        ...values.futureRepairs.otherCapexItems.reduce((acc, item, index) => {
          if (index < 5) { // Limit to 5 items as defined in the database
            return {
              ...acc,
              [`future_repair_othercapexitems_${index}_needed`]: item.needed,
              [`future_repair_othercapexitems_${index}_type`]: item.type,
              [`future_repair_othercapexitems_${index}_years_until_needed`]: item.needed ? item.yearsUntilNeeded : null
            };
          }
          return acc;
        }, {}),

        // Financial Details
        practice_name: values.practiceName,
        number_of_tenants: values.numberOfTenants ? Number(values.numberOfTenants) : null,

        // Add new lease-related fields
        tenant_pays_utilities: values.tenantPaysUtilities,
        tenant_pays_taxes: values.tenantPaysTaxes,
        tenant_pays_insurance: values.tenantPaysInsurance,

        // Document Information - Convert arrays to counts and concatenated names
        pnl_documents_count: values.pnlDocuments?.length || 0,
        pnl_documents_names: values.pnlDocuments?.map(f => f.name).join('; ') || '',
        
        practice_pnl_documents_count: values.practicePnlDocuments?.length || 0,
        practice_pnl_documents_names: values.practicePnlDocuments?.map(f => f.name).join('; ') || '',
        
        lease_documents_count: values.leaseAgreement?.length || 0,
        lease_documents_names: values.leaseAgreement?.map(f => f.name).join('; ') || '',
        
        other_documents_count: values.otherDocuments?.length || 0,
        other_documents_names: values.otherDocuments?.map(f => f.name).join('; ') || '',

        // Metadata
        created_at: new Date().toISOString(),
        status: 'new',
        submission_source: 'web_form',

        // Include notes in submission
        notes: values.notes,
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

        // Upload files sequentially to avoid overwhelming the server
        for (const { field, type, label } of fileTypes) {
          const files = values[field];
          if (files && Array.isArray(files) && files.length > 0) {
            for (const file of files) {
              try {
                const timestamp = new Date().getTime();
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const fileName = `${type}_${timestamp}_${safeFileName}`;
                const filePath = `${submissionId}/${type}/${fileName}`;

                // Fix the storage upload syntax error
                const { error: uploadError } = await supabase.storage
                  .from('property-documents')
                  .upload(filePath, file);

                if (uploadError) {
                  console.error(`Error uploading file ${file.name}:`, uploadError);
                  continue;
                }

                // Get the public URL for the uploaded file
                const { data: publicUrlData } = supabase.storage
                  .from('property-documents')
                  .getPublicUrl(filePath);

                // Then, create a record in the property_files table
                const fileRecord = {
                  submission_id: submissionId,
                  file_name: file.name,
                  file_type: type,
                  file_path: filePath,
                  file_size: file.size,
                  mime_type: file.type,
                  display_name: label,
                  public_url: publicUrlData?.publicUrl || null,
                  status: 'uploaded',
                  uploaded_at: new Date().toISOString(),
                  submission_type: 'property_sale', // Add this missing field
                };

                console.log('Attempting to insert file record:', fileRecord);

                // Add debug logging for the insert operation
                const { data: fileData, error: fileRecordError } = await supabase
                  .from('property_files')
                  .insert([fileRecord])
                  .select();

                if (fileRecordError) {
                  console.error(`Error recording file metadata for ${file.name}:`, fileRecordError);
                } else {
                  console.log('Successfully inserted file record:', fileData);
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
          await fetch(WEBHOOK_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submissionId: submissionData[0].id,
              ...baseSubmission
            })
          });
        } catch (webhookError) {
          console.warn('Webhook notification failed:', webhookError);
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
    { number: 1},
    { number: 2},
    { number: 3},
    { number: 4 },
    { number: 5 },
    { number: 6 },
    { number: 7 }
  ];

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
      </div>
    );
  };

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

      // Append new files to existing ones
      const updatedFiles = [...files, ...validFiles];
      onFileSelect(updatedFiles);
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
      </div>
    );
  };

  const renderStep = (props) => {
    switch (step) {
      case 1: // Property Details
        return (
          <div className="form-step">
            <h2>I'm going to be asking you a few questions about your property</h2>
            <p>We do this in order to get you an offer. It shouldn't take longer than 30 minutes</p>
            <div className="form-group">
              <label>What is the address of the property?</label>
              <Field 
                name="fullAddress" 
                className="form-control" 
                placeholder="Enter the complete address (street, city, state, ZIP)"
              />
              {props.errors.fullAddress && props.touched.fullAddress && 
                <div className="error">{props.errors.fullAddress}</div>}
              <div className="form-hint">
                Please enter the full address including street, city, state and ZIP code
              </div>
            </div>
            
            <div className="form-group">
              <label>What is the size of the property in square feet?</label>
              <Field name="propertySize" type="number" className="form-control" />
              {props.errors.propertySize && props.touched.propertySize && 
                <div className="error">{props.errors.propertySize}</div>}
            </div>
          </div>
        );

      case 2: // Building Information
        const commonFeeItems = [
          { key: 'propertymanagement', label: 'Property Management Fees', hint: 'If a third party manages the building' },
          { key: 'hoa', label: 'HOA or Business Park Fees', hint: 'If the office is in a professional complex with shared maintenance costs' },
          { key: 'servicecontract', label: 'Service Contracts', hint: 'Regular maintenance agreements' },
          { key: 'utilities', label: 'Common Area Utilities', hint: 'Shared utility costs' },
          { key: 'insurance', label: 'Building Insurance', hint: 'Monthly insurance premiums' },
        ];

        // Initialize commonFees if it doesn't exist
        if (!props.values.commonFees) {
          const initialCommonFees = {};
          commonFeeItems.forEach(item => {
            initialCommonFees[item.key] = { applicable: false, amount: '' };
          });
          props.setFieldValue('commonFees', initialCommonFees);
        }

        return (
          <div className="form-step">
            <h2>Now I'm going to ask a few questions about the building</h2>
            <div className="form-group">
              <label>Is the property a condominium or is it a whole building?</label>
              <Field name="buildingType" as="select" className="form-control">
                <option value="">Select Property Type</option>
                <option value="condo">Condominium</option>
                <option value="whole">Whole Building</option>
              </Field>
              {props.errors.buildingType && props.touched.buildingType && 
                <div className="error">{props.errors.buildingType}</div>}
            </div>
            
            <div className="form-group">
              <label>What year was the building built?</label>
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
                <label>When was the last time it was rennovated?</label>
                <Field name="renovationYear" type="number" className="form-control" />
                {props.errors.renovationYear && props.touched.renovationYear && 
                  <div className="error">{props.errors.renovationYear}</div>}
              </div>
            )}

            {/* Common Monthly Fees Section */}
            <div className="form-group">
              <h3>Do you have any of the following monthly fees?</h3>
              <div className="common-fees-container">
                {commonFeeItems.map(({ key, label, hint }) => {
                  // Ensure the fee object exists for this key
                  if (!props.values.commonFees[key]) {
                    props.setFieldValue(`commonFees.${key}`, { applicable: false, amount: '' });
                  }
                  return (
                    <div key={key} className="fee-item">
                      <label>
                        <Field
                          type="checkbox"
                          name={`commonFees.${key}.applicable`}
                        />
                        {label}
                      </label>
                      <div className="fee-hint">{hint}</div>
                      {props.values.commonFees && props.values.commonFees[key]?.applicable && (
                        <div className="fee-amount-input">
                          <Field
                            name={`commonFees.${key}.amount`}
                            type="number"
                            placeholder="How much monthly?"
                            className="form-control"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Custom Fees */}
            <div className="form-group">
              <h4>Are there any other monthly fees that I didn't mention?</h4>
              <div className="fees-container">
                {props.values.additionalFees.map((fee, index) => (
                  <div key={index} className="fee-row">
                    <Field
                      name={`additionalFees.${index}.feeType`}
                      placeholder="Fee Type"
                      className="form-control fee-type"
                    />
                    <Field
                      name={`additionalFees.${index}.amount`}
                      type="number"
                      placeholder="Amount ($)"
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
                  + Add Custom Fee
                </button>
              </div>
            </div>
          </div>
        );

      case 3: // Repairs & Maintenance
        const repairItems = [
          { key: 'roof', label: 'When was the last time the roof was repaired?' },
          { key: 'siding', label: 'When was the last time siding was done?' },
          { key: 'windowsanddoors', label: 'When was the last time windows and doors were repaired?' },
          { key: 'hvac', label: 'When was the last time the HVAC was repaired?' },
          { key: 'signage', label: 'When was the last time signage was repaired?' },
          { key: 'walkways', label: 'When was the last time the walkways were repaired?' },
          { key: 'parkinglot', label: 'When was the last time the parking lot was repaired?' },
          { key: 'landscaping', label: 'When was the last time the landscaping was done?' },
          { key: 'foundation', label: 'When was the last time the foundation was repaired?' },
          // Removed othercapex from here as it will be handled separately
        ];

        return (
          <div className="form-step">
            <h2>Now let's talk about repairs and maintenance that you have done on the property</h2>
            <p>If you can't remember exact dates and numbers, no worries, just put your best guess.</p>
            <div className="form-group repairs-grid">
              {repairItems.map(({ key, label }) => {
                // Ensure the repair object exists for this key
                if (!props.values.repairs[key]) {
                  props.setFieldValue(`repairs.${key}`, { done: false, year: '', cost: '' });
                }
                return (
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
                );
              })}
            </div>
            
            {/* Other Capex section with ability to add multiple items */}
            <div className="form-group other-capex-section">
              <h3>Is there any other maintenance that we should know about?</h3>
              {props.values.repairs.otherCapexItems && props.values.repairs.otherCapexItems.length > 0 ? (
                props.values.repairs.otherCapexItems.map((item, index) => (
                  <div key={index} className="other-capex-item">
                    <div className="other-capex-header">
                      <label>
                        <Field
                          type="checkbox"
                          name={`repairs.otherCapexItems.${index}.done`}
                          checked={item.done}
                          onChange={(e) => {
                            const updatedItems = [...props.values.repairs.otherCapexItems];
                            updatedItems[index].done = e.target.checked;
                            props.setFieldValue('repairs.otherCapexItems', updatedItems);
                          }}
                        />
                        Other Capital Expenditure
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedItems = [...props.values.repairs.otherCapexItems];
                          updatedItems.splice(index, 1);
                          props.setFieldValue('repairs.otherCapexItems', updatedItems);
                        }}
                        className="btn-remove capex-remove"
                      >
                        ✕
                      </button>
                    </div>
                    {item.done && (
                      <div className="other-capex-details" style={{gap:'20px', display:'flex'}}>
                        <Field
                          name={`repairs.otherCapexItems.${index}.type`}
                          placeholder="Type of Capital Expenditure"
                          className="form-control"
                        />
                        <Field
                          name={`repairs.otherCapexItems.${index}.year`}
                          type="number"
                          placeholder="Year"
                          className="form-control"
                        />
                        <Field
                          name={`repairs.otherCapexItems.${index}.cost`}
                          type="number"
                          placeholder="Cost ($)"
                          className="form-control"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No other capital expenditures added yet.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  const currentItems = props.values.repairs.otherCapexItems || [];
                  props.setFieldValue('repairs.otherCapexItems', [
                    ...currentItems,
                    { done: true, type: '', year: '', cost: '' }
                  ]);
                }}
                className="btn-add capex-add"
              >
                + Add Other Capital Expenditure
              </button>
            </div>
          </div>
        );

      case 4: // Future Repairs
        const futureRepairItems = [
          { key: 'roof', label: 'Roof' },
          { key: 'siding', label: 'Siding' },
          { key: 'windowsanddoors', label: 'Windows and Doors' },
          { key: 'hvac', label: 'HVAC' },
          { key: 'signage', label: 'Signage' },
          { key: 'walkways', label: 'Walkways' },
          { key: 'parkinglot', label: 'Parking Lot' },
          { key: 'landscaping', label: 'Landscaping' },
          { key: 'foundation', label: 'Foundation' },
          // Removed othercapex from here as it will be handled separately
        ];

        return (
          <div className="form-step">
            <h2>Now lets talk about future repairs</h2>
            <p>Out of all those items we just went through, what repairs should be planned for in the next 5 years. I’ll go through them 1 by 1. </p>
            <div className="form-group repairs-grid">
              {futureRepairItems.map(({ key, label }) => {
                // Ensure the future repair object exists for this key
                if (!props.values.futureRepairs[key]) {
                  props.setFieldValue(`futureRepairs.${key}`, { needed: false, yearsUntilNeeded: '' });
                }
                return (
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
                );
              })}
            </div>

            {/* Other Capex section with ability to add multiple items */}
            <div className="form-group other-capex-section">
              <h3>Other Future Capital Expenditures</h3>
              {props.values.futureRepairs.otherCapexItems && props.values.futureRepairs.otherCapexItems.length > 0 ? (
                props.values.futureRepairs.otherCapexItems.map((item, index) => (
                  <div key={index} className="other-capex-item">
                    <div className="other-capex-header">
                      <label>
                        <Field
                          type="checkbox"
                          name={`futureRepairs.otherCapexItems.${index}.needed`}
                          checked={item.needed}
                          onChange={(e) => {
                            const updatedItems = [...props.values.futureRepairs.otherCapexItems];
                            updatedItems[index].needed = e.target.checked;
                            props.setFieldValue('futureRepairs.otherCapexItems', updatedItems);
                          }}
                        />
                        Other Future Capital Expenditure
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedItems = [...props.values.futureRepairs.otherCapexItems];
                          updatedItems.splice(index, 1);
                          props.setFieldValue('futureRepairs.otherCapexItems', updatedItems);
                        }}
                        className="btn-remove capex-remove"
                      >
                        ✕
                      </button>
                    </div>
                    {item.needed && (
                      <div className="other-capex-details">
                        <Field
                          name={`futureRepairs.otherCapexItems.${index}.type`}
                          placeholder="Type of Capital Expenditure"
                          className="form-control"
                        />
                        <Field
                          name={`futureRepairs.otherCapexItems.${index}.yearsUntilNeeded`}
                          type="number"
                          placeholder="Years until needed"
                          className="form-control"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No other future capital expenditures added yet.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  const currentItems = props.values.futureRepairs.otherCapexItems || [];
                  props.setFieldValue('futureRepairs.otherCapexItems', [
                    ...currentItems,
                    { needed: true, type: '', yearsUntilNeeded: '' }
                  ]);
                }}
                className="btn-add capex-add"
              >
                + Add Other Future Capital Expenditure
              </button>
            </div>
          </div>
        );

      case 5: // Financial Details
        return (
          <div className="form-step">
            <h2>Let's talk about a few more important details and then we will be done</h2>
            <div className="form-group">
              <label>What is the legal name of the practice?</label>
              <Field name="practiceName" className="form-control" />
              {props.errors.practiceName && props.touched.practiceName && 
                <div className="error">{props.errors.practiceName}</div>}
            </div>

            <div className="form-group">
              <label>How many tenants are there in the building that you own?</label>
              <Field name="numberOfTenants" type="number" className="form-control" />
              {props.errors.numberOfTenants && props.touched.numberOfTenants && 
                <div className="error">{props.errors.numberOfTenants}</div>}
            </div>

            <div className="form-group lease-responsibilities">
              <label className="section-label">Of the following expenses, which ones are you paying for?</label>
              <div className="checkbox-group">
                <label>
                  <Field type="checkbox" name="tenantPaysUtilities" />
                  Utilities
                </label>
                <label>
                  <Field type="checkbox" name="tenantPaysTaxes" />
                  Property taxes
                </label>
                <label>
                  <Field type="checkbox" name="tenantPaysInsurance" />
                  Insurance
                </label>
              </div>
            </div>
          </div>
        );

      case 6: // Document Upload
        return (
          <div className="form-step">
            <h2>Great! Thanks for going through this with me!</h2>
            <p>If you have any of the following documents, we'd love to get them to get you an offer faster. If not, I'll send a follow up email. But that's it! I'll get this over to our team and get back to you soon.</p>
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
            <h2>DSO Contact Information</h2>
            <div className="form-group">
              <label>Which DSO contact should we reach out to about this deal?*</label>
              <Field name="name" className="form-control" placeholder="Name" />
              {props.errors.name && props.touched.name && <div className="error">{props.errors.name}</div>}
            </div>
            <div className="form-group">
              <label>What is the best email to reach you?*</label>
              <Field name="email" type="email" className="form-control" placeholder="Email"/>
              {props.errors.email && props.touched.email && <div className="error">{props.errors.email}</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="sell-office-container">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formikProps) => (
          <Form>
            <div className="form-layout">
              {/* Notes section on the left */}
              <div className="notes-sidebar">
                <div className="notes-header">Notes</div>
                <div className="notes-content">
                  <Field
                    as="textarea"
                    name="notes"
                    placeholder="Add your notes here. These will be saved along with your submission."
                    className="notes-textarea"
                  />
                  <div className="notes-hint">
                    <p>These notes will be submitted along with your form.</p>
                    <p>You can use this space to:</p>
                    <ul>
                      <li>Add additional context</li>
                      <li>Provide special instructions</li>
                      <li>Mention any unique property features</li>
                      <li>Note any concerns or questions</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Main form content */}
              <div className="main-form-content">
                <ProgressBar />
                {renderStep(formikProps)}
                <div className="form-navigation">
                  {step > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setStep(step - 1)}
                      disabled={formikProps.isSubmitting}
                    >
                      Previous
                    </button>
                  )}
                  {step < 7 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setStep(step + 1)}
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
                  {submitStatus && (
                    <div className={`submit-status ${submitStatus.includes('Error') ? 'error' : 'success'}`}>
                      {submitStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

// Add some CSS for the repairs grid layout
const styles = `
.repairs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.repair-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.repair-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.repair-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding-left: 1.5rem;
  max-width: 400px;
}

.repair-details .form-control {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.9rem;
}

/* Other Capex specific styles */
.other-capex-section {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

.other-capex-item {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.other-capex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.other-capex-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding-left: 1.5rem;
}

.capex-add {
  margin-top: 1rem;
}

.capex-remove {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.25rem;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .repair-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .repairs-grid {
    grid-template-columns: 1fr;
  }
  
  .other-capex-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

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

.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
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

.file-name {
  word-break: break-all;
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

.form-hint {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.lease-responsibilities {
  margin-top: 1.5rem;
}

.lease-responsibilities .section-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Common Fees Styles */
.common-fees-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
}

.fee-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.fee-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.fee-hint {
  font-size: 0.875rem;
  color: #666;
  margin-left: 1.5rem;
}

.fee-amount-input {
  margin-top: 0.5rem;
  max-width: 200px;
}

.fees-container {
  margin-top: 1rem;
}

.fee-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.fee-type {
  flex: 2;
}

.fee-amount {
  flex: 1;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .common-fees-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .fee-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }
  
  .fee-type, .fee-amount {
    width: 100%;
  }
}

/* Form layout with notes sidebar */
.form-layout {
  display: flex;
  gap: 2rem;
  position: relative;
}

.notes-sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}

.notes-header {
  font-size: 1.2rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.notes-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1rem;
}

.notes-textarea {
  width: 100%;
  height:800px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.notes-hint {
  font-size: 0.85rem;
  color: #666;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.notes-hint ul {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.notes-hint li {
  margin-bottom: 0.25rem;
}

.main-form-content {
  flex: 1;
  min-width: 0;
}

/* Responsive styles for smaller screens */
@media (max-width: 992px) {
  .form-layout {
    flex-direction: column;
  }
  
  .notes-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 1.5rem;
  }
  
  .notes-textarea {
    height: 150px;
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default SellYourOffice;
