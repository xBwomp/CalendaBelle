import express from 'express';
export function createAuthRoutes(googleAuth, database) {
    const router = express.Router();
    // Initiate Google OAuth flow
    router.get('/login', (_req, res) => {
        try {
            if (!googleAuth.isReady()) {
                return res.status(503).json({
                    error: 'Google OAuth2 not configured. Please check server configuration.'
                });
            }
            const authUrl = googleAuth.getAuthUrl();
            res.redirect(authUrl);
        }
        catch (error) {
            console.error('Auth login error:', error);
            res.status(500).json({
                error: 'Failed to initiate authentication',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Handle OAuth callback
    router.get('/callback', async (req, res) => {
        try {
            const { code, error } = req.query;
            if (error) {
                console.error('OAuth error:', error);
                return res.redirect('/?error=oauth_error');
            }
            if (!code || typeof code !== 'string') {
                return res.redirect('/?error=missing_code');
            }
            // Exchange code for tokens
            const tokens = await googleAuth.getTokens(code);
            if (!tokens.access_token) {
                throw new Error('No access token received');
            }
            // Get user info
            const userInfo = await googleAuth.getUserInfo(tokens.access_token);
            // Save user to database
            const user = {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture || undefined,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || '',
                expires_at: tokens.expiry_date || Date.now() + 3600000,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            await database.saveUser(user);
            // Set session
            req.session.isAuthenticated = true;
            req.session.userId = user.id;
            console.log(`User authenticated successfully: ${user.email}`);
            res.redirect('/?auth=success');
        }
        catch (error) {
            console.error('Auth callback error:', error);
            res.redirect('/?error=auth_failed');
        }
    });
    // Check authentication status
    router.get('/status', async (req, res) => {
        try {
            if (!req.session.isAuthenticated) {
                return res.json({ authenticated: false });
            }
            const user = await database.getUser();
            if (!user) {
                req.session.isAuthenticated = false;
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
        }
        catch (error) {
            console.error('Auth status error:', error);
            res.status(500).json({ error: 'Failed to check authentication status' });
        }
    });
    // Logout
    router.post('/logout', async (req, res) => {
        try {
            // Clear database
            await database.deleteUser();
            // Clear session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                    return res.status(500).json({ error: 'Failed to logout' });
                }
                res.json({ success: true });
            });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Failed to logout' });
        }
    });
    return router;
}
