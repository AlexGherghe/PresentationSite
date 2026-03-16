---
title: "Query Optimizers"
date: 2026-03-16
tags: [Databases, SQL, Query Optimization]
excerpt: "How to find out what your database is actually doing when you run a query."
---

## Query What?

Relational databases are not some new invention, so I'll spare you the long justification of why slow queries are a problem. 

SQL is a declarative language. This means that you tell the database **what** data you want to retrieve, not **how** to retrieve it. If you've ever been around children for any 
amount of time, you know that telling someone what you want them to do, but not how to do it, can lead to some... how do I put it... **interesting** results. 

Before the DB engine starts executing your query, it needs to figure out two important things:
1. What you want it to do        -> This is the job of the **query parser**
2. What is the best way to do it -> This is the job of the **query optimizer**

Today, I'm gonna give you the tools to understand what the DB engine is doing when you run a query and hopefully how to fix the slow ones.

## The Setup 

Due to its popularity, I'll be using Postgres 16 for all the examples below. 

```sql
-- Let's create two tables: users and orders
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed'
);

-- Generate 100,000 dummy users
INSERT INTO users (username, email, country, created_at, status)
SELECT 
    'user_' || i, 
    'user_' || i || '@example.com',
    (ARRAY['USA', 'UK', 'Canada', 'Germany', 'France', 'Japan', 'Australia'])[floor(random() * 7 + 1)],
    NOW() - (random() * interval '1000 days'),
    CASE WHEN random() > 0.9 THEN 'inactive' ELSE 'active' END
FROM generate_series(1, 100000) as i;

-- Generate 500,000 dummy orders
INSERT INTO orders (user_id, amount, order_date, status)
SELECT 
    (random() * 99999 + 1)::INT, 
    (random() * 1000 + 10)::DECIMAL(10, 2),
    CURRENT_DATE - (random() * 1000)::INT,
    CASE 
        WHEN random() > 0.9 THEN 'pending' 
        WHEN random() > 0.8 THEN 'cancelled'
        ELSE 'completed' 
    END
FROM generate_series(1, 500000);
```

To make the numbers meaningful, the database is pre-populated with **100,000 users** and **500,000 orders**, spread across countries like USA, UK, Canada, Germany, and Japan.


## Using EXPLAIN

Postgres can show you what it's doing if you just ask it. What you need to do is prefix your query with `EXPLAIN`. 
Then it will output a tree showing what the query planner decided to do. 

So for instance if we tried

```sql
EXPLAIN 
SELECT * FROM users WHERE country = 'Canada';
```
The output will look like this:

```text
                         QUERY PLAN                          
-------------------------------------------------------------
 Seq Scan on users  (cost=0.00..2389.00 rows=14607 width=57)
   Filter: ((country)::text = 'Canada'::text)
(2 rows)
```
"Seq Scan" means that Postgres is going to go through the entire table, checking every single row and comparing the country column to 'Canada'.

The cost numbers represent the estimated cost in arbitrary units. The first number is the estimated cost to start reading the data, and the second number is the estimated cost to read all the data. These numbers are useful for comparing different query plans, but they are not a measure of time.

We can do better, let's add an index on the country column.

```sql
CREATE INDEX idx_users_country ON users(country);
```

Now if we run the query again, we will get 
```
                                      QUERY PLAN                                      
--------------------------------------------------------------------------------------
 Bitmap Heap Scan on users  (cost=165.50..1487.08 rows=14607 width=57)
   Recheck Cond: ((country)::text = 'Canada'::text)
   ->  Bitmap Index Scan on idx_users_country  (cost=0.00..161.84 rows=14607 width=0)
         Index Cond: ((country)::text = 'Canada'::text)
(4 rows)
```

This is what the query plan is telling us: 
1. It will use the index `idx_users_country` to find the rows that match the condition `country = 'Canada'`. A bitmap index scan is used to find all the rows that match the condition `country = 'Canada'`. 
2. It will then use the `Bitmap Heap Scan` to retrieve the actual rows from the table. "Recheck cond" means that it will recheck the condition `country = 'Canada'` for each row that it retrieves from the table. 

Now that we are all warmed up, let's try something more complex.
```sql
EXPLAIN SELECT u.username, u.country, o.amount 
FROM orders o 
JOIN users u ON o.user_id = u.id 
WHERE o.status = 'completed' 
ORDER BY o.amount DESC 
LIMIT 5;
```

The query plan looks as follows:

```text
 Limit  (cost=0.72..1.83 rows=5 width=22)
   ->  Nested Loop  (cost=0.72..79972.36 rows=361100 width=22)
         ->  Index Scan using idx_orders_amount on orders o  (cost=0.42..28961.86 rows=361100 width=10)
               Filter: ((status)::text = 'completed'::text)
         ->  Memoize  (cost=0.30..0.34 rows=1 width=20)
               Cache Key: o.user_id
               Cache Mode: logical
               ->  Index Scan using users_pkey on users u  (cost=0.29..0.33 rows=1 width=20)
                     Index Cond: (id = o.user_id)
```
This is what the query plan is telling us:

1. **Iteration 1 of the Nested Loop:**
    1. **Fetch an Order:** The `Nested Loop` asks its first child (the `Index Scan on orders`) for a row. 
    2. **Scan the Index:** The `Index Scan on orders` looks at the very top of `idx_orders_amount` (because it's already sorted by amount). It checks the `status`. If it's `'completed'`, it passes this single order row up to the `Nested Loop`.
    3. **Lookup the User:** The `Nested Loop` takes that order's `user_id` and hands it to its second child (the `Memoize` node).
    4. **Check the Cache:** The `Memoize` node checks its internal cache: *"Have I looked up this user recently?"* Since this is the first iteration, the cache is empty.
    5. **Fetch the User:** `Memoize` passes the user ID down to the `Index Scan on users_pkey`. This index instantly finds the user and passes their data back up. 
    6. **Save to Cache & Output:** `Memoize` saves the user in its cache for later, and passes the user data up to the `Nested Loop`. The `Nested Loop` glues the Order and the User together, creating 1 complete row. It passes this row up to the final boss: the `Limit` node.

2. **Iteration 2 of the Nested Loop:**
    1. **Fetch the Next Order:** The `Nested Loop` asks for another row. The `Index Scan on orders` simply reads the *next* largest amount from the index that is `'completed'`. It passes it up.
    2. **Lookup the User:** The `Nested Loop` takes the reading and passes the `user_id` down. What happens if this order was placed by the exact same power-user as the first order?
    3. **Cache Hit!:** The `Memoize` node checks its cache. *"Have I seen this user?"* The answer is yes, so it instantly returns the cached user data. It completely skips asking the `Index Scan on users_pkey` to search the database. 
    4. **Output:** The `Nested Loop` glues them together, passing the 2nd complete row up to the `Limit` node. 2 down, 3 to go.

This ping-pong process repeats. Because of the `LIMIT 5`, as soon as it forms its 5th row, the `Limit` node terminates the process entirely.

## Kowalski, ANALYSIS
"Explain" operates based on Postgres' internal statistics about the data. There is a parameter you can pass to it to tell it to stop guessing and actually execute the query: `ANALYZE`.

Let's see the difference. Here is the same query from earlier, but this time with `ANALYZE`:

```sql
EXPLAIN ANALYZE 
SELECT u.username, u.country, o.amount 
FROM orders o 
JOIN users u ON o.user_id = u.id 
WHERE o.status = 'completed' 
ORDER BY o.amount DESC 
LIMIT 5;
```

```text
 Limit  (cost=0.72..1.83 rows=5 width=22) (actual time=0.047..0.103 rows=5 loops=1)
   ->  Nested Loop  (cost=0.72..79972.36 rows=361100 width=22) (actual time=0.045..0.100 rows=5 loops=1)
         ->  Index Scan using idx_orders_amount on orders o  (cost=0.42..28961.86 rows=361100 width=10) (actual time=0.025..0.040 rows=5 loops=1)
               Filter: ((status)::text = 'completed'::text)
               Rows Removed by Filter: 1
         ->  Memoize  (cost=0.30..0.34 rows=1 width=20) (actual time=0.008..0.008 rows=1 loops=5)
               Cache Key: o.user_id
               Cache Mode: logical
               Hits: 0  Misses: 5  Evictions: 0  Overflows: 0  Memory Usage: 1kB
               ->  Index Scan using users_pkey on users u  (cost=0.29..0.33 rows=1 width=20) (actual time=0.005..0.005 rows=1 loops=5)
                     Index Cond: (id = o.user_id)
 Planning Time: 0.452 ms
 Execution Time: 0.138 ms
```

Notice the new information that appeared:

- **`actual time=0.047..0.103`** — The real wall-clock time (in milliseconds) for that node. The first number is the time to produce the *first* row, and the second is the time to produce *all* rows.
- **`rows=5`** (after "actual") — The real number of rows produced.
- **`loops=5`** — How many times the node was executed. 
- **`Hits: 0  Misses: 5`** — The `Memoize` node now reports its cache statistics. In this case, all 5 user lookups were unique, so nothing was cached.
- **`Rows Removed by Filter: 1`** — This tells you that 1 row was read from the index but discarded because its `status` wasn't `'completed'`. Very useful for understanding filtering efficiency.
- **`Planning Time`** and **`Execution Time`** — The total time Postgres spent choosing the plan vs. running it.

One important thing to stress about `EXPLAIN ANALYZE` is that it WILL RUN your query. This means that it can modify data. You have to be mindful if you are using it on `INSERT`, `UPDATE`, or `DELETE` statements. In those cases, you could avoid the `ANALYZE` part altogether or wrap your query in a transaction and roll back.

## Red Flags & Green Flags

Now is the time when you may ask: ok, but what do I do with all this information? 

I'll give you a cheat sheet of what you want to see and what you do not want to see. 

### Green Flags: What You Want to See

*   **`Index Only Scan`**: The absolute holy grail of database reads. This means that the query can be resolved with data from the index alone, without needing to retrieve 
data from the actual table. 
*   **`Index Scan` / `Bitmap Index Scan`**: This means your database successfully found and used an index to locate specific rows, saving it from reading the entire table.
*   **`Memoize`**: (As seen above) The database realized an inner loop is being executed repeatedly with the same values, so it built a temporary in-memory cache to speed things up.
*   **`Hash Join` / `Merge Join`**: These are the efficient strategies for joining large tables. A `Hash Join` builds a hash table from one side and probes it with the other. A `Merge Join` zips through two pre-sorted inputs side by side. If you see either of these instead of a `Nested Loop` on a big join, the optimizer is doing its job.
*   **`Index Scan Backward`**: This shows up when you `ORDER BY ... DESC` on an indexed column. Instead of scanning the index forward and then sorting the results, the database just reads the index in reverse

### Red Flags: What You DO NOT Want to See

*   **`Seq Scan` on a large table**: This is the worst thing you could see when querying a large table. Just as the name implies, the database is scanning every single row. This is really expensive and should be avoided at all costs. There is a catch here: if the table is small enough, a seq scan is fine and can even be preferred to an index scan. 
*   **`Sort` on massive amounts of data**: Sorting is expensive. If you see a `Sort` node reading millions of rows just to give you the top 10, it means you're missing an index on the column you are ordering by.
*   **`Sort` / `Hash` spilling to disk**: When using `EXPLAIN ANALYZE`, look for `Sort Method: external merge  Disk: ...` or `Batches: ... Disk Usage: ...`. This means the operation couldn't fit in memory and had to spill to disk, which is dramatically slower. You may need to increase `work_mem` or rethink the query to reduce the amount of data being sorted or hashed.

---

## Takeaways

This article is a starting point for understanding how to read query plans. 
It is by no means exhaustive, but it is not meant to be. 

What I want you to take away from here is this: 
- Maybe next time you write a non-trivial query, you'll ask your DB for the execution plan
- With this overview, you will be able to have a conversation with your AI Agent of choice about the execution plan and make informed decisions about how to optimize it. 
