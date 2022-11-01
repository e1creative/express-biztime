const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// listing all industries, which should show the company code(s) for that industry
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({industries: results.rows});
    } catch(e) {
        return next(e);
    }
})
    
router.get("/:ind_code", async (req, res, next) => {
    try {
        const ind_code = req.params.ind_code;

        const results = await db.query(`
            SELECT i.code, i.industry, c.name
            FROM industries i
            LEFT JOIN company_industry as ci
            ON i.code = ci.ind_code
            LEFT JOIN companies c
            ON c.code = ci.comp_code
            WHERE i.code = $1;
        `, [ind_code]);

        if (results.rows.length === 0) {
            throw new ExpressError("Results Not Found", 404)
        }

        const { code, industry } = results.rows[0]

        const companies = results.rows.map(r => r.name)

        return res.json({industry: {code, industry, companies}})

    } catch(e) {
        return next(e);
    }
})

// adding an industry
router.post("/", async (req, res, next) => {
    // Adds an industry.
    // Needs to be given JSON like: {code, industry}
    // Returns obj of new industry: {industry: {code, industry}

    try {
        const { code, industry } = req.body;

        const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`, [code, industry])

        return res.status(201).json({industry: results.rows[0]});

    } catch(e) {
        return next(e);
    }
})


// associating an industry to a company
router.put("/:ind_code", async (req, res, next) => {
    // Add an entry to to the company_industry table to associate an industry to a company
    // Should return 404 if company or industry cannot be found.
    // Needs to be given JSON like: {company_code}
    // Returns update industry object: {industry: {code, name, companies: []}}
    try {
        const { ind_code } = req.params
        const { comp_code } = req.body;

        const indSearchResults = await db.query(`SELECT * FROM industries WHERE code=$1`, [ind_code])        
        
        if (indSearchResults.rows.length === 0){
            throw new ExpressError("Industry Not Found", 404)
        }

        const compSearchResults = await db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code])        
        if (compSearchResults.rows.length === 0){
            throw new ExpressError("Company Not Found", 404)
        }

        const results = await db.query(`
            INSERT INTO company_industry (comp_code, ind_code)
                VALUES ($1, $2)
            RETURNING *`, [comp_code, ind_code])
    
        const { industry } = indSearchResults.rows[0]
        const { name } = compSearchResults.rows[0]

        return res.status(200).json({message: `${name} added to ${industry}.`});

    } catch(e) {
        return next(e);
    }

})

// router.delete("/:code", async (req, res, next) => {
//     // Deletes company.
//     // Should return 404 if company cannot be found.
//     // Returns {status: "deleted"}
//     try {
//         const results = await db.query(`
//             DELETE FROM companies
//             WHERE code=$1
//             RETURNING *`, [req.params.code])

//         if (results.rows.length === 0){
//             throw new ExpressError("Results Not Found", 404);
//         }
    
//         return res.json({message: "deleted"});

//     } catch(e) {
//         return next(e);
//     }
// })

module.exports = router;