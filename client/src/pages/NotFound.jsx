import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? (user.role === 'doctor' ? '/doctor' : '/patient') : '/';

  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="font-display text-7xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-ink-soft">The page you're looking for doesn't exist or has moved.</p>
        <Link to={home} className="btn-primary mt-6">Back to safety</Link>
      </div>
    </div>
  );
}
