import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateAIResponse = async (userInput, documents) => {
  try {
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Log to verify context is being passed
    console.log('Documents context:', documents);

    const context = documents
      .map(doc => `Property: ${doc.address}\nDetails: ${doc.description}`)
      .join('\n\n');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for a dental property group. Use the provided property context to answer questions."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${userInput}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error Details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
};
