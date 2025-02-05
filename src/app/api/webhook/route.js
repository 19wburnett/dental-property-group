import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Log the incoming data
    console.log('Received webhook data:', data);

    // Here you can add your webhook processing logic
    // For example, sending emails, notifications, etc.

    // Send a success response
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error.message }, 
      { status: 500 }
    );
  }
}
