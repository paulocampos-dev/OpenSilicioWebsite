# OpenSilício - Development Setup Guide

This guide explains how to run OpenSilício in development mode with hot-reloading for a better development experience.

## 🎯 Development Modes

### Mode 1: Full Docker (Original - `dev-start.bat` / `dev-start.sh`)
- **Pros**: Complete isolation, identical to production
- **Cons**: Slower, requires container restart for changes
- **Use when**: Testing full deployment, ensuring consistency

### Mode 2: Local Development (Recommended - `dev-local.bat` / `dev-local.sh`)
- **Pros**: Hot-reload, faster iteration, better DX
- **Cons**: Requires local Node.js installation
- **Use when**: Active development, frequent code changes

---

## 🚀 Quick Start - Local Development Mode

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Git

### Windows

```bash
# Start all services
dev-local.bat

# Restart all services
dev-local.bat restart

# Stop all services
stop-dev.bat
```

### Linux/Mac

```bash
# Make scripts executable (first time only)
chmod +x dev-local.sh stop-dev.sh

# Start all services
./dev-local.sh

# Restart all services
./dev-local.sh restart

# Stop all services
./stop-dev.sh
```

---

## 📋 What the Script Does

1. **Checks Docker** - Verifies Docker is running
2. **Starts Database** - Launches PostgreSQL in Docker container
3. **Installs Dependencies** - Runs `npm install` if needed
4. **Starts Backend** - Runs backend with hot-reload on port 3001
5. **Starts Frontend** - Runs frontend with hot-reload on port 5173
6. **Seeds Database** - Creates admin user and migrates data
7. **Opens Browser** - Automatically opens http://localhost:5173

---

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React + Vite app |
| Backend API | http://localhost:3001 | Express API |
| Database | localhost:5432 | PostgreSQL |

---

## 👤 Default Admin Credentials

```
Username: AdmOpen
Password: Test123
```

---

## 📊 Viewing Logs

### Backend Logs

**Windows:**
```bash
type logs\backend.log
```

**Linux/Mac:**
```bash
tail -f logs/backend.log
```

### Frontend Logs

**Linux/Mac only:**
```bash
tail -f logs/frontend.log
```

**Windows:** Frontend runs in a separate terminal window

---

## 🔧 Environment Variables

The development scripts automatically set these environment variables for the backend:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/opensilicio
JWT_SECRET=8f3c4e2d9a7b6e1f5c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3
PORT=3001
API_URL=http://localhost:3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

For production, create a `.env` file in the `backend` directory.

---

## 🐛 Troubleshooting

### Port Already in Use

If you get port conflict errors:

**Check what's using the port:**
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3001
lsof -i :5173
```

**Kill the process:**
```bash
# Windows
taskkill /F /PID <PID>

# Linux/Mac
kill -9 <PID>
```

### Database Connection Issues

1. Check if Docker is running
2. Verify database container is up:
   ```bash
   docker ps
   ```
3. Check database logs:
   ```bash
   docker logs opensilicio-db-dev
   ```
4. Restart database:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

### Backend Not Starting

1. Check if port 3001 is available
2. Verify `node_modules` is installed:
   ```bash
   cd backend
   npm install
   ```
3. Check backend logs in `logs/backend.log`

### Frontend Not Starting

1. Check if port 5173 is available
2. Verify `node_modules` is installed:
   ```bash
   cd openSilicioWebsite
   npm install
   ```
3. Clear Vite cache:
   ```bash
   cd openSilicioWebsite
   rm -rf node_modules/.vite
   npm run dev
   ```

### "Cannot find module" Errors

This usually means dependencies aren't installed:

```bash
# Backend
cd backend
npm install

# Frontend
cd openSilicioWebsite
npm install
```

---

## 📁 Project Structure

```
site_react/
├── backend/                 # Express backend
│   ├── src/                # Source code
│   ├── uploads/            # File uploads
│   └── package.json
├── openSilicioWebsite/     # React frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json
├── logs/                   # Development logs
│   ├── backend.log
│   └── frontend.log
├── docker-compose.yml      # Full Docker setup
├── docker-compose.dev.yml  # Database only
├── dev-local.bat           # Windows dev script
├── dev-local.sh            # Linux/Mac dev script
├── stop-dev.bat            # Windows stop script
└── stop-dev.sh             # Linux/Mac stop script
```

---

## 🔄 Hot Reload

Both backend and frontend support hot-reload:

- **Backend**: Uses `ts-node-dev` - automatically restarts on file changes
- **Frontend**: Uses Vite HMR - instant updates without full reload

---

## 🧪 Running Database Migrations

The scripts automatically run migrations on startup. To run manually:

```bash
cd backend

# Seed admin user
npx ts-node src/scripts/seedAdmin.ts

# Migrate data
npx ts-node src/scripts/migrateData.ts
```

---

## 🐳 Docker Commands

### Database Only (Development Mode)

```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Reset database (deletes all data!)
docker-compose -f docker-compose.dev.yml down -v
```

### Full Stack (Production Mode)

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up --build -d
```

---

## 💡 Tips

1. **Use Local Mode for Development**: Much faster iteration with hot-reload
2. **Check Logs Regularly**: Helps catch errors early
3. **Restart on Schema Changes**: Database schema changes require restart
4. **Use Git Branches**: Keep features isolated
5. **Test in Full Docker**: Before deploying, test with full Docker setup

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify Docker is running
3. Ensure ports 3001, 5173, and 5432 are available
4. Try restarting services with the `restart` flag
5. Delete `node_modules` and reinstall

---

## 📝 Making Changes

### Backend Changes
1. Edit files in `backend/src/`
2. Backend automatically restarts (watch terminal for restart confirmation)
3. Check `logs/backend.log` for errors

### Frontend Changes
1. Edit files in `openSilicioWebsite/src/`
2. Vite HMR updates browser instantly
3. Check browser console for errors

### Database Schema Changes
1. Update `backend/init.sql`
2. Restart database container:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   ./dev-local.sh restart
   ```

---

## 🎓 Learning Resources

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy coding! 🚀**

