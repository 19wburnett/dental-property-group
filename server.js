const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios'); // Import axios
const pdf = require('pdf-parse'); // Import pdf-parse
const app = express();
const port = 3002;
require('dotenv').config(); // Load environment variables from .env file

// Enable CORS for all routes
app.use(cors());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to analyze lease
app.post('/api/analyze-lease', upload.single('file'), async (req, res) => {
    const file = req.file;
    const askingPrice = parseFloat(req.body.askingPrice); // Get the asking price from the request body

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the file content
    const filePath = path.join(__dirname, file.path);
    
    // Extract text from PDF
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer).then(async (data) => {
        const fileContent = data.text; // Extracted text from PDF

        console.log('Length of content being sent:', fileContent.length); // Log the length of the content

        // Prepare the request to OpenAI API
        const openaiApiKey = process.env.OPENAI_API_KEY; // This should work if the variable is set correctly
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        try {
            console.log('Using OpenAI API Key:', openaiApiKey); // This should show your API key
            console.log('Request body to OpenAI:', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: `Analyze the following lease document and extract the rent amount and lease type. Please respond with only "Triple Net" or "Gross Modified" for the lease type, and format the response as: "Rent Amount: $X, Lease Type: Y".\n\n${fileContent}`
                    }
                ],
                max_tokens: 300 // Adjust as needed
            });

            const response = await axios.post(apiUrl, {
                model: 'gpt-3.5-turbo', // Use the appropriate model
                messages: [
                    {
                        role: 'user',
                        content: `Analyze the following lease document and extract the rent amount and lease type. Please respond with only "Triple Net" or "Gross Modified" for the lease type, and format the response as: "Rent Amount: $X, Lease Type: Y".\n\n${fileContent}`
                    }
                ],
                max_tokens: 300 // Adjust as needed
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // Log the full response for debugging
            console.log('OpenAI API response:', response.data.choices[0].message.content);

            // Extract the rent amount and lease type from the response
            const analysis = response.data.choices[0].message.content;
            const rentAmount = extractRentAmount(analysis); // Implement this function to parse the response
            const leaseType = extractLeaseType(analysis); // Implement this function to parse the response

            // Calculate the cap rate
            const capRate = calculateCapRate(rentAmount, askingPrice, leaseType); // Calculate cap rate

            // Clean up uploaded file (optional)
            fs.unlinkSync(file.path); // Delete the file after processing

            // Send the response back
            res.json({ rentAmount, leaseType, capRate });
        } catch (error) {
            console.error('Error communicating with OpenAI:', error.response ? error.response.data : error.message);
            res.status(500).json({ error: 'Failed to analyze lease document' });
        }
    }).catch(err => {
        console.error('Error reading PDF file:', err);
        res.status(500).json({ error: 'Failed to read PDF file' });
    });
});

// Function to calculate cap rate
const calculateCapRate = (rentAmount, askingPrice, leaseType) => {
    if (!rentAmount || !askingPrice || askingPrice <= 0) {
        return null; // Return null if rent amount or asking price is invalid
    }
    const annualRent = rentAmount * 12; // Assuming rentAmount is monthly

    // Apply logic for triple net lease
    if (leaseType.toLowerCase() === 'triple net') {
        return ((annualRent * 0.9) / askingPrice) * 100; // Cap rate in percentage
    }

    return (annualRent / askingPrice) * 100; // Cap rate for other lease types
};

// Function to extract rent amount from the analysis response
const extractRentAmount = (analysis) => {
    const match = analysis.match(/Rent Amount:\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null; // Remove commas for parsing
};

// Function to extract lease type from the analysis response
const extractLeaseType = (analysis) => {
    // Check for keywords in the analysis to determine lease type
    if (analysis.toLowerCase().includes('triple net')) {
        return 'Triple Net';
    } else if (analysis.toLowerCase().includes('gross modified')) {
        return 'Gross Modified';
    }
    return 'unknown'; // Default if no match found
};

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 