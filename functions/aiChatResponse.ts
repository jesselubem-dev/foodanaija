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

    // Generate AI response with order detection
    const prompt = `You are Fooda, a friendly and helpful customer support assistant for Fooda Naija - a food delivery platform in Nigeria.

Customer: ${customer_name}
Recent conversation:
${recentMessages}
Current message: ${customer_message}

AVAILABLE RESTAURANTS: ${restaurants.length} open restaurants
Sample restaurants: ${restaurants.slice(0, 3).map(r => r.name).join(', ')}

INSTRUCTIONS:
1. Help customers find restaurants and menu items
2. Answer questions about delivery, pricing, and orders
3. Be friendly and concise (1-2 sentences)
4. If asked about specific menu items, recommend popular options
5. For order placement, guide them to use the app's cart feature

Keep responses short and helpful.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    let displayMessage = aiResponse;

    // Create AI message
    await base44.asServiceRole.entities.ChatMessage.create({
      chat_id,
      customer_email: customer_email,
      customer_name: customer_name,
      sender_type: 'ai',
      sender_name: 'Fooda',
      message: displayMessage,
    });

    return Response.json({ 
      success: true,
      ai_response: displayMessage
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});