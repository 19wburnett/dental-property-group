import React, { useState, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);



const validationSchema = Yup.object({
  propertyAddress: Yup.string().required('Required'),
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
});

const QuickPropertySubmission = () => {
  const [submitStatus, setSubmitStatus] = useState('');

  const initialValues = {
    propertyAddress: '',
    leaseDocuments: [],
    otherDocuments: [],
    mortgageOwed: '',
    isAssumable: false,
    anticipatedRepairs: '',
    askingPrice: '',
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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const baseSubmission = {
        property_address: values.propertyAddress,
        mortgage_owed: Number(values.mortgageOwed),
        is_assumable: values.isAssumable,
        anticipated_repairs: values.anticipatedRepairs,
        asking_price: Number(values.askingPrice),
        created_at: new Date().toISOString(),
        status: 'new',
        submission_source: 'quick_form'
      };

      const { data: submissionData, error: submissionError } = await supabase
        .from('property_submissions')
        .insert([baseSubmission])
        .select();

      if (submissionError) throw submissionError;

      if (submissionData?.[0]?.id) {
        const submissionId = submissionData[0].id;
        const fileTypes = [
          { field: 'leaseDocuments', type: 'lease', label: 'Lease Documents' },
          { field: 'otherDocuments', type: 'other', label: 'Other Documents' }
        ];

        for (const { field, type, label } of fileTypes) {
          const files = values[field];
          if (files?.length > 0) {
            for (const file of files) {
              try {
                const timestamp = new Date().getTime();
                const fileName = `${type}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const filePath = `${submissionId}/${type}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                  .from('property-documents')
                  .upload(filePath, file);

                if (!uploadError) {
                  await supabase
                    .from('property_files')
                    .insert([{
                      submission_id: submissionId,
                      file_name: file.name,
                      file_type: type,
                      file_path: filePath,
                      file_size: file.size,
                      mime_type: file.type,
                      display_name: label,
                      status: 'uploaded',
                      uploaded_at: new Date().toISOString()
                    }]);
                }
              } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
              }
            }
          }
        }
      }

      setSubmitStatus('Success! Your submission has been received.');
      resetForm();
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-submit-container">
      <h1>Quick Property Submission</h1>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formikProps) => (
          <Form className="quick-form">
            <div className="form-group">
              <label>Property Address *</label>
              <Field
                name="propertyAddress"
                as="textarea"
                className="form-control"
                placeholder="Enter complete property address"
              />
              {formikProps.errors.propertyAddress && formikProps.touched.propertyAddress && 
                <div className="error">{formikProps.errors.propertyAddress}</div>}
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

export default QuickPropertySubmission;
