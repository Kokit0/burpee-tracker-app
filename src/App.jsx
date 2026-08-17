import { useState, useEffect } from 'react';
import './index.css';

const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT44e0CJHeGd_n75F4wPQxt4JqOvyK7cQfMM8ZXK8xv7ldcqQOdCKXA5b7czGA5JDgUbPEt9sCNq6IG/pub?output=csv";

const MONTH_NAMES = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

function parseDate(dateStr) {
  // Expecting DD-MM-YYYY
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const monthNum = parts[1];
    const yearNum = parts[2];
    const monthName = MONTH_NAMES[monthNum] || `Mes ${monthNum}`;
    return {
      raw: dateStr,
      monthYear: `${monthName} ${yearNum}`,
      // For sorting: YYYYMMDD
      sortKey: `${yearNum}${monthNum}${parts[0].padStart(2, '0')}`
    };
  }
  return { raw: dateStr, monthYear: dateStr, sortKey: '0' };
}

function App() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' or 'recent'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SPREADSHEET_CSV_URL);
        if (!response.ok) throw new Error('Error al cargar los datos');
        const csvText = await response.text();
        
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        // Skip header
        const dataRows = lines[0].toLowerCase().includes('mes') || lines[0].toLowerCase().includes('fecha') ? lines.slice(1) : lines;
        
        const rawDaily = {};
        const rawMonthly = {};

        dataRows.forEach(row => {
          const parts = row.split(',');
          const rawDate = parts[0].trim();
          
          const burpeesStr = parts.slice(1).join(',').replace(/"/g, '').replace(/,/g, '').trim();
          const burpeesNumber = parseInt(burpeesStr, 10);

          if (rawDate && !isNaN(burpeesNumber)) {
            const parsed = parseDate(rawDate);
            
            // 1. Agrupar por Día (Suma de múltiples clases en el mismo día)
            if (!rawDaily[parsed.raw]) {
              rawDaily[parsed.raw] = { dateStr: parsed.raw, sortKey: parsed.sortKey, monthYear: parsed.monthYear, total: 0 };
            }
            rawDaily[parsed.raw].total += burpeesNumber;

            // 2. Agrupar por Mes
            if (!rawMonthly[parsed.monthYear]) {
              rawMonthly[parsed.monthYear] = { monthYear: parsed.monthYear, sortKey: parsed.sortKey.substring(0, 6), total: 0, latestSession: null };
            }
            rawMonthly[parsed.monthYear].total += burpeesNumber;
            
            // Determinar la última sesión de ese mes
            const currentLatest = rawMonthly[parsed.monthYear].latestSession;
            if (!currentLatest || parsed.sortKey > currentLatest.sortKey) {
              rawMonthly[parsed.monthYear].latestSession = { dateStr: parsed.raw, burpees: rawDaily[parsed.raw].total, sortKey: parsed.sortKey };
            } else if (parsed.sortKey === currentLatest.sortKey) {
              // Actualizamos el total de la última sesión porque sumamos los diarios
              rawMonthly[parsed.monthYear].latestSession.burpees = rawDaily[parsed.raw].total;
            }
          }
        });

        const sortedDaily = Object.values(rawDaily).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
        const sortedMonthly = Object.values(rawMonthly).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

        if (sortedMonthly.length === 0) {
          throw new Error('La hoja está vacía o las fechas no están en formato DD-MM-YYYY.');
        }

        setDailyData(sortedDaily);
        setMonthlyData(sortedMonthly);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentMonthData = monthlyData[currentMonthIndex] || { monthYear: "---", total: 0, latestSession: null };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-spinner"></div>
        <p className="label">Cargando Burpees...</p>
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
          <div className="error-message">
            {error}
          </div>
        ) : (
          <>
            <div className="counter-wrapper">
              <p className="label">Total del Grupo</p>
              <h1 className="counter-value">{currentMonthData.total.toLocaleString('en-US')}</h1>
              <h2 className="month-display">{currentMonthData.monthYear}</h2>
              {currentMonthData.latestSession && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-24px', fontWeight: '500' }}>
                  Última sesión: {currentMonthData.latestSession.burpees} burpees ({currentMonthData.latestSession.dateStr})
                </p>
              )}
            </div>

            <button 
              className="menu-trigger" 
              onClick={() => setIsMenuOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Historial
            </button>
          </>
        )}
      </div>

      {/* Bottom Sheet Menu */}
      <div 
        className={`overlay ${isMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMenuOpen(false)}
      ></div>
      
      <div className={`bottom-sheet ${isMenuOpen ? 'open' : ''}`}>
        <div className="sheet-header" style={{ marginBottom: '16px' }}>
          <h3 className="sheet-title">Historial</h3>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Resumen Mensual
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Últimas Clases
          </button>
        </div>
        
        <ul className="month-list">
          {activeTab === 'monthly' ? (
            monthlyData.map((item, index) => (
              <li key={index} className="month-item">
                <button 
                  className={`month-btn ${currentMonthIndex === index ? 'active' : ''}`}
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
        </ul>
      </div>
    </>
  );
}

export default App;
