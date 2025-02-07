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
  ? process.env.REACT_APP_WEBHOOK_URL_PROD  // Use N8N webhook URL directly
  : process.env.REACT_APP_WEBHOOK_URL_TEST;  // Use test webhook URL directly

// Update validation schema
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
  wouldConsiderFinancing: Yup.boolean(),

  // Personal Info (Required)
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  
  // Personal Info (Optional)
  phone: Yup.string().nullable(),

  // File uploads (Optional)
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
    additionalFees: [], // Change to array for multiple fees
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
    wouldConsiderFinancing: false,

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
      await validationSchema.validate(values, { abortEarly: false });
      
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
        property_type: values.buildingType || 'unknown', // Changed from building_type and added default
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
        would_consider_financing: values.wouldConsiderFinancing,

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

        setSubmitStatus('Success! Your submission has been received.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
      resetForm();
      setStep(1);
    }
  };

  const steps = [
    { number: 1, label: 'Property Details' },
    { number: 2, label: 'Building Info' },
    { number: 3, label: 'Past Repairs' },
    { number: 4, label: 'Future Repairs' },
    { number: 5, label: 'Financial' },
    { number: 6, label: 'Documents' },
    { number: 7, label: 'Personal Info' }
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
    const fileName = formik.values[fieldName]?.name;

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
      const files = e.dataTransfer.files;
      if (files?.length) {
        onFileSelect(files[0]);
      }
    };

    const handleFileSelect = (event) => {
      const file = event.currentTarget.files[0];
      onFileSelect(file);
    };

    return (
      <div
        className={`file-upload-box ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <div className="file-upload-icon">📁</div>
        <div className="file-upload-text">
          Drag and drop a file here, or click to select
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
          { key: 'otherCapex', label: 'Other Capex' }
        ];

        return (
          <div className="form-step">
            <h2>Repairs & Maintenance History</h2>
            <p>What repairs and maintenance has been done in the past?</p>
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
          { key: 'otherCapex', label: 'Other Capex' }
        ];

        return (
          <div className="form-step">
            <h2>Future Repairs</h2>
            <p>What repairs and maintenance are planned for the next 5 years?</p>
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
              <label>
                <Field type="checkbox" name="wouldConsiderFinancing" />
                Would the seller need all the money upfront, or would consider seller financing? (Taking payments over time could help defer or even eliminate capital gains and other taxes, providing continued cash flow and a higher overall net profit.)
              </label>
            </div>
            <div className="form-group">
              <label>Number of Tenants</label>
              <Field name="numberOfTenants" type="number" className="form-control" />
              {props.errors.numberOfTenants && props.touched.numberOfTenants && 
                <div className="error">{props.errors.numberOfTenants}</div>}
            </div>
            <div className="form-group">
              <label>Amount Owed on Mortgage ($)</label>
              <Field name="mortgageOwed" type="number" className="form-control" />
              {props.errors.mortgageOwed && props.touched.mortgageOwed && 
                <div className="error">{props.errors.mortgageOwed}</div>}
            </div>
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
              <label>P&L and Operating Documents (Last 3 Years)</label>
              <FileUploadBox
                fieldName="pnlDocuments"
                acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx"
                onFileSelect={(file) => props.setFieldValue("pnlDocuments", file)}
                formik={props}
              />
            </div>
            <div className="form-group">
              <label>All current leases (inclusive of all options and any amendments)</label>
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

      case 7: // Personal Information
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

/* Mobile responsive styles */
@media (max-width: 768px) {
  .repair-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .repairs-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default SellYourOffice;