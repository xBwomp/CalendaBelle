import { google } from 'googleapis';
export class CalendarManagementService {
    constructor(googleAuth, database) {
        this.googleAuth = googleAuth;
        this.database = database;
    }
    async fetchAndSaveUserCalendars() {
        try {
            console.log('Fetching user calendars from Google...');
            let user = await this.database.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
            console.log('User found:', user);
            // Check if token needs refresh
            const now = Date.now();
            if (user.expires_at <= now) {
                console.log('Access token expired, refreshing...');
                await this.refreshUserToken(user);
                user = await this.database.getUser(); // Get updated user
                if (!user) {
                    throw new Error('No authenticated user found after token refresh');
                }
                console.log('User after token refresh:', user);
            }
            const oauth2Client = this.googleAuth.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: user.access_token,
                refresh_token: user.refresh_token
            });
            console.log('OAuth2 client credentials set.');
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const response = await calendar.calendarList.list();
            const googleCalendars = response.data.items || [];
            console.log(`Fetched ${googleCalendars.length} calendars from Google`);
            console.log('Fetched calendars:', googleCalendars);
            const calendars = googleCalendars.map(cal => ({
                id: cal.id,
                summary: cal.summary || 'Untitled Calendar',
                description: cal.description || undefined,
                primary: cal.primary || false,
                accessRole: cal.accessRole || 'reader'
            }));
            // Save calendars to database
            await this.database.saveUserCalendars(user.id, calendars);
            console.log('Calendars saved to database.');
            return calendars;
        }
        catch (error) {
            console.error('Failed to fetch user calendars:', error);
            throw error;
        }
    }
    async selectUserCalendar(calendarId) {
        try {
            const user = await this.database.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
            await this.database.saveUserSettings(user.id, { selected_calendar_id: calendarId });
            console.log(`Selected calendar: ${calendarId}`);
        }
        catch (error) {
            console.error('Failed to select calendar:', error);
            throw error;
        }
    }
    async saveUserSettings(settings) {
        try {
            const user = await this.database.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
            await this.database.saveUserSettings(user.id, settings);
            console.log(`Saved user settings: ${JSON.stringify(settings)}`);
        }
        catch (error) {
            console.error('Failed to save user settings:', error);
            throw error;
        }
    }
    async getUserSettings() {
        try {
            const user = await this.database.getUser();
            if (!user) {
                return null;
            }
            return await this.database.getUserSettings(user.id);
        }
        catch (error) {
            console.error('Failed to get user settings:', error);
            return null;
        }
    }
    async refreshUserToken(user) {
        if (!user.refresh_token) {
            throw new Error('No refresh token available');
        }
        const tokens = await this.googleAuth.refreshAccessToken(user.refresh_token);
        const updatedUser = {
            ...user,
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date || Date.now() + 3600000,
            updated_at: new Date().toISOString()
        };
        await this.database.saveUser(updatedUser);
        console.log('User token refreshed successfully');
    }
}
