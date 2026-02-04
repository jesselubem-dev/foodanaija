import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { chat_id, customer_message, customer_name, customer_email } = body;

    if (!chat_id || !customer_message || !customer_email) {
      console.error('Missing fields:', { chat_id, customer_message, customer_email });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if human has taken over
    let messages = [];
    try {
      messages = await base44.asServiceRole.entities.ChatMessage.filter({ chat_id });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      messages = [];
    }
    
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
    let restaurants = [];
    let allMenuItems = [];
    
    try {
      restaurants = await base44.asServiceRole.entities.Restaurant.filter({ 
        is_approved: true, 
        is_open: true 
      });

      allMenuItems = await base44.asServiceRole.entities.MenuItem.filter({ 
        is_available: true 
      });
    } catch (error) {
      console.error('Failed to fetch restaurants/items:', error);
      return Response.json({ 
        success: false,
        error: 'Failed to load restaurant data' 
      }, { status: 500 });
    }

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

    // Check if customer wants to place an order
    const orderDetectionPrompt = `Analyze this customer message: "${customer_message}"

Is the customer trying to place a food order? Reply with ONLY "yes" or "no".

Examples:
"I want jollof rice" -> yes
"Order egusi soup" -> yes
"Get me some chicken" -> yes
"What's your location?" -> no
"How much is delivery?" -> no`;

    const orderIntent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: orderDetectionPrompt,
      add_context_from_internet: false,
    });

    const isOrderRequest = orderIntent.toLowerCase().trim() === 'yes';

    if (isOrderRequest) {
      // Extract order details
      const orderExtractionPrompt = `Based on this message: "${customer_message}"
      
And these available restaurants:
${JSON.stringify(restaurantCatalog, null, 2)}

Extract the order details and return a JSON response with this exact structure:
{
  "order_items": [
    {
      "restaurant_name": "exact restaurant name from catalog",
      "item_name": "menu item name",
      "quantity": 1
    }
  ]
}

Rules:
- Match items to actual restaurants and menu items from the catalog
- If restaurant/item not found, return empty order_items array
- Default quantity is 1 if not specified
- Return ONLY the JSON, no other text`;

      const orderData = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: orderExtractionPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            order_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  restaurant_name: { type: "string" },
                  item_name: { type: "string" },
                  quantity: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (orderData.order_items && orderData.order_items.length > 0) {
        // Build the order payload with actual IDs and prices
        const orderPayload = [];
        
        for (const orderItem of orderData.order_items) {
          const restaurant = restaurants.find(r => 
            r.name.toLowerCase() === orderItem.restaurant_name.toLowerCase()
          );
          
          if (restaurant) {
            const menuItem = allMenuItems.find(m => 
              m.restaurant_id === restaurant.id && 
              m.name.toLowerCase().includes(orderItem.item_name.toLowerCase())
            );
            
            if (menuItem) {
              orderPayload.push({
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                item_id: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: orderItem.quantity || 1,
                image_url: menuItem.images?.[0] || ''
              });
            }
          }
        }

        if (orderPayload.length > 0) {
          // Store order data for the chat session
          await base44.asServiceRole.entities.ChatMessage.create({
            chat_id,
            customer_email: customer_email,
            customer_name: customer_name,
            sender_type: 'ai',
            sender_name: 'Fooda',
            message: `ORDER_DATA:${JSON.stringify(orderPayload)}`,
          });

          return Response.json({ 
            success: true,
            ai_response: "Great! I've prepared your order. Please review and confirm below.",
            has_order: true
          });
        }
      }
    }

    // Generate regular AI response
    const prompt = `You are Fooda, a friendly and helpful customer support assistant for Fooda Naija - a food delivery platform in Nigeria.

Customer: ${customer_name}
Recent conversation:
${recentMessages}
Current message: ${customer_message}

AVAILABLE RESTAURANTS: ${restaurants.length} open restaurants
Here are our top restaurants with their specialties:
${restaurantCatalog.slice(0, 5).map(r => 
  `${r.name} (${r.city}) - ${r.cuisine_types?.join(', ') || 'Nigerian cuisine'}\n  Popular items: ${r.menu_items.filter(i => i.is_popular).slice(0, 3).map(i => i.name).join(', ')}`
).join('\n')}

INSTRUCTIONS:
1. Help customers find restaurants and menu items
2. Answer questions about delivery, pricing, and orders
3. Be friendly and concise (2-3 sentences max)
4. Suggest popular menu items when asked
5. If they want to order, ask them to specify what they want

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