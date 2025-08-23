# Google Calendar Kiosk Application

A TypeScript-based web application designed for Raspberry Pi kiosk displays that syncs with Google Calendar and provides offline viewing capabilities.

## Features

- **Google OAuth2 Authentication**: Secure login with Google accounts
- **Calendar Synchronization**: Sync selected Google Calendar to local SQLite database
- **5-Day Hourly View**: Clean, responsive calendar interface optimized for kiosk displays
- **Offline Support**: View cached events when internet is unavailable
- **Auto-sync**: Automatically syncs events every 15 minutes when online
- **Responsive Design**: Works on various screen sizes with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: SQLite3
- **Authentication**: Google OAuth2
- **API**: Google Calendar API

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Google Cloud Console project with Calendar API enabled

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/auth/callback`
   - Note down Client ID and Client Secret

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
   SESSION_SECRET=your_random_session_secret_here
   PORT=3001
   NODE_ENV=development
   DB_PATH=./calendar.db
   ```

### 4. Installation and Development

```bash
# Install dependencies
npm install

# Start development server (both backend and frontend)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 5. Production Build

```bash
# Build both server and client
npm run build

# Start production server
npm start
```

## Raspberry Pi Deployment

### 1. Install Node.js on Raspberry Pi

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone and Setup

```bash
git clone <your-repo-url>
cd google-calendar-kiosk
npm install
npm run build
```

### 3. Auto-start on Boot

Create a systemd service:

```bash
sudo nano /etc/systemd/system/calendar-kiosk.service
```

Add the following content:

```ini
[Unit]
Description=Google Calendar Kiosk
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/google-calendar-kiosk
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable calendar-kiosk
sudo systemctl start calendar-kiosk
```

### 4. Kiosk Mode (Optional)

For full kiosk mode, install Chromium and configure auto-start:

```bash
sudo apt-get install chromium-browser unclutter

# Add to ~/.bashrc or create autostart script
chromium-browser --kiosk --disable-infobars --disable-session-crashed-bubble http://localhost:3001
```

## Usage

1. **First Time Setup**:
   - Navigate to the application URL
   - Click "Sign in with Google"
   - Authorize the application
   - Select which calendar to display
   - Click "Continue to Calendar View"

2. **Daily Operation**:
   - Calendar automatically syncs every 15 minutes when online
   - Manual sync available via the "Sync" button
   - Works offline using cached data
   - Shows 5-day hourly view starting from today

3. **Settings**:
   - Click the settings icon to change selected calendar
   - Logout option available in the header

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate Google OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check authentication status

### Calendar
- `GET /api/calendar/calendars` - Get user's calendars
- `POST /api/calendar/calendars/sync` - Sync calendars from Google
- `POST /api/calendar/calendars/:id/select` - Select calendar to display
- `GET /api/calendar/calendars/selected` - Get selected calendar
- `POST /api/calendar/events/sync` - Sync events from Google
- `GET /api/calendar/events` - Get cached events

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses SQLite with the following tables:

- **users**: Store user authentication data
- **calendars**: Store user's Google calendars
- **events**: Store calendar events for offline access

## Troubleshooting

### Common Issues

1. **OAuth Error**: Verify Google Cloud credentials and redirect URI
2. **Database Issues**: Check file permissions for SQLite database
3. **Sync Failures**: Ensure internet connectivity and valid tokens
4. **Port Conflicts**: Change PORT in .env if 3001 is in use

### Logs

Check application logs:
```bash
# Development
npm run dev

# Production (systemd)
sudo journalctl -u calendar-kiosk -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details