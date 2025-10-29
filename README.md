# Sample Scratcher - Vanilla JS App

Frontend voor Sample Scratcher die communiceert met de Next.js API backend.

## Development Setup

### Stap 1: Start de Next.js API (in een terminal)

```bash
cd /home/trespaan/Desktop/projecten/colin/next-app
npm run dev
```

De API draait nu op: `http://localhost:3000`

### Stap 2: Start de HTML app (in een andere terminal)

**Optie A: Met het meegeleverde script**
```bash
cd /home/trespaan/Desktop/projecten/colin/next-app/vanila-js-app
./dev-server.sh
```

**Optie B: Met Python direct**
```bash
cd /home/trespaan/Desktop/projecten/colin/next-app/vanila-js-app
python3 -m http.server 8080
```

**Optie C: Met Live Server (VS Code extensie)**
- Installeer "Live Server" extensie in VS Code
- Open `index.html`
- Klik rechts onderaan op "Go Live"

De HTML app draait nu op: `http://localhost:8080` (of `http://127.0.0.1:5500` voor Live Server)

### Stap 3: Open in browser

Open: `http://localhost:8080`

## Google Login Testen

1. Klik op de **Login** knop in de app
2. Klik op **"Continue with Google"**
3. Er opent een popup met Google OAuth
4. Log in met je Google account
5. Popup sluit automatisch
6. Je bent ingelogd! ✅

## Hoe het werkt

### API Configuratie

De app detecteert automatisch of het lokaal draait:

```javascript
// In index.html
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'           // Development
  : 'https://sample-scratcher-api.vercel.app'; // Production
```

### CORS

De Next.js API heeft CORS geconfigureerd voor:
- `http://localhost:8080` (dev server)
- `http://localhost:5500` (Live Server)
- `http://127.0.0.1:8080`
- `http://127.0.0.1:5500`

### Google OAuth Flow

```
User klikt "Continue with Google"
    ↓
Popup: localhost:3000/api/auth/signin?provider=google
    ↓
NextAuth redirect naar Google OAuth
    ↓
User logt in bij Google
    ↓
Google redirect terug naar API
    ↓
NextAuth maakt/vindt user in database
    ↓
Session cookie wordt gezet
    ↓
Popup sluit
    ↓
HTML app: GET /api/auth/token (met cookie)
    ↓
API geeft JWT token terug
    ↓
HTML app slaat JWT op in localStorage
    ↓
Klaar! 🎉
```

## Troubleshooting

### "CORS error"
- Zorg dat de Next.js API draait op port 3000
- Check of je HTML app draait op een toegestane port (8080 of 5500)
- Check de console: `console.log('API URL:', API_URL)`

### "Failed to fetch"
- Is de Next.js API online? Check `http://localhost:3000/api/auth/login`
- Is de HTML app op de juiste port?

### Google login werkt niet
- Check of `GOOGLE_CLIENT_ID` en `GOOGLE_CLIENT_SECRET` in `.env` staan
- Check of de redirect URI correct is in Google Console:
  - `http://localhost:3000/api/auth/callback/google`

### Popup wordt geblokkeerd
- Sta popups toe voor localhost in je browser
- Chrome: Klik op het popup icoon in de address bar

## Production Deploy

Voor productie moet je:

1. **Next.js API deployen** naar Vercel
2. **HTML app deployen** (bijv. naar Netlify, Vercel, of een CDN)
3. **Allowed origins updaten** in `middleware.ts`:
   ```typescript
   const allowedOrigins = [
     'https://jouw-html-app-domain.com',
     'https://sample-scratcher-api.vercel.app',
   ];
   ```
4. **Google OAuth redirect URI toevoegen** in Google Console:
   - `https://sample-scratcher-api.vercel.app/api/auth/callback/google`

---

**Need help?** Check `/docs/HTML_APP_GOOGLE_LOGIN.md` voor meer details.
