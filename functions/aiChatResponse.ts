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
Customer Email: ${customer_email}
Recent conversation:
${recentMessages}

AVAILABLE RESTAURANTS AND MENU:
${JSON.stringify(restaurantCatalog, null, 2)}

CRITICAL - ORDER TAKING RULES:
1. When customer wants to order, you MUST collect:
   - Restaurant name(s)
   - Specific menu items with quantities
   - Delivery address (ask: "What's your delivery address?")

2. ONCE YOU HAVE ALL THREE (restaurants, items, address), you MUST respond with EXACTLY:
   "ORDER_READY: [Brief summary of order]"
   
   Example: "ORDER_READY: 2x Jollof Rice and 1x Fried Chicken from Mama's Kitchen to 123 Ikorodu Road, Lagos. Total: ₦3,500. Ready to confirm?"

3. DO NOT ask any more questions after you have restaurant, items, and address - just say ORDER_READY

4. For general questions, provide helpful recommendations about restaurants and menu items.

Keep responses concise (1-2 sentences unless giving recommendations).`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    // Check if AI wants to process an order
    let showPayment = false;
    let orderData = null;
    let displayMessage = aiResponse;

    if (aiResponse.includes('ORDER_READY')) {
      showPayment = true;
      
      // Extract order details from AI response
      const orderPrompt = `Based on this conversation:
${recentMessages}

And this AI response: ${aiResponse}

Extract the order details and return a JSON with this structure:
{
  "delivery_address": "full address",
  "orders": [
    {
      "restaurant_name": "Restaurant Name",
      "restaurant_id": "will be filled",
      "items": [
        {"name": "Item Name", "quantity": 2, "price": 1500}
      ]
    }
  ]
}`;

      const orderDetails = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: orderPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            delivery_address: { type: "string" },
            orders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  restaurant_name: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "number" },
                        price: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Match restaurants and create order data
      const batchOrderId = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      orderData = [];

      for (const order of orderDetails.orders) {
        const restaurant = restaurants.find(r => 
          r.name.toLowerCase().includes(order.restaurant_name.toLowerCase()) ||
          order.restaurant_name.toLowerCase().includes(r.name.toLowerCase())
        );

        if (restaurant) {
          const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const deliveryFee = 500;
          const valueAddedService = 300;
          const total = subtotal + deliveryFee + valueAddedService;

          orderData.push({
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            customer_email: customer_email,
            customer_name: customer_name,
            customer_phone: '',
            delivery_address: orderDetails.delivery_address,
            items: order.items.map(item => ({
              item_id: Math.random().toString(36),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image_url: ''
            })),
            subtotal,
            delivery_fee: deliveryFee,
            total,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'cash',
            batch_order_id: orderDetails.orders.length > 1 ? batchOrderId : null,
            total_restaurants_in_batch: orderDetails.orders.length
          });
        }
      }

      displayMessage = aiResponse.replace('ORDER_READY', '').trim();
      if (!displayMessage) {
        displayMessage = "Great! I've prepared your order. Please confirm the details and payment below to complete your order. 👇";
      }
    }

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
      ai_response: displayMessage,
      show_payment: showPayment,
      order_data: orderData
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});