import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { data, old_data, event } = payload;

        // Only send welcome if restaurant just got approved (was false/null, now true)
        if (!data?.is_approved || old_data?.is_approved === true) {
            return Response.json({ message: 'No action needed' });
        }

        const restaurantName = data.name;
        const ownerName = data.owner_name;
        const ownerEmail = data.owner_email;

        if (!ownerEmail) {
            return Response.json({ error: 'No owner email found' }, { status: 400 });
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: ownerEmail,
            subject: `🎉 Welcome to Fooda Naija, ${restaurantName}!`,
            body: `
Hi ${ownerName},

We're thrilled to let you know that your restaurant, <strong>${restaurantName}</strong>, has been <strong>approved</strong> on Fooda Naija! 🥳

You can now start receiving orders from customers across Nigeria. Here's what to do next:

✅ <strong>Log in</strong> to your dashboard and complete your menu setup<br/>
✅ <strong>Add your menu items</strong> with photos and descriptions<br/>
✅ <strong>Set your opening hours</strong> so customers know when you're available<br/>
✅ <strong>Go live</strong> and start receiving orders!

If you have any questions, our support team is always here to help.

Welcome aboard and best of luck with your restaurant! 🍽️

Warm regards,<br/>
The Fooda Naija Team
            `
        });

        return Response.json({ success: true, message: `Welcome email sent to ${ownerEmail}` });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});