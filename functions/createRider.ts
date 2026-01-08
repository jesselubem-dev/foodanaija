import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Verify admin access
    if (user?.role !== 'admin' && user?._app_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { full_name, phone, email, password, status } = await req.json();

    // Validate required fields
    if (!full_name || !phone || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists
    const existingRiders = await base44.asServiceRole.entities.Rider.filter({ email });
    if (existingRiders.length > 0) {
      return Response.json({ error: 'A rider with this email already exists' }, { status: 400 });
    }

    // Hash password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create rider
    const rider = await base44.asServiceRole.entities.Rider.create({
      full_name,
      phone,
      email,
      password_hash,
      status: status || 'active',
      total_deliveries: 0,
      is_online: false
    });

    return Response.json({ success: true, rider });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});