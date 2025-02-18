import pdf from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with better error handling
let supabase;
try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
} catch (error) {
  console.error('Supabase client initialization error:', error);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ message: 'File URL is required' });
    }

    console.log('Attempting to download file:', fileUrl);

    // Fetch the PDF file
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${fileResponse.statusText}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text from PDF
    const data = await pdf(buffer);
    const pdfText = data.text;
    
    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ message: 'No text content found in PDF' });
    }

    // Improved OpenAI API prompt
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `You are a lease analysis expert. Analyze the lease text and extract:
1. The monthly base rent amount (as a number without currency symbols or commas)
2. The lease type (either 'triple_net' or 'gross_modified')

For lease type:
- If tenant pays property taxes, insurance, and maintenance, it's 'triple_net'
- If landlord pays some or all operating expenses, it's 'gross_modified'
- Look for terms like "NNN", "Triple Net", "Net-Net-Net", or specific mentions of tenant paying operating expenses

Respond in strict JSON format:
{
  "rentAmount": number,
  "leaseType": "triple_net" | "gross_modified"
}

Include only these two fields with the specified types.`
        }, {
          role: "user",
          content: pdfText
        }],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || openaiResponse.statusText}`);
    }

    const completion = await openaiResponse.json();
    const analysis = completion.choices[0].message.content.trim();
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(analysis);
      
      // Validate the response format
      if (typeof jsonResponse.rentAmount !== 'number') {
        throw new Error('Invalid rent amount format');
      }
      if (!['triple_net', 'gross_modified'].includes(jsonResponse.leaseType)) {
        throw new Error('Invalid lease type');
      }

      return res.status(200).json(jsonResponse);
    } catch (e) {
      console.log('JSON parsing failed, attempting fallback parsing');
      
      // Enhanced fallback parsing logic
      const rentMatches = pdfText.match(/(?:monthly|annual|base)\s+rent\s*(?:of|:|\$)?\s*\$?([\d,]+(?:\.\d{2})?)/i);
      let rentAmount = 0;
      
      if (rentMatches) {
        rentAmount = parseFloat(rentMatches[1].replace(/,/g, ''));
        // If it looks like an annual amount, convert to monthly
        if (rentAmount > 100000) {
          rentAmount = rentAmount / 12;
        }
      }

      // Enhanced lease type detection
      const leaseTypeIndicators = {
        triple_net: [
          /triple\s*net/i,
          /\bNNN\b/i,
          /net-net-net/i,
          /tenant\s+shall\s+pay.*(?:taxes|insurance|maintenance)/i,
          /tenant\s+responsible\s+for.*(?:taxes|insurance|maintenance)/i
        ],
        gross_modified: [
          /modified\s*gross/i,
          /gross\s*modified/i,
          /landlord\s+shall\s+pay/i,
          /landlord\s+responsible\s+for/i,
          /full\s*service/i
        ]
      };

      let leaseType = 'gross_modified';
      for (const regex of leaseTypeIndicators.triple_net) {
        if (regex.test(pdfText)) {
          leaseType = 'triple_net';
          break;
        }
      }

      return res.status(200).json({
        rentAmount,
        leaseType
      });
    }
  } catch (error) {
    console.error('Lease analysis error:', error);
    return res.status(500).json({ 
      message: 'Error analyzing lease',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 