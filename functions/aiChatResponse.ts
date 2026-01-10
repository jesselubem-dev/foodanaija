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

    // Fetch all open restaurants with their menu items
    const restaurants = await base44.asServiceRole.entities.Restaurant.filter({ 
      is_approved: true, 
      is_open: true 
    });

    const allMenuItems = await base44.asServiceRole.entities.MenuItem.filter({ 
      is_available: true 
    });

    // Build restaurant catalog with menu items
    const restaurantCatalog = restaurants.map(restaurant => {
      const restaurantItems = allMenuItems.filter(item => item.restaurant_id === restaurant.id);
      return {
        name: restaurant.name,
        city: restaurant.city,
        description: restaurant.description,
        cuisine_types: restaurant.cuisine_types || [],
        delivery_fee: restaurant.delivery_fee,
        delivery_time: restaurant.delivery_time,
        min_order: restaurant.min_order,
        rating: restaurant.rating,
        menu_items: restaurantItems.map(item => ({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category_id,
          is_popular: item.is_popular,
          is_promo: item.is_promo
        }))
      };
    });

    // Generate AI response
    const prompt = `You are Fooda AI, a friendly and helpful customer support assistant for Fooda Naija - a food delivery platform in Nigeria.

Customer: ${customer_name}
Recent conversation:
${recentMessages}

AVAILABLE RESTAURANTS AND MENU:
${JSON.stringify(restaurantCatalog, null, 2)}

You have complete knowledge of all open restaurants, their menus, prices, and details. Use this information to:
- Recommend specific restaurants and dishes based on customer preferences
- Provide accurate pricing and availability information
- Suggest popular items or current promotions
- Answer questions about delivery fees, times, and minimum orders
- Help customers find exactly what they're looking for

Provide helpful, warm, and professional responses. Keep it concise (2-3 sentences max unless giving detailed recommendations).

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