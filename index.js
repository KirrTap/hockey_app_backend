const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Na spracovanie JSON dát

// Pripojenie k PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:ZbSIWqZaKDAqCaEsBevyxRruLDqKtRJf@autorack.proxy.rlwy.net:42319/railway',
});

const getDates = () => {
  const today = new Date(); // Aktuálny dátum a čas
  const thirtyDaysLater = new Date(); 
  thirtyDaysLater.setDate(today.getDate() + 30); // Pridanie 30 dní

  // Pre formátovanie dátumov do formátu 'YYYY-MM-DD HH:MM'
  const formatDate = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' '); // Orež na 'YYYY-MM-DD HH:MM'
  };

  return {
    today: formatDate(today),
    thirtyDaysLater: formatDate(thirtyDaysLater),
  };
};


// // API endpoint na zapisovanie textu do databázy
// app.post('/api/text', async (req, res) => {
//   const { text } = req.body;
//   try {
//     const newText = await pool.query(
//       'INSERT INTO texts (content) VALUES ($1) RETURNING *',
//       [text]
//     );
//     res.json(newText.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// app.get('/api/kolo1', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT hometeam, awayteam FROM matches WHERE kolo = $1', ['kolo1']);
//     res.json(result.rows); // Vráti záznamy z databázy
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Chyba pri získavaní údajov z databázy' });
//   }
// });

app.get('/matches', async (req, res) => {
  const { today, thirtyDaysLater } = getDates();

  try {
    const result = await pool.query(`SELECT * FROM matches WHERE datum BETWEEN $1 AND $2 ORDER BY datum ASC`, [today, thirtyDaysLater]);
    res.json(result.rows);
  } catch (error) {
    console.error('Chyba pri získavaní zápasov:', error);
    res.status(500).json({ error: 'Chyba pri získavaní údajov z databázy' });
  }
});


app.post('/submit-score', async (req, res) => {
  const { hometeam, awayteam, homeScore, awayScore } = req.body;

  try {
    // Vyhľadanie zápasu a aktualizácia gólov
    const result = await pool.query(
      `UPDATE matches 
       SET homegoals = $3, awaygoals = $4 
       WHERE hometeam = $1 AND awayteam = $2 
       RETURNING *`,
      [hometeam, awayteam, homeScore, awayScore]
    );

    // Kontrola, či sa zápas našiel a aktualizoval
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Zápas nenájdený' });
    }

    // Ak všetko prebehlo v poriadku
    res.json({ message: 'Výsledok úspešne aktualizovaný', match: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Štart servera
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server beží na porte ${PORT}`);
});