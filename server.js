const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// Webhook endpoint
app.post('/api/webhook', async (req, res) => {
  try {
    const data = req.body;
    console.log('Received webhook data:', data);

    // Forward to n8n
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error('N8N_WEBHOOK_URL not found in environment variables');
      return res.status(500).json({ 
        message: 'Webhook configuration error', 
        error: 'N8N webhook URL not configured' 
      });
    }

    console.log('Forwarding to n8n:', n8nUrl);

    try {
      const n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const n8nResult = await n8nResponse.json();
      console.log('n8n response:', n8nResult);

      if (!n8nResponse.ok) {
        throw new Error(`n8n responded with status ${n8nResponse.status}: ${JSON.stringify(n8nResult)}`);
      }

      return res.status(200).json({ 
        message: 'Webhook processed and forwarded to n8n successfully',
        n8nResponse: n8nResult 
      });
    } catch (n8nError) {
      console.error('n8n error:', n8nError);
      return res.status(502).json({ 
        message: 'Error forwarding to n8n', 
        error: n8nError.message 
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      message: 'Webhook processing failed', 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Using n8n webhook URL: ${process.env.N8N_WEBHOOK_URL}`);
});
