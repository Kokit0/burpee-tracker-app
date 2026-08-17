import { useState, useEffect } from 'react';
import './index.css';

const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT44e0CJHeGd_n75F4wPQxt4JqOvyK7cQfMM8ZXK8xv7ldcqQOdCKXA5b7czGA5JDgUbPEt9sCNq6IG/pub?output=csv";
const GOAL = 10000;

const MONTH_NAMES = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

function parseDate(dateStr) {
  const parts = dateStr.trim().replace(/\//g, '-').split('-');
  if (parts.length === 3) {
    const dayNum = parts[0].padStart(2, '0');
    const monthNum = parts[1].padStart(2, '0');
    const yearNum = parts[2];
    const monthName = MONTH_NAMES[monthNum] || `Mes ${monthNum}`;
    return {
      raw: dateStr,
      monthYear: `${monthName} ${yearNum}`,
      sortKey: `${yearNum}${monthNum}${dayNum}`,
      dayOnly: dayNum
    };
  }
  return { raw: dateStr, monthYear: dateStr, sortKey: '0', dayOnly: dateStr };
}

function ProgressChart({ dailyHistory }) {
  if (!dailyHistory || dailyHistory.length === 0) return null;

  // Sort ascending for the chart (oldest to newest)
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

  const width = 1000; // Using a large viewbox for crisp scaling
  const height = 400;
  const paddingX = 40;
  const paddingY = 60;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const dx = innerWidth / Math.max(1, points.length - 1);
  const maxAccumulated = Math.max(GOAL, points[points.length - 1].accumulated);
  const maxY = Math.max(GOAL, maxAccumulated * 1.1); // Add 10% padding above

  const goalY = height - paddingY - (GOAL / maxY) * innerHeight;

  const pathD = points.map((p, i) => {
    const x = paddingX + i * dx;
    const y = height - paddingY - (p.accumulated / maxY) * innerHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="chart-wrapper">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Goal Line */}
        <line x1={paddingX} y1={goalY} x2={width - paddingX} y2={goalY} stroke="var(--text-secondary)" strokeDasharray="8 8" strokeWidth="2" opacity="0.5" />
        <text x={paddingX} y={goalY - 15} fill="var(--text-secondary)" fontSize="20" fontWeight="600" opacity="0.7">META {GOAL.toLocaleString()}</text>

        {/* Progress Line */}
        <path d={pathD} fill="none" stroke="var(--accent-color)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points and Labels */}
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
}

function App() {
  const [allData, setAllData] = useState([]);
  const [activeClass, setActiveClass] = useState('Hyrox'); // 'Hyrox' | 'Funcional'
  const [activeExercise, setActiveExercise] = useState('Burpees'); // 'Burpees' | 'Squats'
  
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'recent'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SPREADSHEET_CSV_URL);
        if (!response.ok) throw new Error('Error al cargar los datos');
        const csvText = await response.text();
        
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        // Expecting: Fecha, Servicio, Burpees, Squats
        const dataRows = lines[0].toLowerCase().includes('fecha') || lines[0].toLowerCase().includes('mes') ? lines.slice(1) : lines;
        
        const parsed = [];
        dataRows.forEach(row => {
          const parts = row.split(',');
          const rawDate = parts[0] ? parts[0].trim() : '';
          const serviceStr = parts[1] ? parts[1].trim() : '';
          const burpeesStr = parts[2] ? parts[2].replace(/"/g, '').replace(/,/g, '').trim() : '0';
          const squatsStr = parts[3] ? parts[3].replace(/"/g, '').replace(/,/g, '').trim() : '0';

          if (rawDate) {
            parsed.push({
              dateObj: parseDate(rawDate),
              servicio: serviceStr.toLowerCase().includes('funcional') ? 'Funcional' : 'Hyrox',
              burpees: parseInt(burpeesStr, 10) || 0,
              squats: parseInt(squatsStr, 10) || 0
            });
          }
        });

        if (parsed.length === 0) throw new Error('La hoja está vacía o el formato no es válido.');
        
        setAllData(parsed);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and Aggregate Data based on current selection
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
  const dailyData = Object.values(rawDaily).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  // Ensure current index is valid
  const safeMonthIndex = Math.min(currentMonthIndex, Math.max(0, monthlyData.length - 1));
  const currentMonthObj = monthlyData[safeMonthIndex] || { monthYear: "---", total: 0, latestSession: null, dailyHistory: [] };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner"></div>
        <p className="label">Cargando NuFitness...</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        <header className="brand-header">
          <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
          </svg>
          <span className="brand-name">NuFitness</span>
        </header>

        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="main-content">
            {/* Top Navigation */}
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
              <h1 className="counter-value">
                {currentMonthObj.total.toLocaleString('en-US')}
                <span className="goal-text"> / {GOAL.toLocaleString('en-US')}</span>
              </h1>
              <h2 className="month-display">{currentMonthObj.monthYear}</h2>
              {currentMonthObj.latestSession && (
                <p className="latest-session-text">
                  Última sesión: {currentMonthObj.latestSession.value} {activeExercise.toLowerCase()} ({currentMonthObj.latestSession.dateStr})
                </p>
              )}
            </div>

            <ProgressChart dailyHistory={currentMonthObj.dailyHistory} />

            <button className="menu-trigger" onClick={() => setIsMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Historial
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet Menu */}
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
          <button className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>Últimas Clases</button>
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
            dailyData.map((item, index) => (
              <li key={index} className="month-item">
                <div className="month-btn" style={{ cursor: 'default' }}>
                  <span>{item.dateStr}</span>
                  <span className="month-btn-value">{item.total.toLocaleString('en-US')}</span>
                </div>
              </li>
            ))
          )}
          {monthlyData.length === 0 && (
            <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px'}}>No hay datos registrados aún.</p>
          )}
        </ul>
      </div>
    </>
  );
}

export default App;
