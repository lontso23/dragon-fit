import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link
} from 'react-router-dom';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  Dumbbell,
  Activity,
  Calendar,
  User,
  TrendingUp,
  Plus,
  Save,
  LogOut,
  ChevronRight,
  X,
  Trash2,
  Edit,
  FileSpreadsheet,
  FileText,
  Play
} from 'lucide-react';

import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ======================================================
   🔐 API FETCH (JWT AUTH)
====================================================== */

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
};

/* ======================================================
   AUTH CONTEXT
====================================================== */

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me');

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
      }
    } catch (e) {
      console.error('Auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);

    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ======================================================
   PROTECTED ROUTE
====================================================== */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/* ======================================================
   AUTH CALLBACK
====================================================== */

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const process = async () => {
      const hash = window.location.hash;
      const match = hash.match(/session_id=([^&]+)/);

      if (!match) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await apiFetch('/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({
            session_id: match[1]
          })
        });

        if (res.ok) {
          const data = await res.json();
          login(data.user, data.token);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
      }

      navigate('/login', { replace: true });
    };

    process();
  }, [login, navigate]);

  return (
    <div className="loading">
      <div className="loading-spinner" />
    </div>
  );
};

/* ======================================================
   LOGIN PAGE
====================================================== */

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin
        ? '/api/auth/login'
        : '/api/auth/register';

      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Error');
      }

      login(data.user, data.token);
      navigate('/dashboard', { replace: true });

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirect = window.location.origin + '/dashboard';

    window.location.href =
      `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="auth-page">

      <h1 className="auth-title">DragonFit</h1>

      <div className="auth-form">

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <input
              placeholder="Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button disabled={loading}>
            {loading
              ? 'Cargando...'
              : isLogin
              ? 'Login'
              : 'Registro'}
          </button>

        </form>

        <div className="auth-divider">o</div>

        <button onClick={handleGoogleLogin}>
          Google
        </button>

        <p>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <a href="#" onClick={e => {
            e.preventDefault();
            setIsLogin(!isLogin);
          }}>
            {isLogin ? 'Regístrate' : 'Login'}
          </a>
        </p>

      </div>
    </div>
  );
};

/* ======================================================
   DASHBOARD
====================================================== */

const DashboardPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [w, s] = await Promise.all([
        apiFetch('/api/workouts'),
        apiFetch('/api/stats')
      ]);

      if (w.ok) setWorkouts(await w.json());
      if (s.ok) setStats(await s.json());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page-container">

      <h2>Hola {user?.name}</h2>

      {workouts.map(w => (
        <div
          key={w.workout_id}
          className="workout-card"
          onClick={() => navigate(`/workout/${w.workout_id}`)}
        >
          <h3>{w.name}</h3>
        </div>
      ))}

    </div>
  );
};

/* ======================================================
   HELPERS
====================================================== */

const useParams = () => {
  const location = useLocation();
  const m = location.pathname.match(/\/workout\/([^/]+)/);

  return { workoutId: m ? m[1] : null };
};

/* ======================================================
   ROUTER
====================================================== */

const AppRouter = () => {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
            <BottomNav />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
            <BottomNav />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
};

/* ======================================================
   PROFILE
====================================================== */

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container">

      <h2>{user?.name}</h2>
      <p>{user?.email}</p>

      <button onClick={handleLogout}>
        <LogOut size={18} /> Logout
      </button>

    </div>
  );
};

/* ======================================================
   NAV
====================================================== */

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">

      <Link to="/dashboard"
        className={pathname === '/dashboard' ? 'active' : ''}>
        <Dumbbell />
        Rutinas
      </Link>

      <Link to="/profile"
        className={pathname === '/profile' ? 'active' : ''}>
        <User />
        Perfil
      </Link>

    </nav>
  );
};

/* ======================================================
   MAIN
====================================================== */

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <div className="app-container">
          <AppRouter />
        </div>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;