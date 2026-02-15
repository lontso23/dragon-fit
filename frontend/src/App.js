import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Dumbbell, Activity, Calendar, User, TrendingUp, Plus, 
  Save, LogOut, ChevronRight, X, Trash2, Edit, Download,
  FileSpreadsheet, FileText, Play
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://dragon-fit.vercel.app';

// ==============================
// JWT AUTH HELPER (PWA SAFE)
// ==============================
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
};


// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
  try {
    const response = await apiFetch("/api/auth/me");

    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    }
  } catch (error) {
    console.error("Auth check failed:", error);
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

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const response = await apiFetch("/api/auth/session", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });

          if (response.ok) {
            const data = await response.json();
            login(data.user, data.token);
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Auth callback error:', error);
        }
      }
      navigate('/login', { replace: true });
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="loading-spinner"></div>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, name };

      const response = await apiFetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error de autenticación');
      }

      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="auth-page" data-testid="login-page">
      <img src="/dragon-logo.png" alt="DragonFit" className="auth-logo" />
      <h1 className="auth-title neon-text">DragonFit</h1>
      <p className="auth-subtitle">Tu compañero de entrenamiento</p>

      <div className="auth-form">
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input
                type="text"
                className="input"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                data-testid="register-name-input"
              />
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="email-input"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
            />
          </div>

          {error && (
            <p style={{ color: 'var(--destructive)', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <button 
          className="btn btn-secondary w-full"
          onClick={handleGoogleLogin}
          data-testid="google-login-button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        <p className="auth-switch">
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </a>
        </p>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workoutsRes, statsRes] = await Promise.all([
        apiFetch("/api/workouts", { }),
        apiFetch("/api/stats", { })
      ]);

      if (workoutsRes.ok) setWorkouts(await workoutsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" data-testid="dashboard-page">
      <div className="header">
        <div>
          <p className="text-muted" style={{ fontSize: '14px', marginBottom: '4px' }}>
            Hola, {user?.name?.split(' ')[0] || 'Atleta'}
          </p>
          <h1 className="header-title">Dashboard</h1>
        </div>
        <img src="/dragon-logo.png" alt="DragonFit" className="header-logo" />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_workouts || 0}</div>
          <div className="stat-label">Rutinas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_sessions || 0}</div>
          <div className="stat-label">Sesiones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.sessions_this_week || 0}</div>
          <div className="stat-label">Esta Semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round((stats?.total_volume || 0) / 1000)}k</div>
          <div className="stat-label">Volumen (kg)</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: '20px', color: 'var(--foreground)' }}>Mis Rutinas</h2>
      </div>

      {workouts.length === 0 ? (
        <div className="empty-state">
          <Dumbbell className="empty-icon" />
          <h3 className="empty-title">Sin Rutinas</h3>
          <p className="empty-desc">Crea tu primera rutina de entrenamiento</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            data-testid="create-first-workout-btn"
          >
            <Plus size={20} />
            Crear Rutina
          </button>
        </div>
      ) : (
        workouts.map((workout) => (
          <div 
            key={workout.workout_id}
            className="workout-card"
            onClick={() => navigate(`/workout/${workout.workout_id}`)}
            data-testid={`workout-card-${workout.workout_id}`}
          >
            <div className="workout-card-header">
              <h3 className="workout-card-title">{workout.name}</h3>
              <span className="workout-card-days">{workout.days?.length || 0} días</span>
            </div>
            {workout.description && (
              <p className="workout-card-desc">{workout.description}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--primary)' }}>
              <ChevronRight size={16} />
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Ver detalles</span>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => navigate('/workout/create')}>
        <Plus size={24} />
      </button>

      {showCreateModal && (
        <CreateWorkoutModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Create Workout Modal
const CreateWorkoutModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([{ day_number: 1, name: 'Día 1', exercises: [] }]);
  const [loading, setLoading] = useState(false);

  const addDay = () => {
    setDays([...days, { 
      day_number: days.length + 1, 
      name: `Día ${days.length + 1}`, 
      exercises: [] 
    }]);
  };

  const updateDayName = (index, newName) => {
    const updated = [...days];
    updated[index].name = newName;
    setDays(updated);
  };

  const addExercise = (dayIndex) => {
    const updated = [...days];
    updated[dayIndex].exercises.push({ name: '', sets: '', notes: '' });
    setDays(updated);
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    const updated = [...days];
    updated[dayIndex].exercises[exerciseIndex][field] = value;
    setDays(updated);
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    const updated = [...days];
    updated[dayIndex].exercises.splice(exerciseIndex, 1);
    setDays(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const response = await apiFetch("/api/workouts", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, days })
      });

      if (response.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Error creating workout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="create-workout-modal">
        <div className="modal-header">
          <h2 className="modal-title">Nueva Rutina</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="input-group">
          <label className="input-label">Nombre</label>
          <input
            type="text"
            className="input"
            placeholder="Ej: Rutina Volumen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="workout-name-input"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Descripción</label>
          <input
            type="text"
            className="input"
            placeholder="Descripción opcional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="workout-description-input"
          />
        </div>

        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--foreground)' }}>Días de Entrenamiento</h3>

        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="card mb-4" style={{ background: 'var(--secondary)' }}>
            <input
              type="text"
              className="input mb-2"
              value={day.name}
              onChange={(e) => updateDayName(dayIndex, e.target.value)}
              style={{ fontWeight: '600' }}
              data-testid={`day-name-input-${dayIndex}`}
            />

            {day.exercises.map((exercise, exIndex) => (
              <div key={exIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ejercicio"
                    value={exercise.name}
                    onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                    style={{ marginBottom: '4px' }}
                    data-testid={`exercise-name-${dayIndex}-${exIndex}`}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Series (3x10)"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value)}
                      style={{ flex: 1 }}
                      data-testid={`exercise-sets-${dayIndex}-${exIndex}`}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Notas"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-icon btn-danger"
                  onClick={() => removeExercise(dayIndex, exIndex)}
                  style={{ marginTop: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button 
              className="btn btn-sm btn-outline w-full"
              onClick={() => addExercise(dayIndex)}
              data-testid={`add-exercise-btn-${dayIndex}`}
            >
              <Plus size={16} />
              Añadir Ejercicio
            </button>
          </div>
        ))}

        <button 
          className="btn btn-secondary w-full mb-4"
          onClick={addDay}
          data-testid="add-day-btn"
        >
          <Plus size={16} />
          Añadir Día
        </button>

        <button 
          className="btn btn-primary w-full"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          data-testid="save-workout-btn"
        >
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar Rutina'}
        </button>
      </div>
    </div>
  );
};

// Workout Detail Page
const WorkoutDetailPage = () => {
  const [workout, setWorkout] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { workoutId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      const [workoutRes, sessionsRes] = await Promise.all([
        apiFetch(`/api/workouts/${workoutId}`, { }),
        apiFetch(`/api/sessions?workout_id=${workoutId}`, { })
      ]);

      if (workoutRes.ok) setWorkout(await workoutRes.json());
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
    } catch (error) {
      console.error('Error fetching workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta rutina?')) return;

    try {
      const response = await apiFetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await apiFetch(`/api/export/${format}/${workoutId}`, {
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DragonFit_${workout.name}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3 className="empty-title">Rutina no encontrada</h3>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const currentDay = workout.days?.[activeDay];

  return (
    <div className="page-container animate-fade-in" data-testid="workout-detail-page">
      <div className="header">
        <div>
          <button 
            className="btn btn-sm btn-secondary mb-2"
            onClick={() => navigate('/dashboard')}
          >
            ← Volver
          </button>
          <h1 className="header-title">{workout.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-icon btn-secondary"
            onClick={() => setShowEditModal(true)}
            data-testid="edit-workout-btn"
          >
            <Edit size={18} />
          </button>
          <button 
            className="btn btn-icon btn-danger"
            onClick={handleDelete}
            data-testid="delete-workout-btn"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {workout.description && (
        <p className="text-muted mb-4">{workout.description}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => handleExport('excel')}
          data-testid="export-excel-btn"
        >
          <FileSpreadsheet size={16} />
          Excel
        </button>
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => handleExport('pdf')}
          data-testid="export-pdf-btn"
        >
          <FileText size={16} />
          PDF
        </button>
      </div>

      <div className="day-tabs">
        {workout.days?.map((day, index) => (
          <button
            key={index}
            className={`day-tab ${activeDay === index ? 'active' : ''}`}
            onClick={() => setActiveDay(index)}
            data-testid={`day-tab-${index}`}
          >
            {day.name}
          </button>
        ))}
      </div>

      {currentDay?.exercises?.length > 0 ? (
        currentDay.exercises.map((exercise, index) => (
          <div key={index} className="exercise-item" data-testid={`exercise-item-${index}`}>
            <div className="exercise-header">
              <span className="exercise-name">{exercise.name}</span>
              <span className="exercise-sets">{exercise.sets}</span>
            </div>
            {exercise.notes && (
              <p className="exercise-notes">{exercise.notes}</p>
            )}
          </div>
        ))
      ) : (
        <div className="empty-state">
          <p className="text-muted">No hay ejercicios en este día</p>
        </div>
      )}

      <button className="btn btn-primary w-full mt-4" onClick={() => navigate(`/workout/${workout.workout_id}/log`)}>
        <Play size={18} />
        Registrar Sesión
      </button>

      {sessions.length > 0 && (
        <div className="mt-6">
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--foreground)' }}>
            Sesiones Recientes
          </h3>
          {sessions.slice(0, 5).map((session) => (
            <div key={session.session_id} className="card mb-2" style={{ padding: '12px', cursor: 'pointer' }} onClick={() =>{
                console.log('Clic en sesión:', session.session_id);
                navigate(`/session/${session.session_id}`);
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--foreground)' }}>{session.day_name}</p>
                  <p className="text-muted" style={{ fontSize: '12px' }}>{session.date}</p>
                </div>
                <span style={{ color: 'var(--primary)', fontSize: '12px' }}>
                  {session.exercises?.length || 0} ejercicios
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLogModal && (
        <LogSessionModal
          workout={workout}
          dayIndex={activeDay}
          onClose={() => setShowLogModal(false)}
          onSaved={() => {
            setShowLogModal(false);
            fetchWorkout();
          }}
        />
      )}

      {showEditModal && (
        <EditWorkoutModal
          workout={workout}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            fetchWorkout();
          }}
        />
      )}
    </div>
  );
};

const SessionDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await apiFetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <p>Sesión no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col animate-fade-in bg-gray-900 text-white">
      {/* Contenido principal */}
      <div className="page-container flex-1 py-6">
        <button
          className="btn btn-sm btn-secondary mb-6"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>

        {session.exercises.length === 0 ? (
          <div className="empty-state py-12">
            <h3 className="empty-title text-gray-400 text-lg">No hay ejercicios registrados</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Tarjeta de la sesión */}
            <div className="bg-gray-800 rounded-xl shadow-xl p-6">
              {/* Cabecera de la sesión */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#22c55e]">{session.day_name}</h1>
                <p className="text-sm text-gray-400">{session.date}</p>
                <h2 className="text-xl font-semibold mt-1">{session.workout_name}</h2>
              </div>

              {/* Tabla de ejercicios */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-700 rounded-lg text-left">
                  <thead className="bg-gray-700 text-gray-200 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-2 text-left">Ejercicio</th>
                      <th className="px-4 py-2 text-right">Peso (kg)</th>
                      <th className="px-4 py-2 text-right">Reps</th>
                      <th className="px-4 py-2 text-center">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {session.exercises.map((exercise, index) => (
                      <tr key={index} className="hover:bg-gray-700 transition-colors rounded-md">
                        <td className="px-4 py-2 font-medium">{exercise.exercise_name}</td>
                        <td className="px-4 py-2 text-right text-[#22c55e] font-semibold">{exercise.weight}</td>
                        <td className="px-4 py-2 text-right">{exercise.reps}</td>
                        <td className="px-4 py-2 text-center text-gray-400">{session.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer global de la app */}
      <footer className="mt-auto">
        <AppFooter />
      </footer>
    </div>
  );
};

// Log Session Modal
const LogSessionModal = ({ workout, dayIndex, onClose, onSaved }) => {
  const day = workout.days?.[dayIndex];
  const [exercises, setExercises] = useState(
    day?.exercises?.map((_, i) => ({ exercise_index: i, weight: '', reps: '', notes: '' })) || []
  );
  const [loading, setLoading] = useState(false);

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/sessions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: workout.workout_id,
          day_index: dayIndex,
          exercises
        })
      });

      if (response.ok) {
        onSaved();
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="log-session-modal">
        <div className="modal-header">
          <h2 className="modal-title">{day?.name}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {day?.exercises?.map((exercise, index) => (
          <div key={index} className="card mb-4" style={{ background: 'var(--secondary)' }}>
            <p style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>
              {exercise.name}
            </p>
            <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
              Objetivo: {exercise.sets}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Peso (kg)"
                value={exercises[index]?.weight || ''}
                onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                style={{ flex: 1 }}
                data-testid={`log-weight-${index}`}
              />
              <input
                type="text"
                className="input"
                placeholder="Reps (10,10,8)"
                value={exercises[index]?.reps || ''}
                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                style={{ flex: 1 }}
                data-testid={`log-reps-${index}`}
              />
            </div>
            <input
              type="text"
              className="input mt-2"
              placeholder="Notas"
              value={exercises[index]?.notes || ''}
              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
            />
          </div>
        ))}

        <button 
          className="btn btn-primary w-full"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="save-session-btn"
        >
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar Sesión'}
        </button>
      </div>
    </div>
  );
};

// Edit Workout Modal
const EditWorkoutModal = ({ workout, onClose, onSaved }) => {
  const [name, setName] = useState(workout.name);
  const [description, setDescription] = useState(workout.description || '');
  const [days, setDays] = useState(workout.days || []);
  const [loading, setLoading] = useState(false);

  const addDay = () => {
    setDays([...days, { 
      day_number: days.length + 1, 
      name: `Día ${days.length + 1}`, 
      exercises: [] 
    }]);
  };

  const updateDayName = (index, newName) => {
    const updated = [...days];
    updated[index].name = newName;
    setDays(updated);
  };

  const addExercise = (dayIndex) => {
    const updated = [...days];
    updated[dayIndex].exercises.push({ name: '', sets: '', notes: '' });
    setDays(updated);
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    const updated = [...days];
    updated[dayIndex].exercises[exerciseIndex][field] = value;
    setDays(updated);
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    const updated = [...days];
    updated[dayIndex].exercises.splice(exerciseIndex, 1);
    setDays(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/workouts/${workout.workout_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, days })
      });

      if (response.ok) {
        onSaved();
      }
    } catch (error) {
      console.error('Error updating workout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="edit-workout-modal">
        <div className="modal-header">
          <h2 className="modal-title">Editar Rutina</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="input-group">
          <label className="input-label">Nombre</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="edit-workout-name"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Descripción</label>
          <input
            type="text"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="card mb-4" style={{ background: 'var(--secondary)' }}>
            <input
              type="text"
              className="input mb-2"
              value={day.name}
              onChange={(e) => updateDayName(dayIndex, e.target.value)}
              style={{ fontWeight: '600' }}
            />

            {day.exercises?.map((exercise, exIndex) => (
              <div key={exIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ejercicio"
                    value={exercise.name}
                    onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                    style={{ marginBottom: '4px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Series"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Notas"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-icon btn-danger"
                  onClick={() => removeExercise(dayIndex, exIndex)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button 
              className="btn btn-sm btn-outline w-full"
              onClick={() => addExercise(dayIndex)}
            >
              <Plus size={16} />
              Añadir Ejercicio
            </button>
          </div>
        ))}

        <button className="btn btn-secondary w-full mb-4" onClick={addDay}>
          <Plus size={16} />
          Añadir Día
        </button>

        <button 
          className="btn btn-primary w-full"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="update-workout-btn"
        >
          <Save size={16} />
          {loading ? 'Guardando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
};

// Progress Page
const ProgressPage = () => {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await apiFetch(`/api/progress`, { });
      if (response.ok) {
        setProgress(await response.json());
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const workoutIds = Object.keys(progress);

  return (
    <div className="page-container animate-fade-in" data-testid="progress-page">
      <div className="header">
        <h1 className="header-title">Progreso</h1>
        <TrendingUp size={32} color="var(--primary)" />
      </div>

      {workoutIds.length === 0 ? (
        <div className="empty-state">
          <Activity className="empty-icon" />
          <h3 className="empty-title">Sin datos</h3>
          <p className="empty-desc">Registra sesiones para ver tu progreso</p>
        </div>
      ) : (
        workoutIds.map((workoutId) => {
          const data = progress[workoutId];
          const exerciseIds = Object.keys(data.exercises || {});

          return (
            <div key={workoutId} className="mb-6">
              <h2
                style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--foreground)' }}
              >
                {data.workout_name}
                <span className="text-muted" style={{ fontSize: '14px', marginLeft: '8px' }}>
                  ({data.sessions_count} sesiones)
                </span>
              </h2>

              {exerciseIds.slice(0, 4).map((exIdx) => {
                const exerciseData = data.exercises[exIdx];
                const chartData = exerciseData.map(d => ({
                  date: d.date.split('-').slice(1).join('/'),
                  peso: d.weight
                }));

                // Tomamos el nombre del primer registro del ejercicio (ya que todos los registros son del mismo ejercicio)
                const exerciseName = exerciseData[0]?.exercise_name || `Ejercicio ${parseInt(exIdx) + 1}`;

                return (
                  <div key={exIdx} className="chart-container mb-4">
                    <h3 className="chart-title">{exerciseName}</h3>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          stroke="var(--muted-foreground)" 
                          fontSize={10}
                        />
                        <YAxis 
                          stroke="var(--muted-foreground)" 
                          fontSize={10}
                          width={30}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--card)', 
                            border: '1px solid var(--border)',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="peso" 
                          stroke="var(--primary)" 
                          strokeWidth={2}
                          dot={{ fill: 'var(--primary)', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
};

const CreateWorkoutPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState([{ day_number: 1, name: 'Día 1', exercises: [] }]);
  const [loading, setLoading] = useState(false);

  const addDay = () => setDays([...days, { day_number: days.length + 1, name: `Día ${days.length + 1}`, exercises: [] }]);
  const addExercise = (dayIndex) => { const updated = [...days]; updated[dayIndex].exercises.push({ name: '', sets: '', notes: '' }); setDays(updated); };
  const updateDayName = (index, newName) => { const updated = [...days]; updated[index].name = newName; setDays(updated); };
  const updateExercise = (dayIndex, exIndex, field, value) => { const updated = [...days]; updated[dayIndex].exercises[exIndex][field] = value; setDays(updated); };
  const removeExercise = (dayIndex, exIndex) => { const updated = [...days]; updated[dayIndex].exercises.splice(exIndex, 1); setDays(updated); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const response = await apiFetch("/api/workouts", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, days })
      });
      if (response.ok) navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="header">
        <button className="btn btn-sm btn-secondary mb-2" onClick={() => navigate(-1)}>← Volver</button>
        <h1 className="header-title">Nueva Rutina</h1>
      </div>

      {/* Formulario igual que en la modal */}
      <div className="card">
        <div className="input-group">
          <label className="input-label">Nombre</label>
          <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Descripción</label>
          <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="card mb-4" style={{ background: 'var(--secondary)' }}>
            <input type="text" className="input mb-2" value={day.name} onChange={(e) => updateDayName(dayIndex, e.target.value)} style={{ fontWeight: '600' }} />
            {day.exercises.map((ex, exIndex) => (
              <div key={exIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <input type="text" className="input" placeholder="Ejercicio" value={ex.name} onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)} />
                <input type="text" className="input" placeholder="Series" value={ex.sets} onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value)} />
                <input type="text" className="input" placeholder="Notas" value={ex.notes} onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)} />
                <button className="btn btn-icon btn-danger" onClick={() => removeExercise(dayIndex, exIndex)}>X</button>
              </div>
            ))}
            <button className="btn btn-sm btn-outline w-full" onClick={() => addExercise(dayIndex)}>Añadir Ejercicio</button>
          </div>
        ))}
        <button className="btn btn-secondary w-full mb-4" onClick={addDay}>Añadir Día</button>
        <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Rutina'}</button>
      </div>
    </div>
  );
};

const LogSessionPage = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      const res = await apiFetch(`/api/workouts/${workoutId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkout(data);
        setExercises(data.days[0].exercises.map((_, i) => ({ exercise_index: i, weight: '', reps: '', notes: '' })));
      }
      setLoading(false);
    };
    fetchWorkout();
  }, [workoutId]);

  const updateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSubmit = async () => {
    try {
      await apiFetch("/api/sessions", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_id: workout.workout_id, day_index: dayIndex, exercises })
      });
      navigate(`/workout/${workoutId}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading"><div className="loading-spinner" /></div>;
  if (!workout) return <div className="page-container"><p>Workout no encontrado</p></div>;

  const day = workout.days[dayIndex];

  return (
    <div className="page-container animate-fade-in">
      <div className="header">
        <button className="btn btn-sm btn-secondary mb-2" onClick={() => navigate(-1)}>← Volver</button>
        <h1 className="header-title">{day.name}</h1>
      </div>

      {day.exercises.map((exercise, index) => (
        <div key={index} className="card mb-4" style={{ background: 'var(--secondary)' }}>
          <p style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>{exercise.name}</p>
          <p className="text-muted mb-2" style={{ fontSize: '12px' }}>Objetivo: {exercise.sets}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" className="input" placeholder="Peso (kg)" value={exercises[index].weight} onChange={(e) => updateExercise(index, 'weight', e.target.value)} />
            <input type="text" className="input" placeholder="Reps" value={exercises[index].reps} onChange={(e) => updateExercise(index, 'reps', e.target.value)} />
          </div>
          <input type="text" className="input mt-2" placeholder="Notas" value={exercises[index].notes} onChange={(e) => updateExercise(index, 'notes', e.target.value)} />
        </div>
      ))}

      <button className="btn btn-primary w-full" onClick={handleSubmit}>Guardar Sesión</button>
    </div>
  );
};

// Calendar Page
const CalendarPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await apiFetch("/api/sessions", { });
      if (response.ok) {
        setSessions(await response.json());
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const dates = Object.keys(sessionsByDate).sort().reverse();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" data-testid="calendar-page">
      <div className="header">
        <h1 className="header-title">Historial</h1>
        <Calendar size={32} color="var(--primary)" />
      </div>

      {dates.length === 0 ? (
        <div className="empty-state">
          <Calendar className="empty-icon" />
          <h3 className="empty-title">Sin sesiones</h3>
          <p className="empty-desc">Registra tu primera sesión de entrenamiento</p>
        </div>
      ) : (
        dates.map((date) => (
          <div key={date} className="mb-4">
            <h3 style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {sessionsByDate[date].map((session) => (
              <div key={session.session_id} className="card mb-2" data-testid={`session-${session.session_id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--foreground)' }}>{session.workout_name}</p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>{session.day_name}</p>
                  </div>
                  <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>
                    {session.exercises?.length || 0} ejercicios
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-container animate-fade-in" data-testid="profile-page">
      <div className="header">
        <h1 className="header-title">Perfil</h1>
        <User size={32} color="var(--primary)" />
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
        {user?.picture ? (
          <img 
            src={user.picture} 
            alt={user.name}
            style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}
          />
        ) : (
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--primary-foreground)'
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <h2 style={{ fontSize: '24px', marginBottom: '4px', color: 'var(--foreground)' }}>
          {user?.name || 'Usuario'}
        </h2>
        <p className="text-muted">{user?.email}</p>
      </div>

      <div className="card mt-4">
        <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--foreground)' }}>
          Instalar App
        </h3>
        <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
          Para instalar DragonFit en tu iPhone:
        </p>
        <ol style={{ color: 'var(--muted-foreground)', fontSize: '14px', paddingLeft: '20px', marginTop: '8px' }}>
          <li>Abre Safari en tu iPhone</li>
          <li>Visita esta URL</li>
          <li>Toca el botón de compartir</li>
          <li>Selecciona "Añadir a pantalla de inicio"</li>
        </ol>
      </div>

      <button 
        className="btn btn-danger w-full mt-4"
        onClick={handleLogout}
        data-testid="logout-btn"
      >
        <LogOut size={18} />
        Cerrar Sesión
      </button>
    </div>
  );
};

// Bottom Navigation
const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={`nav-item ${path === '/dashboard' ? 'active' : ''}`} data-testid="nav-dashboard">
        <Dumbbell />
        <span>Rutinas</span>
      </Link>
      <Link to="/progress" className={`nav-item ${path === '/progress' ? 'active' : ''}`} data-testid="nav-progress">
        <TrendingUp />
        <span>Progreso</span>
      </Link>
      <Link to="/calendar" className={`nav-item ${path === '/calendar' ? 'active' : ''}`} data-testid="nav-calendar">
        <Calendar />
        <span>Historial</span>
      </Link>
      <Link to="/profile" className={`nav-item ${path === '/profile' ? 'active' : ''}`} data-testid="nav-profile">
        <User />
        <span>Perfil</span>
      </Link>
    </nav>
  );
};

// useParams hook for workout detail
const useParams = () => {
  const location = useLocation();
  const path = location.pathname;

  // Buscar workoutId
  const workoutMatch = path.match(/\/workout\/([^/]+)/);
  if (workoutMatch) {
    return { workoutId: workoutMatch[1] };
  }

  // Buscar sessionId
  const sessionMatch = path.match(/\/session\/([^/]+)/);
  if (sessionMatch) {
    return { sessionId: sessionMatch[1] };
  }

  // Ninguno encontrado
  return {};
};


// Main App Router
const AppRouter = () => {
  const location = useLocation();

  // Check for session_id in URL hash (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/workout/:id" element={
        <ProtectedRoute>
          <WorkoutDetailPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <ProgressPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/session/:sessionId" element={
        <ProtectedRoute>
          <SessionDetailPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/workout/create" element={
        <ProtectedRoute>
          <CreateWorkoutPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/workout/:workoutId" element={
        <ProtectedRoute>
          <WorkoutDetailPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="/workout/:workoutId/log" element={
        <ProtectedRoute>
          <LogSessionPage />
          <BottomNav />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App
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