import express from 'express';
import pg from 'pg';
const { Pool } = pg;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', async (req, res) => {
  try {
    const authors   = (await pool.query(`
      SELECT "authorId","firstName","lastName"
      FROM q_authors
      ORDER BY "lastName"
    `)).rows;

    const categories = (await pool.query(`
      SELECT DISTINCT "category"
      FROM q_quotes
      ORDER BY "category"
    `)).rows.map(r => r.category);

    res.render('index', { authors, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data.");
  }
});

// ─── Keyword Search ────────────────────────────────────────────────────────────
app.get("/searchByKeyword", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const rows = (await pool.query(`
      SELECT
        q."quoteId", q."quote", q."authorId",
        a."firstName", a."lastName"
      FROM q_quotes AS q
      JOIN q_authors AS a
        ON q."authorId" = a."authorId"
      WHERE q."quote" ILIKE $1
    `, [`%${keyword}%`])).rows;

    res.render("results", { quotes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching quotes.");
  }
});

// ─── Author Search ─────────────────────────────────────────────────────────────
app.get("/searchByAuthor", async (req, res) => {
  try {
    const authorId = req.query.authorId;

    // fetch author name
    const authorRes = await pool.query(`
      SELECT "firstName","lastName"
      FROM q_authors
      WHERE "authorId" = $1
    `, [authorId]);
    const author = authorRes.rows[0];

    // fetch that author’s quotes
    const rows = (await pool.query(`
      SELECT
        q."quoteId", q."quote", q."authorId",
        a."firstName", a."lastName"
      FROM q_quotes AS q
      JOIN q_authors AS a
        ON q."authorId" = a."authorId"
      WHERE q."authorId" = $1
    `, [authorId])).rows;

    res.render("results", {
      quotes:    rows,
      authorId,
      author
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching author’s quotes.");
  }
});

// ─── Category Search ───────────────────────────────────────────────────────────
app.get("/searchByCategory", async (req, res) => {
  try {
    const category = req.query.category;
    const rows = (await pool.query(`
      SELECT
        q."quoteId", q."quote", q."authorId",
        a."firstName", a."lastName"
      FROM q_quotes AS q
      JOIN q_authors AS a
        ON q."authorId" = a."authorId"
      WHERE q."category" = $1
    `, [category])).rows;

    res.render("results", { quotes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching quotes.");
  }
});

// ─── Likes Search ───────────────────────────────────────────────────────────────
app.get("/searchByLikes", async (req, res) => {
  try {
    const { minLikes, maxLikes } = req.query;
    const rows = (await pool.query(`
      SELECT
        q."quoteId", q."quote", q."authorId",
        a."firstName", a."lastName"
      FROM q_quotes AS q
      JOIN q_authors AS a
        ON q."authorId" = a."authorId"
      WHERE q."likes" BETWEEN $1 AND $2
    `, [minLikes, maxLikes])).rows;

    res.render("results", { quotes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching quotes.");
  }
});

// ─── API: Get Single Author ────────────────────────────────────────────────────
app.get('/api/author/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = (await pool.query(`
      SELECT * FROM q_authors WHERE "authorId" = $1
    `, [id])).rows[0];
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching author.' });
  }
});

// ─── API: Add Quote ─────────────────────────────────────────────────────────────
app.post('/api/quotes', async (req, res) => {
  try {
    const { quote, authorId, category, likes } = req.body;
    await pool.query(`
      INSERT INTO q_quotes("quote","authorId","category","likes")
      VALUES($1,$2,$3,$4)
    `, [quote, authorId, category, likes]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding quote.");
  }
});

// ─── API: Edit Form Partial ─────────────────────────────────────────────────────
app.get('/api/quotes/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const quoteRow   = (await pool.query(`
      SELECT * FROM q_quotes WHERE "quoteId" = $1
    `, [id])).rows[0];
    const authors    = (await pool.query(`
      SELECT "authorId","firstName","lastName" FROM q_authors ORDER BY "lastName"
    `)).rows;
    res.render('partials/editQuoteForm', { quote: quoteRow, authors });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit form.");
  }
});

// ─── API: Update Quote ─────────────────────────────────────────────────────────
app.post('/api/quotes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quote, authorId, category, likes } = req.body;
    await pool.query(`
      UPDATE q_quotes
      SET "quote"=$1,"authorId"=$2,"category"=$3,"likes"=$4
      WHERE "quoteId" = $5
    `, [quote, authorId, category, likes, id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating quote.");
  }
});

// ─── API: Delete Quote ─────────────────────────────────────────────────────────
app.delete('/api/quotes/:id', async (req, res) => {
  try {
    await pool.query(`
      DELETE FROM q_quotes WHERE "quoteId" = $1
    `, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ─── API: Delete Author & Their Quotes ─────────────────────────────────────────
app.delete('/api/authors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // remove their quotes first
    await pool.query(`DELETE FROM q_quotes WHERE "authorId" = $1`, [id]);
    // then the author
    await pool.query(`DELETE FROM q_authors WHERE "authorId" = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting author.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
