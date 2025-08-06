import express from 'express';
import pg from 'pg';
const { Pool } = pg;

// import 'dotenv/config'; 

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // Middleware for parsing form data

const pool = new Pool({
    connectionString: process.env.DB_URL, 
    ssl: {
        rejectUnauthorized: false
    }
});

// Root route
app.get('/', async (req, res) => {
  try {
    const authorSql = 'SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName';
    const categorySql = 'SELECT DISTINCT category FROM q_quotes ORDER BY category';
    
    const { rows: authors } = await pool.query(authorSql);
    const { rows: categories } = await pool.query(categorySql);

    res.render('index', { authors: authors, categories: categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data.");
  }
});

// Route for Keyword Search
app.get("/searchByKeyword", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    // Use ILIKE for case-insensitive matching and $1 for the parameter
    const sql = `SELECT quote, authorid, firstname, lastname
                 FROM q_quotes
                 NATURAL JOIN q_authors
                 WHERE quote ILIKE $1`; 
    const params = [`%${keyword}%`];
    const { rows } = await pool.query(sql, params);
    res.render("results", { quotes: rows });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// Route for Author Search
app.get("/searchByAuthor", async (req, res) => {
  try {
    const authorId = req.query.authorId;
    const sql = `SELECT quote, authorid, firstname, lastname
                 FROM q_quotes
                 NATURAL JOIN q_authors
                 WHERE authorid = $1`;
    const { rows } = await pool.query(sql, [authorId]);
    res.render("results", { quotes: rows });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// Route for Category Search
app.get("/searchByCategory", async (req, res) => {
  try {
    const category = req.query.category;
    const sql = `SELECT quote, authorid, firstname, lastname
                 FROM q_quotes
                 NATURAL JOIN q_authors
                 WHERE category = $1`;
    const { rows } = await pool.query(sql, [category]);
    res.render("results", { quotes: rows });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// Route for Likes Search
app.get("/searchByLikes", async (req, res) => {
  try {
    const minLikes = req.query.minLikes;
    const maxLikes = req.query.maxLikes;
    const sql = `SELECT quote, authorid, firstname, lastname
                 FROM q_quotes
                 NATURAL JOIN q_authors
                 WHERE likes BETWEEN $1 AND $2`;
    const { rows } = await pool.query(sql, [minLikes, maxLikes]);
    res.render("results", { quotes: rows });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// API routes
app.get('/api/author/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM q_authors WHERE authorid = $1`;
    const { rows } = await pool.query(sql, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching author.' });
  }
});

app.post('/api/authors', async (req, res) => {
    try {
        const { firstName, lastName, dob, dod, country, profession, bio, pictureUrl } = req.body;
        const sql = `INSERT INTO q_authors (firstName, lastName, dob, dod, country, profession, bio, pictureUrl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
        await pool.query(sql, [firstName, lastName, dob, dod, country, profession, bio, pictureUrl]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding author.");
    }
});

app.post('/api/quotes', async (req, res) => {
    try {
        const { quote, authorId, category, likes } = req.body;
        const sql = `INSERT INTO q_quotes (quote, authorId, category, likes) VALUES ($1, $2, $3, $4)`;
        await pool.query(sql, [quote, authorId, category, likes]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding quote.");
    }
});

app.get('/api/quotes/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const quoteSql = 'SELECT * FROM q_quotes WHERE quoteid = $1';
        const authorsSql = 'SELECT authorid, firstname, lastname FROM q_authors ORDER BY lastname';

        const quoteResult = await pool.query(quoteSql, [id]);
        const authorsResult = await pool.query(authorsSql);

        res.render('partials/editQuoteForm', { quote: quoteResult.rows[0], authors: authorsResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching quote details for editing.");
    }
});

app.post('/api/quotes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quote, authorId, category, likes } = req.body;
        const sql = `UPDATE q_quotes SET quote = $1, authorId = $2, category = $3, likes = $4 WHERE quoteid = $5`;
        await pool.query(sql, [quote, authorId, category, likes, id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating quote.");
    }
});

app.delete('/api/quotes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM q_quotes WHERE quoteid = $1', [id]);
        res.json({ success: true, message: 'Quote deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error deleting quote.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));