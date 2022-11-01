\c biztime

DROP TABLE IF EXISTS company_industry;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);


-- Add a table for “industries”, where there is a code and an industry field (for example: “acct” and “Accounting”).
CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

-- Add a table that allows an industry to be connected to several companies and to have a company belong to several industries.
CREATE TABLE company_industry (
    comp_code text NOT NULL REFERENCES companies,
    ind_code text NOT NULL REFERENCES industries,
    PRIMARY KEY (comp_code, ind_code)

);


INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries
  VALUES ('manu', 'Manufacturing'),
         ('science', 'Science'),
         ('rand', 'Research and Development'),
         ('comp', 'Computing');

INSERT INTO company_industry
  VALUES ('apple', 'manu'),
         ('apple', 'rand'),
         ('ibm', 'comp'),
         ('ibm', 'science'),
         ('ibm', 'rand');