import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_WEBHOOK_URL_PROD
      : process.env.REACT_APP_WEBHOOK_URL_TEST;

    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...req.body,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const data = await response.text();
    res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully',
      data 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
