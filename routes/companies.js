const express = require("express")
const router = express.Router()
const db = require("../db")
const ExpressError = require("../expressError")


router.get("/", async (req, res, next) => {
    // Returns list of companies, like {companies: [{code, name}, ...]}
    try {
        const results = await db.query(`SELECT * FROM companies`)
        return res.json({companies: results.rows})    
    } catch(e) {
        return next(e)
    }
})
    
router.get("/:code", async (req, res, next) => {
    // Return obj of company: {company: {code, name, description}}
    // UPDATE (from section 2): Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
    // If the company given cannot be found, this should return a 404 status response.
    try {
        const comp_code = req.params.code;
        const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code])
        if (results.rows.length === 0) {
            throw new ExpressError("Results Not Found", 404)
        }
        const { code, name, description} = results.rows[0]

        const invoicesResults = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [comp_code])
        return res.json({company: {code, name, description, invoices: invoicesResults.rows}})    
    } catch(e) {
        return next(e);
    }
})

router.post("/", async (req, res, next) => {
    // Adds a company.
    // Needs to be given JSON like: {code, name, description}
    // Returns obj of new company: {company: {code, name, description}}

    try {
        const { code, name, description } = req.body;

        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description])

        return res.status(201).json({company: results.rows[0]})    

    } catch(e) {
        return next(e);
    }
})

router.put("/:code", async (req, res) => {
    // Edit existing company.
    // Should return 404 if company cannot be found.
    // Needs to be given JSON like: {name, description}
    // Returns update company object: {company: {code, name, description}}
    try {
        const code = req.params.code
        const { name, description } = req.body;

        const results = await db.query(`
            UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING *`, [name, description, code])

        return res.status(200).json({company: results.rows[0]})    

    } catch(e) {
        return next(e);
    }

})

router.delete("/:code", async (req, res, next) => {
    // Deletes company.
    // Should return 404 if company cannot be found.
    // Returns {status: "deleted"}
    try {
        const searchResults = await db.query(`
            SELECT * FROM companies
            WHERE code=$1`, [req.params.code])
        
        if (searchResults.rows.length === 0){
            throw new ExpressError("Results Not Found", 404)
        }

        const results = await db.query(`
            DELETE FROM companies
            WHERE code=$1`, [req.params.code])

        return res.json({message: "deleted"})    

    } catch(e) {
        return next(e);
    }
})

module.exports = router;