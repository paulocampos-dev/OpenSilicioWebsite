# OpenSilício - Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Prerequisites
- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ Git

### Step 1: Clone
```bash
git clone <repository-url>
cd site_react
```

### Step 2: Start Development

**Windows:**
```bash
dev-local.bat
```

**Linux/Mac:**
```bash
chmod +x dev-local.sh
./dev-local.sh
```

### Step 3: Access
- 🌐 Frontend: http://localhost:5173
- 📡 Backend: http://localhost:3001

### Step 4: Login
```
Username: AdmOpen
Password: Test123
```

---

## 🔄 Daily Workflow

### Start Working
```bash
# Windows
dev-local.bat

# Linux/Mac
./dev-local.sh
```

### Make Changes
- Edit files in `backend/src/` or `openSilicioWebsite/src/`
- Changes auto-reload (no restart needed!)

### View Logs
```bash
# Windows
type logs\backend.log

# Linux/Mac
tail -f logs/backend.log
```

### Stop Working
```bash
# Windows
stop-dev.bat

# Linux/Mac
./stop-dev.sh
```

### Restart Everything
```bash
# Windows
dev-local.bat restart

# Linux/Mac
./dev-local.sh restart
```

---

## 📊 What's Running?

| Service | Port | URL | Hot Reload |
|---------|------|-----|------------|
| Frontend (React) | 5173 | http://localhost:5173 | ✅ Yes |
| Backend (Express) | 3001 | http://localhost:3001 | ✅ Yes |
| Database (PostgreSQL) | 5432 | localhost:5432 | N/A |

---

## 🆘 Quick Fixes

### "Port already in use"
```bash
# Windows - kill process on port 3001
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### "Cannot connect to database"
```bash
# Check Docker is running
docker ps

# Restart database
docker-compose -f docker-compose.dev.yml restart
```

### "Module not found"
```bash
# Backend
cd backend
npm install

# Frontend
cd openSilicioWebsite
npm install
```

---

## 📁 Where to Edit

### Add/Edit Pages
```
openSilicioWebsite/src/pages/
```

### Add/Edit API Routes
```
backend/src/routes/
backend/src/controllers/
```

### Database Schema
```
backend/init.sql
```
(Requires restart after changes)

---

## 💡 Pro Tips

1. **Keep logs open** in a terminal: `tail -f logs/backend.log`
2. **Use restart flag** instead of manual stop/start: `./dev-local.sh restart`
3. **Check browser console** for frontend errors
4. **Check backend logs** for API errors
5. **Database changes** require full restart with DB reset:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   ./dev-local.sh restart
   ```

---

## 📚 Need More Help?

- **Detailed Guide**: [DEV_SETUP.md](DEV_SETUP.md)
- **Full README**: [README.md](README.md)
- **Troubleshooting**: See DEV_SETUP.md section

---

**Happy Coding! 🎉**

