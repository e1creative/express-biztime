process.env.NODE_ENV = 'test';

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


describe('GET /companies', () => {
    test('Testing get all companies', async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
            {companies: [
                { "code": "apple", "name": "Apple Computer", "description": "Maker of OSX."},
                { "code": "ibm", "name": "IBM", "description": "Big blue."}
            ]}
        );
    })
})

describe('GET /companies/:code', () => {
    test('Get a single company', async () => {
        const res = await request(app).get('/companies/ibm')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual( 
            {
                "company": {
                    "code": "ibm",
                    "name": "IBM",
                    "description": "Big blue.",
                    "invoices": [
                        {
                            "id": expect.any(Number),
                            "comp_code": "ibm",
                            "amt": 400,
                            "paid": false,
                            "add_date": expect.any(String),
                            "paid_date": null
                        }
                    ]
                }
            } 
        );
    })
    test('404 if a single company is not found', async () => {
        const res = await request(app).get('/companies/aaa')
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


describe('POST /companies', () => {
    test('Add a single company', async () => {
        const newCompany = {code: "pg", name: "Progress Group", description: "Vizume Hawaii"}
        const res = await request(app).post('/companies').send(newCompany)
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({company: newCompany});
    })
})


describe('PUT /companies/:code', () => {
    test('Edit a single company', async () => {
        const newCompanyInfo = {name: "Apple", description: "Apple updated!"}
        const res = await request(app).put('/companies/apple').send(newCompanyInfo)
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({company: {"code": "apple", "name": "Apple", "description": "Apple updated!"}});
    })
    test('UPDATE a non-existent company', async () => {
        const newCompanyInfo = {name: "Apple", description: "Apple updated!"}
        const res = await request(app).put('/companies/aaa').send(newCompanyInfo)
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


describe('DELETE /companies/:code', () => {
    test('DELETE a single company', async () => {
        const res = await request(app).delete('/companies/apple')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({message: "deleted"});
    })
    test('DELETE a non-existent company', async () => {
        const res = await request(app).delete('/companies/aaa')
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