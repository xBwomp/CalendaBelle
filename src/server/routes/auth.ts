import express from 'express';
import { GoogleAuthService } from '../services/googleAuth.js';
import { Database } from '../database/database.js';
import { User } from '../types/index.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}
export function createAuthRoutes(googleAuth: GoogleAuthService, database: Database) {
  const router = express.Router();

  router.get('/login', (_req, res) => {
    const authUrl = googleAuth.getAuthUrl();
    res.redirect(authUrl);
  });

  router.get('/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      const tokens = await googleAuth.getTokens(code);
      const userInfo = await googleAuth.getUserInfo(tokens.access_token!);

      const user: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || '',
        expires_at: tokens.expiry_date || Date.now() + 3600000
      };

      await database.saveUser(user);
      
      // Store user ID in session
      req.session.userId = user.id;

      res.redirect('/?auth=success');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/?auth=error');
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ success: true });
    });
  });

  router.get('/status', async (req, res) => {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }

    try {
      const user = await database.getUser(req.session.userId);
      if (!user) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      });
    } catch (error) {
      console.error('Auth status error:', error);
      res.json({ authenticated: false });
    }
  });

  return router;
}