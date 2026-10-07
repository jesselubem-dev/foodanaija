import { Navigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

// Old profile page — replaced by CustomerSettings (the "Profile" tab).
// Kept as a redirect so any saved links still work.
export default function Profile() {
  return <Navigate to={createPageUrl('CustomerSettings')} replace />;
}
