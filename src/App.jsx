import React, { useState, useEffect } from 'react';

const API_URL = 'https://script.google.com/macros/s/AKfycbwcTYAtC0k8TF8X_pEh2ngu4EdL93-Fk7xAGdS50a_19GmjDQ_wWKIKC7lq0in6gKPT/exec';

function parseDate(dateStr) {
  if (!dateStr) return null;
  let str = dateStr.toString().trim();
  if (str.includes('T')) {
    str = str.split('T')[0];
  }
  const parts = str.split(/[-/]/);
  
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return {
        raw: `${day}-${month}-${year}`,
        sortKey: `${year}${month}${day}`,
        monthYear: getMonthName(month, year),
        dayOnly: day
      };
    } else {
      // DD-MM-YYYY
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return {
        raw: `${day}-${month}-${year}`,
        sortKey: `${year}${month}${day}`,
        monthYear: getMonthName(month, year),
        dayOnly: day
      };
    }
  }
  return { raw: str, sortKey: str, monthYear: str, dayOnly: str };
}

function getMonthName(monthStr, yearStr) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${months[monthIdx]} ${yearStr}`;
  }
  return `${monthStr}-${yearStr}`;
}

const ProgressChart = ({ dailyHistory, currentGoal }) => {
  if (!dailyHistory || dailyHistory.length === 0) return null;
  
  const sortedHistory = [...dailyHistory].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  
  let runningTotal = 0;
  const points = sortedHistory.map(day => {
    runningTotal += day.total;
    return {
      dateStr: day.dateStr,
      dayOnly: day.dayOnly,
      dailyValue: day.total,
      accumulated: runningTotal
    };
  });

  const width = 1000; 
  const height = 400;
  const paddingX = 40;
  const paddingY = 60;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const dx = innerWidth / Math.max(1, points.length - 1);
  const maxAccumulated = Math.max(currentGoal, points[points.length - 1].accumulated);
  const maxY = Math.max(currentGoal, maxAccumulated * 1.1); 

  const goalY = height - paddingY - (currentGoal / maxY) * innerHeight;

  const pathD = points.map((p, i) => {
    const x = paddingX + i * dx;
    const y = height - paddingY - (p.accumulated / maxY) * innerHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="chart-wrapper">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <line x1={paddingX} y1={goalY} x2={width - paddingX} y2={goalY} stroke="var(--text-secondary)" strokeDasharray="8 8" strokeWidth="2" opacity="0.5" />
        <text x={paddingX} y={goalY - 15} fill="var(--text-secondary)" fontSize="20" fontWeight="600" opacity="0.7">META {currentGoal.toLocaleString()}</text>
        <path d={pathD} fill="none" stroke="var(--accent-color)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        
        {points.map((p, i) => {
          const x = paddingX + i * dx;
          const y = height - paddingY - (p.accumulated / maxY) * innerHeight;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill="var(--bg-color)" stroke="var(--accent-color)" strokeWidth="4" />
              <text x={x} y={y - 25} fill="var(--text-primary)" fontSize="20" textAnchor="middle" fontWeight="bold">+{p.dailyValue}</text>
              <text x={x} y={height - 20} fill="var(--text-secondary)" fontSize="18" textAnchor="middle">{p.dayOnly}</text>
            </g>
          )
        })}
      </svg>
    </div>
  );
};

function App() {
  const [allData, setAllData] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [goals, setGoals] = useState({
    'Hyrox': { 'Burpees': 10000, 'Squats': 10000 },
    'Funcional': { 'Burpees': 10000, 'Squats': 10000 }
  });

  const [activeClass, setActiveClass] = useState('Hyrox'); 
  const [activeExercise, setActiveExercise] = useState('Burpees'); 
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly'); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth & Modals
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('nufitness_user') || null);
  const [usersList, setUsersList] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchAppData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?action=getData`);
      if (!res.ok) throw new Error('Error al cargar la base de datos');
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      
      const goalsData = json.data.metas;
      const parsedGoals = {
        'Hyrox': { 'Burpees': 10000, 'Squats': 10000 },
        'Funcional': { 'Burpees': 10000, 'Squats': 10000 }
      };
      
      if (goalsData && goalsData.length > 1) {
        goalsData.slice(1).forEach(row => {
           if(row.length >= 3) {
             const clase = row[0].toString().toLowerCase().includes('funcional') ? 'Funcional' : 'Hyrox';
             const ej = row[1].toString().toLowerCase().includes('squats') ? 'Squats' : 'Burpees';
             const meta = parseInt(row[2].toString().replace(/"/g, '').replace(/,/g, ''), 10) || 10000;
             parsedGoals[clase][ej] = meta;
           }
        });
      }
      setGoals(parsedGoals);

      const datosData = json.data.datos;
      if (!datosData || datosData.length < 2) throw new Error('La hoja estÃ¡ vacÃ­a o cargando.');

      const headers = datosData[0].map(h => h.toString().toLowerCase());
      const dateIdx = headers.findIndex(h => h.includes('fecha') || h.includes('mes'));
      const serviceIdx = headers.findIndex(h => h.includes('servicio') || h.includes('clase'));
      const burpeesIdx = headers.findIndex(h => h.includes('burpees'));
      const squatsIdx = headers.findIndex(h => h.includes('squats'));
      const userIdx = headers.findIndex(h => h.includes('usuario'));
      
      const parsed = [];
      datosData.slice(1).forEach(row => {
        const rawDate = dateIdx >= 0 && row[dateIdx] ? row[dateIdx].toString().trim() : '';
        const serviceStr = serviceIdx >= 0 && row[serviceIdx] ? row[serviceIdx].toString().trim() : '';
        const burpeesStr = burpeesIdx >= 0 && row[burpeesIdx] ? row[burpeesIdx].toString().replace(/"/g, '').replace(/,/g, '').trim() : '0';
        const squatsStr = squatsIdx >= 0 && row[squatsIdx] ? row[squatsIdx].toString().replace(/"/g, '').replace(/,/g, '').trim() : '0';
        const userStr = userIdx >= 0 && row[userIdx] ? row[userIdx].toString().trim() : '';

        if (rawDate) {
          parsed.push({
            dateObj: parseDate(rawDate),
            servicio: serviceStr.toLowerCase().includes('funcional') ? 'Funcional' : 'Hyrox',
            burpees: parseInt(burpeesStr, 10) || 0,
            squats: parseInt(squatsStr, 10) || 0,
            usuario: userStr
          });
        }
      });

      if (parsed.length === 0) throw new Error('No se encontraron datos histÃ³ricos vÃ¡lidos.');
      
      setAllData(parsed);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const r = await fetch(`${API_URL}?action=getUsers`);
      const j = await r.json();
      if(j.status === 'success') setUsersList(j.data);
    } catch(e) { console.error("Error fetching users"); }
  };

  useEffect(() => {
    fetchAppData();
    fetchUsersList();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nufitness_user');
    setCurrentUser(null);
  };

  // Filter Data
  const filteredData = allData.filter(d => d.servicio === activeClass);
  const rawDaily = {};
  filteredData.forEach(d => {
    const exValue = activeExercise === 'Burpees' ? d.burpees : d.squats;
    if (exValue === 0) return;
    
    if (!rawDaily[d.dateObj.raw]) {
      rawDaily[d.dateObj.raw] = { 
        dateStr: d.dateObj.raw, 
        sortKey: d.dateObj.sortKey, 
        monthYear: d.dateObj.monthYear, 
        dayOnly: d.dateObj.dayOnly,
        total: 0 
      };
    }
    rawDaily[d.dateObj.raw].total += exValue;
  });

  const rawMonthly = {};
  Object.values(rawDaily).forEach(daily => {
    if (!rawMonthly[daily.monthYear]) {
      rawMonthly[daily.monthYear] = { 
        monthYear: daily.monthYear, 
        sortKey: daily.sortKey.substring(0, 6), 
        total: 0, 
        latestSession: null,
        dailyHistory: []
      };
    }
    rawMonthly[daily.monthYear].total += daily.total;
    rawMonthly[daily.monthYear].dailyHistory.push(daily);
    
    const currentLatest = rawMonthly[daily.monthYear].latestSession;
    if (!currentLatest || daily.sortKey > currentLatest.sortKey) {
      rawMonthly[daily.monthYear].latestSession = { dateStr: daily.dateStr, value: daily.total, sortKey: daily.sortKey };
    }
  });

  const monthlyData = Object.values(rawMonthly).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  
  // Individual entries for 'recent' tab
  const recentEntries = [...filteredData]
    .filter(d => (activeExercise === 'Burpees' ? d.burpees : d.squats) > 0)
    .sort((a, b) => {
       // Primary sort by date desc
       const dateDiff = b.dateObj.sortKey.localeCompare(a.dateObj.sortKey);
       if(dateDiff !== 0) return dateDiff;
       // If same date, sort by value to group logically
       const valA = activeExercise === 'Burpees' ? a.burpees : a.squats;
       const valB = activeExercise === 'Burpees' ? b.burpees : b.squats;
       return valB - valA;
    });

  const safeMonthIndex = Math.min(currentMonthIndex, Math.max(0, monthlyData.length - 1));
  const currentMonthObj = monthlyData[safeMonthIndex] || { monthYear: "---", total: 0, latestSession: null, dailyHistory: [] };
  const currentGoal = goals[activeClass][activeExercise];

  if (loading && allData.length === 0) {
    return (
      <div className="app-container">
        <div className="loading-spinner"></div>
        <p className="label">Conectando con Servidor...</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <header className="brand-header" style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
            </svg>
            <span className="brand-name">NuFitness</span>
          </div>
          {currentUser && (
            <button 
              onClick={() => setShowStats(true)}
              style={{ position: 'absolute', right: '0', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
              title="Mis EstadÃ­sticas"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          )}
        </header>

        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="main-content">
            <div className="nav-level-1">
              <button className={`nav-btn ${activeClass === 'Hyrox' ? 'active' : ''}`} onClick={() => {setActiveClass('Hyrox'); setCurrentMonthIndex(0);}}>HYROX</button>
              <button className={`nav-btn ${activeClass === 'Funcional' ? 'active' : ''}`} onClick={() => {setActiveClass('Funcional'); setCurrentMonthIndex(0);}}>FUNCIONAL</button>
            </div>
            
            <div className="nav-level-2">
              <button className={`nav-btn-sm ${activeExercise === 'Burpees' ? 'active' : ''}`} onClick={() => {setActiveExercise('Burpees'); setCurrentMonthIndex(0);}}>Burpees</button>
              <button className={`nav-btn-sm ${activeExercise === 'Squats' ? 'active' : ''}`} onClick={() => {setActiveExercise('Squats'); setCurrentMonthIndex(0);}}>Squats</button>
            </div>

            <div className="counter-wrapper">
              <p className="label">Total del Grupo</p>
              <div className="counter-value">
                <div>{currentMonthObj.total.toLocaleString('en-US')}</div>
                <div className="goal-text">/ {currentGoal.toLocaleString('en-US')}</div>
              </div>
              <h2 className="month-display">{currentMonthObj.monthYear}</h2>
              {currentMonthObj.latestSession && (
                <p className="latest-session-text">
                  Ãšltima sesiÃ³n: {currentMonthObj.latestSession.value} {activeExercise.toLowerCase()} ({currentMonthObj.latestSession.dateStr})
                </p>
              )}
            </div>

            <ProgressChart dailyHistory={currentMonthObj.dailyHistory} currentGoal={currentGoal} />

            <div className="action-buttons" style={{display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px'}}>
              <button className="menu-trigger" onClick={() => setIsMenuOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Historial
              </button>
              
              {currentUser ? (
                <>
                  <button className="menu-trigger" style={{color: 'var(--accent-color)', borderColor: 'var(--accent-color)'}} onClick={() => {if(window.confirm('Â¿Cerrar sesiÃ³n?')) handleLogout()}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {currentUser}
                  </button>
                  <button className="menu-trigger primary-action" style={{backgroundColor: 'var(--accent-color)', color: 'var(--bg-color)'}} onClick={() => setShowAdd(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Aportar
                  </button>
                </>
              ) : (
                <button className="menu-trigger primary-action" style={{backgroundColor: 'var(--accent-color)', color: 'var(--bg-color)'}} onClick={() => setShowLogin(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Entrar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Historial Menu */}
      <div className={`overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`bottom-sheet ${isMenuOpen ? 'open' : ''}`}>
        <div className="sheet-header" style={{ marginBottom: '16px' }}>
          <h3 className="sheet-title">Historial ({activeClass} - {activeExercise})</h3>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>Resumen Mensual</button>
          <button className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>Ãšltimos Registros</button>
        </div>
        
        <ul className="month-list">
          {activeTab === 'monthly' ? (
            monthlyData.map((item, index) => (
              <li key={index} className="month-item">
                <button 
                  className={`month-btn ${safeMonthIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentMonthIndex(index);
                    setIsMenuOpen(false);
                  }}
                >
                  <span>{item.monthYear}</span>
                  <span className="month-btn-value">{item.total.toLocaleString('en-US')}</span>
                </button>
              </li>
            ))
          ) : (
            recentEntries.map((item, index) => {
              const val = activeExercise === 'Burpees' ? item.burpees : item.squats;
              const isPersonal = item.usuario && item.usuario.toLowerCase() !== 'admin';
              return (
                <li key={index} className="month-item">
                  <div className="month-btn" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>{item.dateObj.raw}</span>
                      <span className="month-btn-value">{val.toLocaleString('en-US')}</span>
                    </div>
                    {isPersonal && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginTop: '4px', fontWeight: 'bold' }}>
                        ðŸ‘¤ Aporte de: {item.usuario}
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal 
          usersList={usersList} 
          onClose={() => setShowLogin(false)} 
          onLogin={(user) => {
            setCurrentUser(user);
            setShowLogin(false);
          }} 
        />
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <AddModal 
          currentUser={currentUser}
          activeClass={activeClass}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            fetchAppData();
          }}
        />
      )}
      {/* Stats Modal */}
      {showStats && (
        <StatsModal 
          currentUser={currentUser}
          allData={allData}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );
}

function LoginModal({ usersList, onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!username || !password) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username, password })
      });
      const json = await res.json();
      if (json.status === 'success') {
        localStorage.setItem('nufitness_user', json.data.username);
        onLogin(json.data.username);
      } else {
        setError(json.message);
      }
    } catch(err) {
      setError('Error de conexiÃ³n');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>AutenticaciÃ³n</h2>
        <p className="modal-desc" style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>
          Ingresa para sumar al rÃ©cord grupal. Si tu nombre no existe, se crearÃ¡ automÃ¡ticamente con tu contraseÃ±a.
        </p>
        <form onSubmit={handleSubmit} className="modal-form" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <input 
            list="users-list" 
            value={username} 
            onChange={e=>setUsername(e.target.value)} 
            placeholder="Tu Nombre o Alias (ej. Carlos M.)" 
            className="modal-input"
            required
          />
          <datalist id="users-list">
             {usersList.map(u => <option key={u} value={u} />)}
          </datalist>
          
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            placeholder="ContraseÃ±a" 
            className="modal-input"
            required
          />
          {error && <div className="modal-error" style={{color: '#ff4d4d', fontWeight: 'bold'}}>{error}</div>}
          
          <div className="modal-actions" style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
            <button type="button" onClick={onClose} className="menu-trigger" style={{flex: 1}}>Cancelar</button>
            <button type="submit" disabled={loading} className="menu-trigger primary-action" style={{flex: 1, backgroundColor: 'var(--accent-color)', color: 'var(--bg-color)'}}>
              {loading ? 'Entrando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddModal({ currentUser, activeClass, onClose, onAdded }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [service, setService] = useState(activeClass);
  const [burpees, setBurpees] = useState('');
  const [squats, setSquats] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}-${m}-${y}`;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'addEntry', 
          username: currentUser, 
          date: formattedDate, 
          service, 
          burpees: burpees || 0, 
          squats: squats || 0 
        })
      });
      const json = await res.json();
      if(json.status === 'success') {
        onAdded();
      } else {
        alert(json.message);
      }
    } catch(err) {
      alert('Error de conexiÃ³n');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Registrar Aporte</h2>
        <p className="modal-desc" style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>Agrega tus nÃºmeros para empujar la meta grupal. Â¡Todo suma!</p>
        <form onSubmit={handleSubmit} className="modal-form" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div>
            <label className="modal-label" style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 'bold'}}>Fecha</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="modal-input" required />
          </div>
          
          <div>
            <label className="modal-label" style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 'bold'}}>Clase / Servicio</label>
            <select value={service} onChange={e=>setService(e.target.value)} className="modal-input" required>
              <option value="Hyrox">Hyrox</option>
              <option value="Funcional">Funcional</option>
            </select>
          </div>
          
          <div style={{display:'flex', gap:'12px'}}>
            <div style={{flex:1}}>
              <label className="modal-label" style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 'bold'}}>Burpees</label>
              <input type="number" min="0" value={burpees} onChange={e=>setBurpees(e.target.value)} className="modal-input" placeholder="0" />
            </div>
            <div style={{flex:1}}>
              <label className="modal-label" style={{display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 'bold'}}>Squats</label>
              <input type="number" min="0" value={squats} onChange={e=>setSquats(e.target.value)} className="modal-input" placeholder="0" />
            </div>
          </div>

          <div className="modal-actions" style={{display: 'flex', gap: '12px', marginTop: '8px'}}>
            <button type="button" onClick={onClose} className="menu-trigger" style={{flex: 1}}>Cancelar</button>
            <button type="submit" disabled={loading} className="menu-trigger primary-action" style={{flex: 1, backgroundColor: 'var(--accent-color)', color: 'var(--bg-color)'}}>
              {loading ? 'Guardando...' : 'Sumar al Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatsModal({ currentUser, allData, onClose }) {
  const [activeTab, setActiveTab] = useState('Burpees');
  
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYear = now.getFullYear().toString();

  let totalMonth = 0;
  let totalYear = 0;
  let totalAllTime = 0;

  allData.forEach(d => {
    if (!d.usuario || d.usuario.toLowerCase() !== currentUser.toLowerCase()) return;
    
    const val = activeTab === 'Burpees' ? d.burpees : d.squats;
    if (val === 0) return;

    totalAllTime += val;
    
    if (d.dateObj && d.dateObj.sortKey) {
      const yearStr = d.dateObj.sortKey.substring(0, 4);
      const monthKey = d.dateObj.sortKey.substring(0, 6);

      if (yearStr === currentYear) {
        totalYear += val;
      }
      if (monthKey === currentMonthKey) {
        totalMonth += val;
      }
    }
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '400px', padding: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <h2 style={{margin: 0, fontSize: '1.5rem'}}>Mis Estadísticas</h2>
          <button onClick={onClose} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="tabs-container" style={{marginBottom: '32px'}}>
          <button className={`tab-btn ${activeTab === 'Burpees' ? 'active' : ''}`} onClick={() => setActiveTab('Burpees')}>Burpees</button>
          <button className={`tab-btn ${activeTab === 'Squats' ? 'active' : ''}`} onClick={() => setActiveTab('Squats')}>Squats</button>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'}}>
          <div style={{textAlign: 'center'}}>
            <p className="label" style={{marginBottom: '8px'}}>{activeTab} este mes</p>
            <div style={{fontSize: '4.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: '1'}}>{totalMonth.toLocaleString('en-US')}</div>
          </div>
          
          <div style={{display: 'flex', width: '100%', gap: '16px', marginTop: '16px'}}>
            <div style={{flex: 1, backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)'}}>
              <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600'}}>{activeTab} este año</p>
              <div style={{fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-color)'}}>{totalYear.toLocaleString('en-US')}</div>
            </div>
            
            <div style={{flex: 1, backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)'}}>
              <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600'}}>Total Histórico</p>
              <div style={{fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-color)'}}>{totalAllTime.toLocaleString('en-US')}</div>
            </div>
          </div>
        </div>
        
        <div style={{textAlign: 'center', marginTop: '32px'}}>
          <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            💪 ¡Sigue sumando, {currentUser}!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

