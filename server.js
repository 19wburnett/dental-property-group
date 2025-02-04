const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  try {
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_WEBHOOK_URL_PROD
      : process.env.REACT_APP_WEBHOOK_URL_TEST;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
