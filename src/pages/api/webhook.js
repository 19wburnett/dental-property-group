export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Log the incoming data
    console.log('Received webhook data:', data);

    // Here you can add your webhook processing logic
    // For example, sending emails, notifications, etc.

    // Send a success response
    res.status(200).json({ message: 'Webhook received successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
}
