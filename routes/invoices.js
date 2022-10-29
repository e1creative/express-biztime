const express = require("express")
const router = express.Router()
const db = require("../db")
const ExpressError = require("../expressError")


router.get("/", async (req, res) => {
    /** Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
    try {
        const results = await db.query(`SELECT * FROM invoices`)
        return res.json({invoices: results.rows})    
    } catch(e) {
        return next(e)
    }
}) 
    
router.get("/:id", async (req, res, next) => {
    // Returns obj on given invoice.
    // If invoice cannot be found, returns 404.
    // Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

    try {
        const { id } = req.params;
        const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id])

        if (results.rows.length === 0) {
            throw new ExpressError("Results Not Found", 404)
        }

        const { invoice_id, comp_code, amt, paid, add_date, paid_date } = results.rows[0];
        
        const companyResults = await db.query(`SELECT * FROM companies WHERE code='${comp_code}'`)

        const { code, name, description } = companyResults.rows[0]

        return res.json({invoice: {invoice_id, amt, paid, add_date, paid_date, company: {code, name, description}}})    
    } catch(e) {
        return next(e);
    }
})

router.post("/", async (req, res, next) => {
    // Adds an invoice.
    // Needs to be passed in JSON body of: {comp_code, amt}
    // Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

    try {
        const { code, amount } = req.body;

        const results = await db.query(`
            INSERT INTO invoices (comp_code, amt ) 
            VALUES ($1, $2) 
            RETURNING *`, [code, amount])

        const { id, comp_code, amt, paid, add_date, paid_date } = results.rows[0];

        return res.status(201).json({invoice: {id, comp_code, amt, paid, add_date, paid_date}})    

    } catch(e) {
        return next(e);
    }
}) 

router.put("/:id", async (req, res, next) => {
    // Updates an invoice.
    // If invoice cannot be found, returns a 404.
    // Needs to be passed in a JSON body of {amt}
    // Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
    try {
        const invoiceId = req.params.id
        const { amount } = req.body;

        const results = await db.query(`
            UPDATE invoices SET amt=$2
            WHERE id=$1
            RETURNING *`, [invoiceId, amount])

        return res.status(200).json({invoice: results.rows[0]})    

    } catch(e) {
        return next(e);
    }
})

router.delete("/:id", async (req, res, next) => {
    // Deletes an invoice.
    // If invoice cannot be found, returns a 404.
    // Returns: {status: "deleted"}
    try {
        const searchResults = await db.query(`
            SELECT * FROM invoices
            WHERE id=$1`, [req.params.id])
        
        if (searchResults.rows.length === 0){
            throw new ExpressError("Results Not Found", 404)
        }

        const results = await db.query(`
            DELETE FROM invoices
            WHERE id=$1`, [req.params.id])

        return res.json({message: "deleted"})    

    } catch(e) {
        return next(e);
    }
})

module.exports = router;