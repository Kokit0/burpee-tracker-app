import { useState, useEffect } from 'react';
import './index.css';

// URL del CSV público de Google Sheets
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT44e0CJHeGd_n75F4wPQxt4JqOvyK7cQfMM8ZXK8xv7ldcqQOdCKXA5b7czGA5JDgUbPEt9sCNq6IG/pub?output=csv";

function App() {
  const [data, setData] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SPREADSHEET_CSV_URL);
        if (!response.ok) throw new Error('Error al cargar los datos');
        const csvText = await response.text();
        
        // Parse CSV manually (assuming "Mes,Burpees" format)
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        // Skip header row if it exists
        const dataRows = lines[0].toLowerCase().includes('mes') ? lines.slice(1) : lines;
        
        // Group by month and sum the burpees
        const groupedData = {};

        dataRows.forEach(row => {
          const parts = row.split(',');
          // If there are commas inside the number, parts will be longer than 2.
          // The month is always the first part.
          const month = parts[0].trim();
          
          // Re-join the rest in case burpees had commas (e.g. "4,320")
          const burpeesStr = parts.slice(1).join(',').replace(/"/g, '').replace(/,/g, '').trim();
          const burpeesNumber = parseInt(burpeesStr, 10);

          if (month && !isNaN(burpeesNumber)) {
            if (!groupedData[month]) {
              groupedData[month] = 0;
            }
            groupedData[month] += burpeesNumber;
          }
        });

        // Convert object to array and format the numbers with commas
        const parsedData = Object.keys(groupedData).map(month => {
          return {
            month,
            burpees: groupedData[month].toLocaleString('en-US')
          };
        });

        if (parsedData.length === 0) {
          throw new Error('La hoja de cálculo está vacía o no tiene el formato correcto.');
        }

        // Put the most recently added month at the top (usually the last row)
        setData(parsedData.reverse());
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentData = data[currentMonthIndex] || { month: "---", burpees: "0" };

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
        <div className="logo-container">
          {/* Generic placeholder logo (Flame icon representing fitness/burn) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
          </svg>
        </div>

        {error ? (
          <div className="error-message">
            {error}
            <br />
            <span style={{ fontSize: '0.8em', marginTop: '8px', display: 'block' }}>
              Asegúrate de haber publicado la hoja en la web como CSV.
            </span>
          </div>
        ) : (
          <>
            <p className="label">Total del Grupo</p>
            <h1 className="counter-value">{currentData.burpees}</h1>
            <h2 className="month-display">{currentData.month}</h2>

            <button 
              className="menu-trigger" 
              onClick={() => setIsMenuOpen(true)}
              aria-label="Ver meses anteriores"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Meses Anteriores
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
        <div className="sheet-header">
          <h3 className="sheet-title">Historial</h3>
          <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <ul className="month-list">
          {data.map((item, index) => (
            <li key={index} className="month-item">
              <button 
                className={`month-btn ${currentMonthIndex === index ? 'active' : ''}`}
                onClick={() => {
                  setCurrentMonthIndex(index);
                  setIsMenuOpen(false);
                }}
              >
                <span>{item.month}</span>
                <span className="month-btn-value">{item.burpees}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
