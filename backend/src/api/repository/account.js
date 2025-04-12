import { query } from "./index.js";

export const selectAccountByEmail = async (email) => {
  const rows = await query(`
    SELECT * FROM account WHERE email = $1`,
    [email]
  );
  return rows[0];
}

export const selectAccountEmail = async (accountId) => {
  return await query(`
    SELECT email FROM account WHERE account_id = $1`,
    [accountId]
  );
}

export const insertAccount = async (email, passwordHash) => {
  const result = await query(`
    INSERT INTO account (email, password_hash) VALUES ($1, $2) RETURNING account_id`,
    [email, passwordHash]
  );
  return result[0].account_id;
}



