const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require('slugify')

router.get("/", async (req, res, next) => {
    // Returns list of companies, like {companies: [{code, name}, ...]}
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows});
    } catch(e) {
        return next(e);
    }
})
    
router.get("/:code", async (req, res, next) => {
    // Return obj of company: {company: {code, name, description}}
    // UPDATE (from section 2): Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
    // If the company given cannot be found, this should return a 404 status response.
    // UPDATE: when viewing details for a company, you can see the names of the industries for that company
    try {
        const comp_code = req.params.code;

        const results = await db.query(`
            SELECT c.code, c.name, c.description, i.industry FROM companies as c
            LEFT JOIN company_industry as ci
            ON c.code = ci.comp_code
            LEFT JOIN industries as i
            ON i.code = ci.ind_code
            WHERE c.code = $1;
        `, [comp_code]);

        if (results.rows.length === 0) {
            throw new ExpressError("Results Not Found", 404)
        }

        const { code, name, description } = results.rows[0]

        const industries = results.rows.map(r => r.industry)

        return res.json({company: {code, name, description, industries}})    

    } catch(e) {
        return next(e);
    }
})

router.post("/", async (req, res, next) => {
    // Adds a company.
    // Needs to be given JSON like: {code, name, description}
    // UPDATE: Needs to be given JSON like: {name, description}
    // Returns obj of new company: {company: {code, name, description}}

    try {
        const { name, description } = req.body;

        const code = slugify(name, {replacement: '', lower: true, strict: true})

        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description])

        return res.status(201).json({company: results.rows[0]});

    } catch(e) {
        return next(e);
    }
})

router.put("/:code", async (req, res, next) => {
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

        if (results.rows.length === 0){
            throw new ExpressError("Results Not Found", 404)
        }
    
        return res.status(200).json({company: results.rows[0]});

    } catch(e) {
        return next(e);
    }

})

router.delete("/:code", async (req, res, next) => {
    // Deletes company.
    // Should return 404 if company cannot be found.
    // Returns {status: "deleted"}
    try {
        const results = await db.query(`
            DELETE FROM companies
            WHERE code=$1
            RETURNING *`, [req.params.code])

        if (results.rows.length === 0){
            throw new ExpressError("Results Not Found", 404);
        }
    
        return res.json({message: "deleted"});

    } catch(e) {
        return next(e);
    }
})

module.exports = router;