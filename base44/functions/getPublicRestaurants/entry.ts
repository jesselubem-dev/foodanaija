import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const restaurants = await base44.asServiceRole.entities.Restaurant.filter({ is_approved: true });
  return Response.json(restaurants);
});