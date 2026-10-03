import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const alice = "00000000-0000-0000-0000-000000000001",
  bob = "00000000-0000-0000-0000-000000000002";
test("SQL migration enforces real PostgreSQL ownership and constraints", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610030001_initial.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      `insert into auth.users values('${alice}','{"name":"Alice"}'),('${bob}','{"name":"Bob"}');`,
    );
    const ac = (
      await db.query(
        `select id from categories where user_id=$1 order by name`,
        [alice],
      )
    ).rows[0].id;
    const bc = (
      await db.query(
        `select id from categories where user_id=$1 order by name`,
        [bob],
      )
    ).rows[0].id;
    const tx = (
      await db.query(
        `insert into transactions(user_id,description,amount_cents,type,category_id,date) values($1,'Alice only',100,'expense',$2,'2026-10-03') returning id`,
        [alice, ac],
      )
    ).rows[0].id;
    const goal = (
      await db.query(
        `insert into goals(user_id,title,target_cents) values($1,'Alice goal',1000) returning id`,
        [alice],
      )
    ).rows[0].id;
    const budget = (
      await db.query(
        `insert into budgets(user_id,category_id,month,limit_cents) values($1,$2,'2026-10',1000) returning id`,
        [alice, ac],
      )
    ).rows[0].id;
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${bob}',false);`,
    );
    for (const table of [
      "transactions",
      "categories",
      "goals",
      "budgets",
      "settings",
    ]) {
      assert.equal(
        (await db.query(`select * from ${table} where user_id=$1`, [alice]))
          .rows.length,
        0,
        `${table} hides other account`,
      );
      assert.equal(
        (
          await db
            .query(`delete from ${table} where user_id=$1 returning *`, [alice])
            .catch((e) => {
              if (table === "settings") return { rows: [] };
              throw e;
            })
        ).rows.length,
        0,
        `${table} cannot delete others`,
      );
    }
    assert.equal(
      (
        await db.query(
          `update transactions set description='attack' where id=$1 returning *`,
          [tx],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `update goals set title='attack' where id=$1 returning *`,
          [goal],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `update budgets set limit_cents=20 where id=$1 returning *`,
          [budget],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `update categories set name='attack' where id=$1 returning *`,
          [ac],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          `update settings set name='attack' where user_id=$1 returning *`,
          [alice],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into transactions(user_id,description,amount_cents,type,category_id,date) values($1,'spoof',100,'income',$2,'2026-10-03')`,
        [alice, ac],
      ),
    );
    await assert.rejects(
      db.query(`insert into categories(user_id,name) values($1,'spoof')`, [
        alice,
      ]),
    );
    await assert.rejects(
      db.query(
        `insert into goals(user_id,title,target_cents) values($1,'spoof',100)`,
        [alice],
      ),
    );
    await assert.rejects(
      db.query(
        `insert into budgets(user_id,category_id,month,limit_cents) values($1,$2,'2026-10',100)`,
        [alice, ac],
      ),
    );
    await assert.rejects(
      db.query(`insert into settings(user_id) values($1)`, [alice]),
    );
    // Ownership-aware composite foreign keys reject attaching Bob's data to Alice's category.
    await assert.rejects(
      db.query(
        `insert into transactions(user_id,description,amount_cents,type,category_id,date) values($1,'cross category',100,'income',$2,'2026-10-03')`,
        [bob, ac],
      ),
    );
    await assert.rejects(
      db.query(
        `insert into budgets(user_id,category_id,month,limit_cents) values($1,$2,'2026-10',100)`,
        [bob, ac],
      ),
    );
    const own = (
      await db.query(
        `insert into transactions(user_id,description,amount_cents,type,category_id,date) values($1,'own',100,'income',$2,'2026-10-03') returning id`,
        [bob, bc],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          `update transactions set amount_cents=200 where id=$1 returning amount_cents`,
          [own],
        )
      ).rows[0].amount_cents,
      200,
    );
    await assert.rejects(
      db.query(
        `update transactions set user_id=$1,category_id=$2 where id=$3`,
        [alice, ac, own],
      ),
    );
    assert.equal(
      (
        await db.query(`delete from transactions where id=$1 returning id`, [
          own,
        ])
      ).rows.length,
      1,
    );
    const ownCategory = (
      await db.query(
        `insert into categories(user_id,name) values($1,'Custom') returning id`,
        [bob],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          `update categories set name='Updated' where id=$1 returning id`,
          [ownCategory],
        )
      ).rows.length,
      1,
    );
    await db.query(`delete from categories where id=$1`, [ownCategory]);
    const ownGoal = (
      await db.query(
        `insert into goals(user_id,title,target_cents) values($1,'Own goal',1000) returning id`,
        [bob],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          `update goals set current_cents=500 where id=$1 returning id`,
          [ownGoal],
        )
      ).rows.length,
      1,
    );
    await db.query(`select public.add_goal_progress($1,100)`, [ownGoal]);
    await db.query(`select public.add_goal_progress($1,100)`, [ownGoal]);
    assert.equal(
      (await db.query("select current_cents from goals where id=$1", [ownGoal]))
        .rows[0].current_cents,
      700,
    );
    await assert.rejects(
      db.query("select public.add_goal_progress($1,100)", [goal]),
    );
    await assert.rejects(
      db.query("select public.add_goal_progress($1,-100)", [ownGoal]),
    );
    await db.query(`delete from goals where id=$1`, [ownGoal]);
    const ownBudget = (
      await db.query(
        `insert into budgets(user_id,category_id,month,limit_cents) values($1,$2,'2026-10',1000) returning id`,
        [bob, bc],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          `update budgets set limit_cents=500 where id=$1 returning id`,
          [ownBudget],
        )
      ).rows.length,
      1,
    );
    await db.query(`delete from budgets where id=$1`, [ownBudget]);
    assert.equal(
      (
        await db.query(
          `update settings set language='en-US' where user_id=$1 returning language`,
          [bob],
        )
      ).rows[0].language,
      "en-US",
    );
    await assert.rejects(
      db.query(
        `insert into transactions(user_id,description,amount_cents,type,category_id,date) values($1,'bad',-1,'income',$2,'2026-10-03')`,
        [bob, bc],
      ),
    );
    await db.exec("reset role; set role anon;");
    for (const table of [
      "transactions",
      "categories",
      "goals",
      "budgets",
      "settings",
    ])
      await assert.rejects(db.query(`select * from ${table}`));
  } finally {
    await db.close();
  }
});
