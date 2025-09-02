import { google } from 'googleapis';
export class CalendarService {
    constructor(googleAuth, database) {
        this.googleAuth = googleAuth;
        this.database = database;
    }
    async syncCalendars(userId) {
        const user = await this.database.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const oauth2Client = this.googleAuth.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: user.access_token,
            refresh_token: user.refresh_token
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        try {
            const response = await calendar.calendarList.list();
            const calendars = response.data.items?.map(item => ({
                id: item.id,
                summary: item.summary,
                description: item.description || null,
                primary: item.primary || undefined,
                accessRole: item.accessRole
            })) || [];
            await this.database.saveCalendars(userId, calendars);
            return calendars;
        }
        catch (error) {
            if (error.code === 401) {
                // Token expired, try to refresh
                await this.refreshUserToken(user);
                return this.syncCalendars(userId);
            }
            throw error;
        }
    }
    async syncEvents(userId, calendarId) {
        const user = await this.database.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const oauth2Client = this.googleAuth.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: user.access_token,
            refresh_token: user.refresh_token
        });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        // Get events for the next 30 days
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);
        try {
            const response = await calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 1000
            });
            const events = response.data.items?.map(event => this.convertToDbEvent(event, calendarId)) || [];
            await this.database.saveEvents(calendarId, events);
        }
        catch (error) {
            if (error.code === 401) {
                // Token expired, try to refresh
                await this.refreshUserToken(user);
                return this.syncEvents(userId, calendarId);
            }
            throw error;
        }
    }
    convertToDbEvent(event, calendarId) {
        const isAllDay = !event.start?.dateTime;
        const startDateTime = event.start?.dateTime || event.start?.date;
        const endDateTime = event.end?.dateTime || event.end?.date;
        return {
            id: event.id,
            calendar_id: calendarId,
            summary: event.summary || 'No Title',
            description: event.description || null,
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            location: event.location || null,
            status: event.status || 'confirmed',
            is_all_day: isAllDay,
            created: event.created,
            updated: event.updated
        };
    }
    async refreshUserToken(user) {
        if (!user.refresh_token) {
            throw new Error('No refresh token available');
        }
        const tokens = await this.googleAuth.refreshAccessToken(user.refresh_token);
        const updatedUser = {
            ...user,
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date || Date.now() + 3600000
        };
        await this.database.saveUser(updatedUser);
    }
    async getEvents(userId, startDate, endDate) {
        const selectedCalendarId = await this.database.getSelectedCalendar(userId);
        if (!selectedCalendarId) {
            return [];
        }
        return this.database.getEvents(selectedCalendarId, startDate, endDate);
    }
}
