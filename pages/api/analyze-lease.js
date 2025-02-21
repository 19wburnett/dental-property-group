import { formidable } from 'formidable';
import { promises as fs } from 'fs';
import pdf from 'pdf-parse';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize OpenAI client with debug logging
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is not set');
}

async function extractTextFromPDF(filePath) {
  try {
    // Read the file as a buffer
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function analyzePDFWithGPT(text) {
  try {
    if (!text) {
      throw new Error('No text provided for analysis');
    }

    console.log('Text length for GPT analysis:', text.length);

    const prompt = `You are a JSON generator that analyzes lease documents. Extract the following information and respond ONLY with a JSON object containing these fields:
- rentAmount (number): the monthly rent amount
- leaseType (string): either "Triple Net", "Modified Gross", or "Gross"

Respond with ONLY the JSON object, no other text.

Lease text to analyze:
${text.substring(0, 8000)}`;

    console.log('Sending request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ 
        role: "user", 
        content: prompt 
      }],
      temperature: 0
    });

    const content = response.choices[0].message.content.trim();
    console.log('Raw GPT response:', content);

    // Parse the response, ensuring it's valid JSON
    const analysis = JSON.parse(content);
    
    // Validate the required fields
    if (typeof analysis.rentAmount !== 'number' || typeof analysis.leaseType !== 'string') {
      throw new Error('Invalid response format from GPT');
    }

    console.log('Parsed analysis:', analysis);
    return analysis;
  } catch (error) {
    console.error('GPT analysis error details:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Failed to analyze lease with GPT: ${error.message}`);
  }
}

export default async function handler(req, res) {
  console.log('API route called');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      multiples: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    const fileField = files.file;
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', uploadedFile.originalFilename);

    // Extract text from PDF with debug logging
    console.log('Starting PDF text extraction...');
    const text = await extractTextFromPDF(uploadedFile.filepath);
    console.log('PDF text extracted, length:', text?.length || 0);

    if (!text || text.length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    // Analyze with GPT
    console.log('Starting GPT analysis...');
    const analysis = await analyzePDFWithGPT(text);
    console.log('GPT analysis completed:', analysis);

    // Combine with additional data
    const result = {
      ...analysis,
      termLength: '10 years',
      tenant: 'Sample Dental Practice',
      startDate: '2023-01-01',
      endDate: '2033-01-01'
    };

    // Clean up the uploaded file
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (error) {
      console.error('Cleanup error:', error);
      // Continue execution even if cleanup fails
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('API Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
}