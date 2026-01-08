import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Find rider by email using service role
    const riders = await base44.asServiceRole.entities.Rider.filter({ email: email.toLowerCase() });
    
    if (riders.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const rider = riders[0];

    // Check if rider is suspended
    if (rider.status === 'suspended') {
      return Response.json({ error: 'Account suspended. Contact admin.' }, { status: 403 });
    }

    // Hash the provided password to compare
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const providedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (rider.password_hash !== providedHash) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return rider data (excluding password)
    const { password_hash, ...riderData } = rider;
    
    return Response.json({ 
      success: true, 
      rider: riderData 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});