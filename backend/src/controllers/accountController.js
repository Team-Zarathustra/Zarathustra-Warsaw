import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from '../api/logger/logger.js';
import { insertAccount, selectAccountByEmail } from "../api/repository/account.js";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../../config.js";

export const registerAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const accountId = await insertAccount(email, passwordHash);
s
    const accessToken = jwt.sign(
      { userId: accountId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: accountId },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      accountId,
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Error registering account: ' + error.message);
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
}

export const loginAccount = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info('Attempting login for email: ' + JSON.stringify(email));
    const account = await selectAccountByEmail(email);
    
    if (!account) {
      logger.info('Account not found for email: ' + JSON.stringify(email));
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    logger.info('Found account: ' + JSON.stringify({ ...account, password_hash: '[HIDDEN]' }));
    
    const isValidPassword = await bcrypt.compare(password, account.password_hash);
    if (!isValidPassword) {
      logger.info('Invalid password for account: ' + JSON.stringify(email));
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { userId: account.account_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: account.account_id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const ipKey = `ip_${req.ip}_${today}`;

    logger.info('Login successful for account: ' + JSON.stringify(email));
    res.json({ 
      message: 'Login successful', 
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Error logging in: ' + JSON.stringify(error));
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
}