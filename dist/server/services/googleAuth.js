import { google } from 'googleapis';
export class GoogleAuthService {
    constructor() {
        this.isConfigured = false;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
            console.warn('⚠️  Google OAuth2 environment variables not configured');
            console.warn('   Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env file');
            console.warn('   Authentication will be disabled until configured');
            // Create a dummy client to prevent crashes
            this.oauth2Client = new google.auth.OAuth2('dummy', 'dummy', 'dummy');
            this.isConfigured = false;
            return;
        }
        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        this.isConfigured = true;
        console.log('✅ Google OAuth2 configured successfully');
    }
    isReady() {
        return this.isConfigured;
    }
    getAuthUrl() {
        if (!this.isConfigured) {
            throw new Error('Google OAuth2 not configured. Please check your environment variables.');
        }
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/calendar.readonly'
        ];
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }
    async getTokens(code) {
        if (!this.isConfigured) {
            throw new Error('Google OAuth2 not configured');
        }
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }
    async getUserInfo(accessToken) {
        if (!this.isConfigured) {
            throw new Error('Google OAuth2 not configured');
        }
        this.oauth2Client.setCredentials({ access_token: accessToken });
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const { data } = await oauth2.userinfo.get();
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture
        };
    }
    async refreshAccessToken(refreshToken) {
        if (!this.isConfigured) {
            throw new Error('Google OAuth2 not configured');
        }
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials;
    }
    getOAuth2Client() {
        return this.oauth2Client;
    }
}
