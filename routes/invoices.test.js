process.env.NODE_ENV = 'test';

const { CommandCompleteMessage } = require('pg-protocol/dist/messages');
const request = require('supertest');
const app = require('../app');
const db = require('../db');


// add test companies
beforeEach(async () => {
    await db.query(`
        INSERT INTO companies
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.');
    `);
    await db.query(`
        INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null);
    `);
})

// add test invoices
afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies`)
})

// close our db connection after all tests have ran
afterAll(async () => {
    await db.end();
})


describe('GET /invoices', () => {
    test('Testing get all invoices', async () => {
        const res = await request(app).get('/invoices')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
            {invoices: [
                { "id": expect.any(Number), "comp_code": "apple", "amt": 100, "paid": false, "add_date": expect.any(String), "paid_date": null},
                { "id": expect.any(Number), "comp_code": "apple", "amt": 200, "paid": false, "add_date": expect.any(String), "paid_date": null},
                { "id": expect.any(Number), "comp_code": "apple", "amt": 300, "paid": true, "add_date": expect.any(String), "paid_date": expect.any(String)},
                { "id": expect.any(Number), "comp_code": "ibm", "amt": 400, "paid": false, "add_date": expect.any(String), "paid_date": null}
            ]}
        );
    })
})

describe('GET /invoices/:id', () => {
    test('Get a single invoice', async () => {
        const allResults = await request(app).get('/invoices')
        const res = await request(app).get(`/invoices/${allResults.body.invoices[0].id}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual( 
            {
                "invoice": {
                    "amt": 100,
                    "paid": false,
                    "add_date": expect.any(String),
                    "paid_date": null,
                    "company": {
                        "code": "apple",
                        "name": "Apple Computer",
                        "description": "Maker of OSX."
                    }
                }
            }
        );
    })
    test('404 if a single invoice is not found', async () => {
        const res = await request(app).get('/invoices/1')
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual(
            {
                "error": {
                    "message": "Results Not Found",
                    "status": 404
                },
                "message": "Results Not Found"
            }
        );
    })
})


describe('POST /invoices', () => {
    test('Add a single company', async () => {
        const newInvoice = {"code": "apple", "amount": 500}
        const res = await request(app).post('/invoices').send(newInvoice)
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(
            {
                invoice: 
                    {"id": res.body.invoice.id, "comp_code": "apple", "amt": 500, "paid": false, "add_date": expect.any(String), "paid_date": null}
            }
        );
    })
})


describe('PUT /invoices/:code', () => {
    test('Edit a single invoice', async () => {
        const allResults = await request(app).get('/invoices/')
        const newInvoiceInfo = {"amount": 500, "paid": false}
        const res = await request(app).put(`/invoices/${allResults.body.invoices[0].id}`).send(newInvoiceInfo)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
            {
                "invoice": {
                    "id": expect.any(Number),
                    "comp_code": expect.any(String),
                    "amt": 500,
                    "paid": expect.any(Boolean),
                    "add_date": expect.any(String),
                    "paid_date": null
                }
            }
        );
    })
    test('UPDATE a non-existent invoice', async () => {
        const newInvoiceInfo = {"amount": 1000}
        const res = await request(app).put('/invoices/0').send(newInvoiceInfo)
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual(
            {
                "error": {
                    "message": "Results Not Found",
                    "status": 404
                },
                "message": "Results Not Found"
            }
        );
    })

})


describe('DELETE /invoices/:code', () => {
    test('DELETE a single invoice', async () => {
        const allResults = await request(app).get('/invoices/')
        const testInvoiceID = allResults.body.invoices[0].id;
        const res = await request(app).delete(`/invoices/${testInvoiceID}`)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({message: "deleted"});
    })
    test('DELETE a non-existent invoice', async () => {
        const res = await request(app).delete('/invoices/0')
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual(
            {
                "error": {
                    "message": "Results Not Found",
                    "status": 404
                },
                "message": "Results Not Found"
            }
        );
    })
})