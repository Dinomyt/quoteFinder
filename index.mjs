import express from 'express';
import pg from 'pg';
const { Pool } = pg;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const pool = new Pool({
    connectionString: process.env.DB_URL, 
    ssl: {
        rejectUnauthorized: false
    }
});
// Root route to display search forms
app.get('/', async (req, res) => {
  try {
    const authorSql = "SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName";
    const categorySql = "SELECT DISTINCT category FROM q_quotes ORDER BY category";
    
    const [authors] = await pool.query(authorSql);
    const [categories] = await pool.query(categorySql);

    res.render('index', { authors: authors, categories: categories });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Error fetching data from database.");
  }
});

// Route for Keyword Search
app.get("/searchByKeyword", async (req, res) => {
  let keyword = req.query.keyword;
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
             NATURAL JOIN q_authors
             WHERE quote LIKE ?`;
  let params = [`%${keyword}%`];
  let [rows] = await pool.query(sql, params);
  res.render("results", { quotes: rows });
});

// Route for Author Search
app.get("/searchByAuthor", async (req, res) => {
  let authorId = req.query.authorId;
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
             NATURAL JOIN q_authors
             WHERE authorId = ?`;
  let [rows] = await pool.query(sql, [authorId]);
  res.render("results", { quotes: rows });
});

// Route for Category Search
app.get("/searchByCategory", async (req, res) => {
  let category = req.query.category;
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
             NATURAL JOIN q_authors
             WHERE category = ?`;
  let [rows] = await pool.query(sql, [category]);
  res.render("results", { quotes: rows });
});

// Route for Likes Search
app.get("/searchByLikes", async (req, res) => {
  let minLikes = req.query.minLikes;
  let maxLikes = req.query.maxLikes;
  let sql = `SELECT quote, authorId, firstName, lastName
             FROM q_quotes
             NATURAL JOIN q_authors
             WHERE likes BETWEEN ? AND ?`;
  let [rows] = await pool.query(sql, [minLikes, maxLikes]);
  res.render("results", { quotes: rows });
});

// API endpoint to get Author Info
app.get('/api/author/:id', async (req, res) => {
  let authorId = req.params.id;
  let sql = `SELECT * FROM q_authors WHERE authorId = ?`;
  let [rows] = await pool.query(sql, [authorId]);
  res.send(rows[0]); // Send first (and only) result
});


app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});