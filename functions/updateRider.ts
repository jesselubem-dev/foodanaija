import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verify admin access
    if (user?.role !== 'admin' && user?._app_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { rider_id, full_name, phone, password, status } = await req.json();

    if (!rider_id) {
      return Response.json({ error: 'Rider ID is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (status) updateData.status = status;

    // Hash password if provided
    if (password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      updateData.password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Update rider
    const rider = await base44.asServiceRole.entities.Rider.update(rider_id, updateData);

    return Response.json({ success: true, rider });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});