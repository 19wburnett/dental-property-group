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
  isAssumable: Yup.boolean().when('mortgageOwed', {
    is: (value) => value > 0,
    then: () => Yup.boolean().required('Required'),
    otherwise: () => Yup.boolean().notRequired(),
  }),
  askingPrice: Yup.number()
    .min(0, 'Must be 0 or greater')
    .required('Required'),
  leaseDocuments: Yup.array().nullable().default([]),
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
    leaseDocuments: [],
  };

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

  const handleQuickSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    setProcessingStatus('Submitting your property information...');
    
    try {
      const baseSubmission = {
        mortgage_owed: Number(values.mortgageOwed),
        is_assumable: values.isAssumable,
        asking_price: Number(values.askingPrice),
        created_at: new Date().toISOString(),
        status: 'pending_review',
        submission_source: 'quick_form',
        lease_documents_count: values.leaseDocuments?.length || 0,
        lease_documents_names: values.leaseDocuments?.map(f => f.name).join('; ') || '',
      };

      // Insert into Supabase
      const { data: submissionData, error: submissionError } = await supabase
        .from('quick_property_submissions')  // Make sure this matches your table name
        .insert([baseSubmission])
        .select();

      if (submissionError) throw submissionError;

      // Handle file uploads if we have a successful submission
      if (submissionData?.[0]?.id) {
        const submissionId = submissionData[0].id;
        
        // Upload lease documents if any
        if (values.leaseDocuments && values.leaseDocuments.length > 0) {
          setProcessingStatus('Uploading lease documents...');
          
          for (const file of values.leaseDocuments) {
            try {
              const timestamp = new Date().getTime();
              const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const fileName = `lease_${timestamp}_${safeFileName}`;
              const filePath = `${submissionId}/lease/${fileName}`;

              // Upload file to storage bucket
              const { error: uploadError } = await supabase.storage
                .from('property-documents')
                .upload(filePath, file);

              if (uploadError) {
                console.error(`Error uploading file ${file.name}:`, uploadError);
                continue;
              }

              // Create file record in property_files table
              const fileRecord = {
                submission_id: submissionId,
                file_name: file.name,
                file_type: 'lease',
                file_path: filePath,
                file_size: file.size,
                mime_type: file.type,
                display_name: 'Lease Document',
                uploaded_at: new Date().toISOString()
              };

              const { error: fileRecordError } = await supabase
                .from('quick_submission_files')  // Use the new table
                .insert([fileRecord])
                .select();

              if (fileRecordError) {
                console.error(`Error recording file metadata for ${file.name}:`, fileRecordError);
              }
            } catch (fileError) {
              console.error(`Error processing file ${file.name}:`, fileError);
            }
          }
        }

        setProcessingStatus('Submission complete!');
        // Navigate to the contact-us page with the submission ID
        navigate(`/contact/${submissionId}`);
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
                    <label>Amount Owed on Mortgage ($) *</label>
                    <Field
                      name="mortgageOwed"
                      type="number"
                      className="form-control"
                    />
                    {formikProps.errors.mortgageOwed && formikProps.touched.mortgageOwed && 
                      <div className="error">{formikProps.errors.mortgageOwed}</div>}
                  </div>

                  {Number(formikProps.values.mortgageOwed) > 0 && (
                    <div className="form-group">
                      <label>
                        <Field type="checkbox" name="isAssumable" />
                        Is the mortgage assumable? *
                      </label>
                      {formikProps.errors.isAssumable && formikProps.touched.isAssumable && 
                        <div className="error">{formikProps.errors.isAssumable}</div>}
                    </div>
                  )}

                  <div className="form-group">
                    <label>What number would the seller be willing to let the property go for? *</label>
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
                    <label>Current Lease Documents</label>
                    <div className="form-hint">Upload all current leases (including amendments and options)</div>
                    <FileUploadBox
                      fieldName="leaseDocuments"
                      acceptedTypes=".pdf,.doc,.docx"
                      onFileSelect={(files) => formikProps.setFieldValue("leaseDocuments", files)}
                      formik={formikProps}
                    />
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

// Keep only the necessary styles and remove expense-section related styles
const styles = `
// ...existing styles for loading-spinner, spinner, loading-state...

.file-upload-box {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

// ...existing styles for file upload...

.form-hint {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .quick-submit-container {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 1rem;
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default QuickPropertySubmission;
