"""
Seed definitions for the SQL assessment track.

Five challenges, ordered beginner -> advanced. Each one carries:
  * a detailed candidate-facing brief (``description``)
  * a self-contained SQLite DDL + seed script (``sql_schema``) that builds the
    sandbox database the candidate queries in the browser

Deliberately absent: any starter query. SQL challenges open with a completely
empty editor so the candidate writes the entire answer themselves.
"""

SQL_CHALLENGES = [
    # ------------------------------------------------------------------ 1/5
    {
        "title": "Employee Directory — Filtering & Sorting",
        "difficulty": "Beginner",
        "description": """\
**Level: Beginner — Core SELECT, WHERE, ORDER BY, LIMIT**

The HR team maintains a single `employees` table and wants a shortlist of the
best-paid engineering staff who are still with the company.

### Schema
```
employees(
  id            INTEGER PRIMARY KEY,
  full_name     TEXT    NOT NULL,
  department    TEXT    NOT NULL,   -- 'Engineering', 'Sales', 'Marketing', 'Support'
  job_title     TEXT    NOT NULL,
  salary        INTEGER NOT NULL,   -- annual gross, in USD
  hire_date     TEXT    NOT NULL,   -- ISO format 'YYYY-MM-DD'
  is_active     INTEGER NOT NULL    -- 1 = currently employed, 0 = left the company
)
```

### Your task
Write a **single** query that returns the **top 5 highest-paid active employees in
the Engineering department who were hired on or after 2021-01-01**.

### Required output
Return exactly these columns, with exactly these names, in this order:

| column       | meaning                                   |
|--------------|-------------------------------------------|
| `full_name`  | the employee's full name                  |
| `job_title`  | their job title                           |
| `salary`     | their annual salary                       |
| `hire_date`  | their hire date                           |

Order the rows by `salary` **descending**. If two employees earn the same amount,
break the tie with the **earlier** `hire_date` first. Return at most 5 rows.

### Rules
- One statement only — no temporary tables, no multiple queries.
- Do not hardcode names, ids or salary values in the `WHERE` clause; the grader
  runs your query against a different dataset with the same shape.
- Column aliases matter: the result grid is compared by column name.

### What we are assessing
Correct use of `WHERE` with multiple predicates, string and date comparison,
multi-key `ORDER BY` with mixed direction, and `LIMIT`.
""",
        "sql_schema": """\
CREATE TABLE employees (
  id         INTEGER PRIMARY KEY,
  full_name  TEXT    NOT NULL,
  department TEXT    NOT NULL,
  job_title  TEXT    NOT NULL,
  salary     INTEGER NOT NULL,
  hire_date  TEXT    NOT NULL,
  is_active  INTEGER NOT NULL
);

INSERT INTO employees (id, full_name, department, job_title, salary, hire_date, is_active) VALUES
  (1,  'Priya Raman',      'Engineering', 'Staff Engineer',      186000, '2021-03-14', 1),
  (2,  'Daniel Okonkwo',   'Engineering', 'Principal Engineer',  204000, '2020-11-02', 1),
  (3,  'Mei Lin Chen',     'Engineering', 'Senior Engineer',     158000, '2021-07-19', 1),
  (4,  'Arjun Kapoor',     'Engineering', 'Senior Engineer',     158000, '2021-02-08', 1),
  (5,  'Sofia Almeida',    'Engineering', 'Engineering Manager', 192000, '2022-01-05', 1),
  (6,  'Tomas Nowak',      'Engineering', 'Engineer II',         131000, '2023-04-17', 1),
  (7,  'Hannah Weiss',     'Engineering', 'Staff Engineer',      179000, '2021-09-30', 0),
  (8,  'Kwame Mensah',     'Engineering', 'Engineer I',          104000, '2024-02-26', 1),
  (9,  'Rosa Delgado',     'Engineering', 'Senior Engineer',     162000, '2022-06-13', 1),
  (10, 'Yuki Tanaka',      'Engineering', 'Engineer II',         128000, '2020-08-24', 1),
  (11, 'Liam O''Sullivan', 'Sales',       'Account Executive',   142000, '2021-05-11', 1),
  (12, 'Nadia Farouk',     'Sales',       'Sales Director',      198000, '2022-03-07', 1),
  (13, 'Ethan Brooks',     'Marketing',   'Growth Lead',         149000, '2021-10-25', 1),
  (14, 'Ingrid Larsen',    'Marketing',   'Content Strategist',   98000, '2023-01-16', 1),
  (15, 'Carlos Mendoza',   'Support',     'Support Engineer',     87000, '2022-08-01', 1),
  (16, 'Amara Nwosu',      'Support',     'Support Lead',        112000, '2021-12-06', 1),
  (17, 'Felix Baumann',    'Engineering', 'Principal Engineer',  211000, '2019-04-22', 1),
  (18, 'Leila Haddad',     'Engineering', 'Engineering Manager', 192000, '2021-11-29', 1);
""",
    },
    # ------------------------------------------------------------------ 2/5
    {
        "title": "Store Sales — Grouping & Aggregation",
        "difficulty": "Beginner+",
        "description": """\
**Level: Beginner+ — GROUP BY, aggregate functions, HAVING**

A retail chain wants a per-category revenue summary so it can decide which
product categories deserve more shelf space.

### Schema
```
products(
  id        INTEGER PRIMARY KEY,
  name      TEXT    NOT NULL,
  category  TEXT    NOT NULL,
  unit_price REAL   NOT NULL
)

sales(
  id          INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL,
  sold_at     TEXT    NOT NULL,  -- ISO date 'YYYY-MM-DD'
  store_code  TEXT    NOT NULL
)
```
Revenue for a sale row is `quantity * unit_price`. There is **no** stored revenue
column — you must compute it.

### Your task
Write a **single** query producing one row per product **category**, covering
sales made during the **2024 calendar year only** (`2024-01-01` through
`2024-12-31` inclusive).

### Required output
Return exactly these columns, with exactly these names, in this order:

| column          | meaning                                                    |
|-----------------|------------------------------------------------------------|
| `category`      | the product category                                       |
| `units_sold`    | total quantity sold across the category                    |
| `total_revenue` | total revenue, rounded to **2 decimal places**              |
| `order_count`   | how many individual sale rows contributed                   |

Include **only** categories whose `total_revenue` exceeds **5000**.
Order by `total_revenue` **descending**.

### Rules
- One statement only.
- `total_revenue` must be rounded to 2 decimals (SQLite's `ROUND` is available).
- The revenue filter must be applied *after* aggregation, not row by row.

### What we are assessing
Whether you reach for `HAVING` rather than `WHERE` for a post-aggregation filter,
correct joining before grouping, and the difference between `SUM`, `COUNT(*)` and
`COUNT(DISTINCT ...)`.
""",
        "sql_schema": """\
CREATE TABLE products (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  unit_price REAL NOT NULL
);

CREATE TABLE sales (
  id         INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  sold_at    TEXT NOT NULL,
  store_code TEXT NOT NULL
);

INSERT INTO products (id, name, category, unit_price) VALUES
  (1,  'Mechanical Keyboard',  'Peripherals',  129.99),
  (2,  'Wireless Mouse',       'Peripherals',   49.50),
  (3,  'USB-C Hub',            'Peripherals',   79.00),
  (4,  '27" 4K Monitor',       'Displays',     449.00),
  (5,  '34" Ultrawide',        'Displays',     799.00),
  (6,  'Laptop Stand',         'Accessories',   59.95),
  (7,  'Noise-Cancel Headset', 'Audio',        279.00),
  (8,  'Desk Microphone',      'Audio',        149.00),
  (9,  'Webcam 1080p',         'Accessories',   89.00),
  (10, 'Cable Organiser Kit',  'Accessories',   19.99);

INSERT INTO sales (id, product_id, quantity, sold_at, store_code) VALUES
  (1,  1,  12, '2024-01-15', 'STR-01'),
  (2,  1,   8, '2024-02-03', 'STR-02'),
  (3,  2,  40, '2024-02-19', 'STR-01'),
  (4,  3,  15, '2024-03-08', 'STR-03'),
  (5,  4,   9, '2024-03-22', 'STR-01'),
  (6,  5,   6, '2024-04-11', 'STR-02'),
  (7,  5,   4, '2024-05-02', 'STR-01'),
  (8,  6,  22, '2024-05-27', 'STR-03'),
  (9,  7,  11, '2024-06-14', 'STR-02'),
  (10, 7,   7, '2024-07-01', 'STR-01'),
  (11, 8,   5, '2024-07-23', 'STR-03'),
  (12, 9,  18, '2024-08-09', 'STR-02'),
  (13, 10, 60, '2024-08-30', 'STR-01'),
  (14, 2,  25, '2024-09-17', 'STR-03'),
  (15, 4,   7, '2024-10-05', 'STR-02'),
  (16, 1,   6, '2024-11-19', 'STR-01'),
  (17, 3,  10, '2024-12-02', 'STR-03'),
  (18, 6,  14, '2024-12-28', 'STR-02'),
  (19, 5,   3, '2023-11-14', 'STR-01'),
  (20, 4,   8, '2023-12-20', 'STR-02'),
  (21, 7,   9, '2025-01-06', 'STR-01'),
  (22, 10, 30, '2025-01-21', 'STR-03');
""",
    },
    # ------------------------------------------------------------------ 3/5
    {
        "title": "Customer Orders — Multi-Table Joins",
        "difficulty": "Intermediate",
        "description": """\
**Level: Intermediate — INNER JOIN, LEFT JOIN, NULL handling**

The commerce team needs a single report covering **every** registered customer,
including the ones who have never ordered anything. Those must not silently drop
out of the result — that is the point of this exercise.

### Schema
```
customers(
  id           INTEGER PRIMARY KEY,
  full_name    TEXT NOT NULL,
  country      TEXT NOT NULL,
  signed_up_at TEXT NOT NULL          -- ISO date
)

orders(
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  placed_at   TEXT NOT NULL,          -- ISO date
  status      TEXT NOT NULL           -- 'COMPLETED', 'CANCELLED', 'PENDING'
)

order_items(
  id         INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  product_name TEXT  NOT NULL,
  quantity   INTEGER NOT NULL,
  unit_price REAL    NOT NULL
)
```

### Your task
Write a **single** query returning one row per customer, summarising only their
**`COMPLETED`** orders. Cancelled and pending orders must be excluded from the
totals — but a customer whose orders are *all* cancelled still has to appear,
with zeroes.

### Required output
Return exactly these columns, with exactly these names, in this order:

| column           | meaning                                                          |
|------------------|------------------------------------------------------------------|
| `full_name`      | customer name                                                    |
| `country`        | customer country                                                 |
| `completed_orders` | number of distinct completed orders (**0** if none)            |
| `lifetime_value` | total value of their completed order items, rounded to 2 dp (**0** if none) |
| `last_order_date`| date of their most recent completed order, or `NULL` if none     |

Order by `lifetime_value` **descending**, then `full_name` **ascending**.

### Rules
- One statement only.
- Every customer in `customers` must appear in the output — exactly once.
- `completed_orders` and `lifetime_value` must be `0`, not `NULL`, for customers
  with no completed orders.
- Beware of double counting: a single order with three line items is **one**
  order, not three.

### What we are assessing
Join direction and its effect on row retention, filtering a `LEFT JOIN`ed table
without accidentally turning it into an inner join, `COUNT(DISTINCT ...)` versus
`COUNT(*)` when a join fans out, and `COALESCE` for null-safe aggregates.
""",
        "sql_schema": """\
CREATE TABLE customers (
  id           INTEGER PRIMARY KEY,
  full_name    TEXT NOT NULL,
  country      TEXT NOT NULL,
  signed_up_at TEXT NOT NULL
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  placed_at   TEXT NOT NULL,
  status      TEXT NOT NULL
);

CREATE TABLE order_items (
  id           INTEGER PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id),
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  unit_price   REAL NOT NULL
);

INSERT INTO customers (id, full_name, country, signed_up_at) VALUES
  (1, 'Aisha Rahman',    'Singapore',      '2022-01-09'),
  (2, 'Bjorn Andersen',  'Norway',         '2022-04-18'),
  (3, 'Chloe Dubois',    'France',         '2022-07-30'),
  (4, 'Diego Fernandez', 'Spain',          '2023-02-12'),
  (5, 'Emeka Obi',       'Nigeria',        '2023-05-25'),
  (6, 'Fatima Zahra',    'Morocco',        '2023-09-03'),
  (7, 'Grace Mwangi',    'Kenya',          '2024-01-14'),
  (8, 'Hiroshi Sato',    'Japan',          '2024-03-29');

INSERT INTO orders (id, customer_id, placed_at, status) VALUES
  (1,  1, '2024-01-20', 'COMPLETED'),
  (2,  1, '2024-04-02', 'COMPLETED'),
  (3,  1, '2024-06-15', 'CANCELLED'),
  (4,  2, '2024-02-11', 'COMPLETED'),
  (5,  2, '2024-08-07', 'PENDING'),
  (6,  3, '2024-03-05', 'CANCELLED'),
  (7,  3, '2024-05-19', 'CANCELLED'),
  (8,  4, '2024-02-28', 'COMPLETED'),
  (9,  4, '2024-07-16', 'COMPLETED'),
  (10, 4, '2024-11-23', 'COMPLETED'),
  (11, 5, '2024-09-09', 'COMPLETED'),
  (12, 6, '2024-10-30', 'PENDING'),
  (13, 7, '2024-12-12', 'COMPLETED');

INSERT INTO order_items (id, order_id, product_name, quantity, unit_price) VALUES
  (1,  1,  'Standing Desk',      1, 649.00),
  (2,  1,  'Desk Mat',           2,  39.50),
  (3,  2,  'Ergonomic Chair',    1, 899.00),
  (4,  3,  'Monitor Arm',        2, 129.00),
  (5,  4,  'Laptop Sleeve',      3,  45.00),
  (6,  4,  'Travel Charger',     1,  79.00),
  (7,  5,  'Wireless Keyboard',  1, 119.00),
  (8,  6,  'Bookshelf',          1, 299.00),
  (9,  7,  'Floor Lamp',         2, 159.00),
  (10, 8,  'Ergonomic Chair',    2, 899.00),
  (11, 9,  'Standing Desk',      1, 649.00),
  (12, 9,  'Cable Tray',         4,  24.99),
  (13, 10, 'Monitor Arm',        2, 129.00),
  (14, 10, 'Desk Mat',           1,  39.50),
  (15, 11, 'Laptop Sleeve',      1,  45.00),
  (16, 12, 'Footrest',           1,  69.00),
  (17, 13, 'Desk Mat',           3,  39.50);
""",
    },
    # ------------------------------------------------------------------ 4/5
    {
        "title": "Departmental Pay Bands — Window Functions",
        "difficulty": "Advanced",
        "description": """\
**Level: Advanced — window functions, PARTITION BY, ranking, running comparisons**

Compensation review time. Finance wants, for every department, the **three
highest-paid active employees**, each shown against their departmental context.

### Schema
```
staff(
  id          INTEGER PRIMARY KEY,
  full_name   TEXT    NOT NULL,
  department  TEXT    NOT NULL,
  salary      INTEGER NOT NULL,
  hire_date   TEXT    NOT NULL,   -- ISO date
  is_active   INTEGER NOT NULL    -- 1 active, 0 departed
)
```

### Your task
Write a **single** query returning the top 3 earners **within each department**,
considering **active employees only**.

Ties matter: if two people in the same department earn the same salary they must
share a rank, and that shared rank must **not** consume the next rank number
(i.e. 1, 2, 2, 3 — not 1, 2, 2, 4). A department can therefore return more than
three rows if the third place is tied.

### Required output
Return exactly these columns, with exactly these names, in this order:

| column            | meaning                                                             |
|-------------------|---------------------------------------------------------------------|
| `department`      | department name                                                     |
| `full_name`       | employee name                                                       |
| `salary`          | their salary                                                        |
| `dept_rank`       | their rank within the department (1 = highest paid), ties shared    |
| `dept_avg_salary` | average salary of **all active** staff in that department, 2 dp     |
| `pct_of_dept_top` | their salary as a % of the department's top salary, 2 dp (e.g. `82.35`) |

Order by `department` ascending, then `dept_rank` ascending, then `full_name`
ascending.

### Rules
- One statement only. A CTE (`WITH ...`) is allowed and encouraged — it is still
  one statement.
- You may not filter the rank with `WHERE dept_rank <= 3` directly in the same
  `SELECT` that defines it; window functions are not available to `WHERE` in the
  same query level. Work out where the filter belongs.
- `dept_avg_salary` is the average over **every** active employee in the
  department, not just the top three.
- Departments with fewer than three active employees simply return what they have.

### What we are assessing
`RANK()` versus `DENSE_RANK()` versus `ROW_NUMBER()` and knowing which one the
tie rule demands, `PARTITION BY`, mixing aggregate window functions with ranking
windows in one pass, and the logical evaluation order that forces the rank filter
into an outer query or CTE.
""",
        "sql_schema": """\
CREATE TABLE staff (
  id         INTEGER PRIMARY KEY,
  full_name  TEXT    NOT NULL,
  department TEXT    NOT NULL,
  salary     INTEGER NOT NULL,
  hire_date  TEXT    NOT NULL,
  is_active  INTEGER NOT NULL
);

INSERT INTO staff (id, full_name, department, salary, hire_date, is_active) VALUES
  (1,  'Priya Raman',      'Engineering', 186000, '2021-03-14', 1),
  (2,  'Daniel Okonkwo',   'Engineering', 204000, '2020-11-02', 1),
  (3,  'Mei Lin Chen',     'Engineering', 158000, '2021-07-19', 1),
  (4,  'Arjun Kapoor',     'Engineering', 158000, '2021-02-08', 1),
  (5,  'Sofia Almeida',    'Engineering', 192000, '2022-01-05', 1),
  (6,  'Tomas Nowak',      'Engineering', 131000, '2023-04-17', 1),
  (7,  'Hannah Weiss',     'Engineering', 240000, '2021-09-30', 0),
  (8,  'Kwame Mensah',     'Engineering', 104000, '2024-02-26', 1),
  (9,  'Nadia Farouk',     'Sales',       198000, '2022-03-07', 1),
  (10, 'Liam O''Sullivan', 'Sales',       142000, '2021-05-11', 1),
  (11, 'Paulo Ferreira',   'Sales',       142000, '2022-09-13', 1),
  (12, 'Zara Iqbal',       'Sales',       167000, '2023-03-21', 1),
  (13, 'Ethan Brooks',     'Marketing',   149000, '2021-10-25', 1),
  (14, 'Ingrid Larsen',    'Marketing',    98000, '2023-01-16', 1),
  (15, 'Marcus Webb',      'Marketing',   155000, '2020-06-08', 0),
  (16, 'Carlos Mendoza',   'Support',      87000, '2022-08-01', 1),
  (17, 'Amara Nwosu',      'Support',     112000, '2021-12-06', 1),
  (18, 'Sven Eriksson',    'Support',      87000, '2023-07-11', 1),
  (19, 'Leila Haddad',     'Engineering', 192000, '2021-11-29', 1),
  (20, 'Rin Nakamura',     'Support',      95000, '2024-05-02', 1);
""",
    },
    # ------------------------------------------------------------------ 5/5
    {
        "title": "Org Chart Traversal — Recursive CTEs",
        "difficulty": "Expert",
        "description": """\
**Level: Expert — recursive common table expressions, hierarchical traversal**

The company's reporting structure is stored as an adjacency list: every employee
points at their manager, and the CEO points at nobody. Leadership wants the whole
tree flattened into a readable report.

### Schema
```
org_members(
  id          INTEGER PRIMARY KEY,
  full_name   TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  manager_id  INTEGER REFERENCES org_members(id),  -- NULL for the root (CEO)
  salary      INTEGER NOT NULL
)
```
The hierarchy is arbitrarily deep — do **not** assume a fixed number of levels and
do **not** write a chain of self-joins.

### Your task
Write a **single** query that walks the tree from the root (the member whose
`manager_id` is `NULL`) down to every leaf, and returns one row per employee.

### Required output
Return exactly these columns, with exactly these names, in this order:

| column          | meaning                                                                   |
|-----------------|---------------------------------------------------------------------------|
| `id`            | employee id                                                                |
| `full_name`     | employee name                                                              |
| `title`         | job title                                                                  |
| `depth`         | distance from the root — the CEO is **0**, their direct reports **1**, etc. |
| `reporting_path`| the chain of names from the root down to this person, joined with ` > `     |
| `manager_name`  | their direct manager's name, or `NULL` for the root                        |

Example `reporting_path` for a second-level employee:
`Evelyn Shaw > Marcus Bell > Tara Singh`

Order by `depth` ascending, then `full_name` ascending.

### Rules
- One statement only — a recursive CTE is exactly one statement.
- No hardcoded depth limit, no repeated `LEFT JOIN org_members` chains.
- `depth` starts at `0`, not `1`.
- The separator in `reporting_path` is a space, a greater-than sign, and a space.

### Bonus (optional, no penalty if skipped)
Add a trailing column `team_size` — the total number of people **below** this
person anywhere in the tree (direct plus indirect reports, `0` for a leaf). If you
attempt it, it must be the last column and must not disturb the six required ones.

### What we are assessing
`WITH RECURSIVE` anchor/recursive-member structure, carrying accumulated state
(depth and path string) through the recursion, termination behaviour, and — for
the bonus — reasoning about transitive closure over a hierarchy.
""",
        "sql_schema": """\
CREATE TABLE org_members (
  id         INTEGER PRIMARY KEY,
  full_name  TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  manager_id INTEGER REFERENCES org_members(id),
  salary     INTEGER NOT NULL
);

INSERT INTO org_members (id, full_name, title, manager_id, salary) VALUES
  (1,  'Evelyn Shaw',     'Chief Executive Officer',  NULL, 410000),
  (2,  'Marcus Bell',     'VP Engineering',           1,    295000),
  (3,  'Renata Alves',    'VP Sales',                 1,    281000),
  (4,  'Omar Siddiqui',   'VP Operations',            1,    268000),
  (5,  'Tara Singh',      'Director of Platform',     2,    232000),
  (6,  'Jonas Vogel',     'Director of Product Eng',  2,    228000),
  (7,  'Priya Raman',     'Staff Engineer',           5,    186000),
  (8,  'Tomas Nowak',     'Engineer II',              5,    131000),
  (9,  'Kwame Mensah',    'Engineer I',               7,    104000),
  (10, 'Mei Lin Chen',    'Senior Engineer',          6,    158000),
  (11, 'Rosa Delgado',    'Senior Engineer',          6,    162000),
  (12, 'Yuki Tanaka',     'Engineer II',              10,   128000),
  (13, 'Nadia Farouk',    'Sales Director',           3,    198000),
  (14, 'Liam O''Sullivan','Account Executive',        13,   142000),
  (15, 'Paulo Ferreira',  'Account Executive',        13,   142000),
  (16, 'Amara Nwosu',     'Support Lead',             4,    112000),
  (17, 'Carlos Mendoza',  'Support Engineer',         16,    87000),
  (18, 'Rin Nakamura',    'Support Engineer',         16,    95000),
  (19, 'Sven Eriksson',   'Support Engineer',         17,    87000);
""",
    },
]
