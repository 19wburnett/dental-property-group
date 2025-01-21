import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://wuisbxbfwwpmuamycjpv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aXNieGJmd3dwbXVhbXljanB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTE2MjIsImV4cCI6MjA1MzA2NzYyMn0.kQGdpgPOGM34rkQaRqxPHnRjDu21T_wayz4ixL_414Y'
);

const validationSchema = Yup.object({
  // Step 1 - Personal Info
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string().required('Required'),
  
  // Step 2 - Property Details
  streetAddress: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  zipCode: Yup.string()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid ZIP code')
    .required('Required'),
  propertySize: Yup.number().required('Required'),
  numberOfOperatories: Yup.number().required('Required'),
  
  // Step 3 - Financial Details
  askingPrice: Yup.number().required('Required'),
  annualRevenue: Yup.number().required('Required'),
  propertyType: Yup.string().required('Required'),
});

const SellYourOffice = () => {
  const [step, setStep] = useState(1);
  const [submitStatus, setSubmitStatus] = useState('');

  const initialValues = {
    name: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertySize: '',
    numberOfOperatories: '',
    askingPrice: '',
    annualRevenue: '',
    propertyType: 'owned',
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
      // Transform values to match database column names and types
      const transformedValues = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        street_address: values.streetAddress,
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        property_size: Number(values.propertySize),
        number_of_operatories: Number(values.numberOfOperatories),
        asking_price: Number(values.askingPrice),
        annual_revenue: Number(values.annualRevenue),
        property_type: values.propertyType,
        created_at: new Date().toISOString()
      };

      console.log('Submitting data:', transformedValues);

      const { data, error } = await supabase
        .from('property_submissions')
        .insert([transformedValues])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Submission successful:', data);
      setSubmitStatus('Success! Your submission has been received.');
      resetForm();
      setStep(1);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus(`Error submitting form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = (props) => {
    switch (step) {
      case 1:
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
      case 2:
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
            <div className="form-group">
              <label>Number of Operatories</label>
              <Field name="numberOfOperatories" type="number" className="form-control" />
              {props.errors.numberOfOperatories && props.touched.numberOfOperatories && 
                <div className="error">{props.errors.numberOfOperatories}</div>}
            </div>
          </div>
        );
      case 3:
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
      default:
        return null;
    }
  };

  return (
    <div className="sell-office-container">
      <h1>Sell Your Dental Office</h1>
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
                >
                  Previous
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={formikProps.isSubmitting}
                  className="btn-primary"
                >
                  Submit
                </button>
              )}
            </div>
          </Form>
        )}
      </Formik>
      {submitStatus && <div className="submit-status">{submitStatus}</div>}
    </div>
  );
};

export default SellYourOffice;