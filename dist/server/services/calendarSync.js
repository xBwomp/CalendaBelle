import { google } from 'googleapis';
export class CalendarSyncService {
    constructor(googleAuth, database, calendarManagement) {
        this.googleAuth = googleAuth;
        this.database = database;
        this.calendarManagement = calendarManagement;
    }
    async syncCalendarEvents() {
        try {
            console.log('Starting calendar sync...');
            // Update sync status to in_progress
            await this.database.saveSyncStatus({
                last_sync: new Date().toISOString(),
                status: 'in_progress',
                events_synced: 0
            });
            const user = await this.database.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
            // Check if token needs refresh
            const now = Date.now();
            if (user.expires_at <= now) {
                console.log('Access token expired, refreshing...');
                await this.refreshUserToken(user);
            }
            const oauth2Client = this.googleAuth.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: user.access_token,
                refresh_token: user.refresh_token
            });
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            // Get events from the next 30 days
            const timeMin = new Date();
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + (parseInt(process.env.MAX_EVENTS_DAYS || '30')));
            console.log(`Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 1000
            });
            const googleEvents = response.data.items || [];
            console.log(`Fetched ${googleEvents.length} events from Google Calendar`);
            const calendarEvents = googleEvents.map(event => this.convertGoogleEventToCalendarEvent(event));
            await this.database.saveEvents(calendarEvents);
            // Update sync status to success
            await this.database.saveSyncStatus({
                last_sync: new Date().toISOString(),
                status: 'success',
                events_synced: calendarEvents.length
            });
            console.log(`Calendar sync completed successfully. Synced ${calendarEvents.length} events.`);
            return {
                success: true,
                eventsCount: calendarEvents.length
            };
        }
        catch (error) {
            console.error('Calendar sync failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Update sync status to error
            await this.database.saveSyncStatus({
                last_sync: new Date().toISOString(),
                status: 'error',
                error_message: errorMessage,
                events_synced: 0
            });
            return {
                success: false,
                eventsCount: 0,
                error: errorMessage
            };
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
    convertGoogleEventToCalendarEvent(googleEvent) {
        const isAllDay = !googleEvent.start.dateTime;
        const startTime = googleEvent.start.dateTime || googleEvent.start.date;
        const endTime = googleEvent.end.dateTime || googleEvent.end.date;
        return {
            id: '', // Will be set by database
            google_event_id: googleEvent.id,
            title: googleEvent.summary || 'No Title',
            description: googleEvent.description,
            start_time: startTime,
            end_time: endTime,
            location: googleEvent.location,
            is_all_day: isAllDay,
            status: googleEvent.status,
            sync_timestamp: new Date().toISOString()
        };
    }
}
