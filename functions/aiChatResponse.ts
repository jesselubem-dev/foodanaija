import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { chat_id, customer_message, customer_name, customer_email } = await req.json();

    if (!chat_id || !customer_message || !customer_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if human has taken over
    const messages = await base44.asServiceRole.entities.ChatMessage.filter({ chat_id });
    const humanTakeover = messages.some(m => m.sender_type === 'admin');
    
    if (humanTakeover) {
      return Response.json({ 
        ai_response: null,
        human_takeover: true 
      });
    }

    // Get recent chat history for context
    const recentMessages = messages
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .slice(-10)
      .map(m => `${m.sender_name || m.sender_type}: ${m.message}`)
      .join('\n');

    // Generate AI response
    const prompt = `You are Fooda AI, a friendly and helpful customer support assistant for Fooda Naija - a food delivery platform in Nigeria.

Customer: ${customer_name}
Recent conversation:
${recentMessages}

Provide a helpful, warm, and professional response. Keep it concise (2-3 sentences max). 
You can help with:
- Restaurant recommendations
- Order information and tracking
- Menu questions
- Delivery issues
- General platform questions

If the customer needs urgent help or complex issues (refunds, payment problems), politely let them know a human agent will assist them shortly.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    // Create AI message
    await base44.asServiceRole.entities.ChatMessage.create({
      chat_id,
      customer_email: customer_email,
      customer_name: customer_name,
      sender_type: 'ai',
      sender_name: 'Fooda AI',
      message: aiResponse,
    });

    return Response.json({ 
      success: true,
      ai_response: aiResponse 
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});