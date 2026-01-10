import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all users
        const users = await base44.asServiceRole.entities.User.list();
        
        // Get all approved and open restaurants
        const restaurants = await base44.asServiceRole.entities.Restaurant.filter({ 
            is_approved: true,
            is_open: true 
        });

        if (restaurants.length === 0) {
            return Response.json({ 
                message: 'No open restaurants to promote',
                notifications_sent: 0 
            });
        }

        // Get popular menu items
        const popularItems = await base44.asServiceRole.entities.MenuItem.filter({ 
            is_available: true,
            is_popular: true 
        });

        // Select a random restaurant
        const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
        
        // Get promo items or popular items from random restaurant
        let featuredItems = popularItems.filter(item => 
            item.restaurant_id === randomRestaurant.id
        );
        
        if (featuredItems.length === 0) {
            featuredItems = await base44.asServiceRole.entities.MenuItem.filter({ 
                restaurant_id: randomRestaurant.id,
                is_available: true 
            });
        }

        const itemName = featuredItems.length > 0 ? featuredItems[0].name : 'delicious meals';
        
        // Notification messages variety
        const messages = [
            `🔥 Craving something delicious? Check out ${itemName} at ${randomRestaurant.name}!`,
            `✨ ${randomRestaurant.name} has amazing food waiting for you! Try ${itemName} today.`,
            `🍽️ Hungry? ${randomRestaurant.name} is serving fresh ${itemName} right now!`,
            `💯 Don't miss out! ${itemName} from ${randomRestaurant.name} is calling your name!`,
            `😋 Time for a treat! Order ${itemName} from ${randomRestaurant.name} now!`
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        let notificationCount = 0;

        // Send notification to each user
        for (const user of users) {
            try {
                await base44.asServiceRole.entities.Notification.create({
                    user_email: user.email,
                    title: '🍴 Amazing Food Alert!',
                    message: randomMessage,
                    type: 'order_accepted', // Reusing existing type
                    is_read: false
                });
                notificationCount++;
            } catch (err) {
                console.error(`Failed to send notification to ${user.email}:`, err);
            }
        }

        return Response.json({ 
            success: true,
            message: `Sent ${notificationCount} notifications`,
            restaurant: randomRestaurant.name,
            notifications_sent: notificationCount
        });
    } catch (error) {
        console.error('Error sending promo notifications:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});