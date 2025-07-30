import express from 'express';
import pg from 'pg';
const { Pool } = pg;


const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

// Create a new pool of connections to the PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DB_URL, 
    ssl: {
        rejectUnauthorized: false
    }
});

// Root route to display search forms
app.get('/', async (req, res) => {
  try {
    // Use double quotes for case-sensitive column names
    const authorSql = 'SELECT "authorId", "firstName", "lastName" FROM q_authors ORDER BY "lastName"';
    const categorySql = 'SELECT DISTINCT category FROM q_quotes ORDER BY category';
    
    // Use { rows } to destructure the result from the 'pg' library
    const { rows: authors } = await pool.query(authorSql);
    const { rows: categories } = await pool.query(categorySql);

    res.render('index', { authors: authors, categories: categories });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// Route for Keyword Search
app.get("/searchByKeyword", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    // Use ILIKE for case-insensitive matching and $1 for the parameter
    const sql = `SELECT quote, "authorId", "firstName", "lastName"
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
    const sql = `SELECT quote, "authorId", "firstName", "lastName"
                 FROM q_quotes
                 NATURAL JOIN q_authors
                 WHERE "authorId" = $1`;
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
    const sql = `SELECT quote, "authorId", "firstName", "lastName"
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
    const sql = `SELECT quote, "authorId", "firstName", "lastName"
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

// API endpoint to get Author Info
app.get('/api/author/:id', async (req, res) => {
  try {
    const authorId = req.params.id;
    const sql = `SELECT * FROM q_authors WHERE "authorId" = $1`;
    const { rows } = await pool.query(sql, [authorId]);
    res.send(rows[0]); // Send first (and only) result
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching author data.");
  }
});

// Use the port provided by Render, or 3000 for local development
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
