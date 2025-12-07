@echo off
echo ========================================
echo MealScout - Quick Deploy to Render
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit - Deploy MealScout"
    echo.
    echo Git repository initialized!
    echo.
) else (
    echo Git repository already exists.
    echo.
)

echo Next steps:
echo.
echo 1. Push to GitHub:
echo    git remote add origin https://github.com/TradersCorner/MealScout.git
echo    git push -u origin main
echo.
echo 2. Go to https://render.com and sign in with GitHub
echo.
echo 3. Create PostgreSQL database (Free tier)
echo.
echo 4. Create Web Service:
echo    - Connect your GitHub repo
echo    - Build Command: npm install ^&^& npm run build
echo    - Start Command: npm start
echo.
echo 5. Add Environment Variables:
echo    DATABASE_URL=^<your-postgres-url^>
echo    SESSION_SECRET=^<32-char-random-string^>
echo    NODE_ENV=production
echo    PORT=10000
echo.
echo 6. Deploy and your site will be live!
echo.
echo Full guide: See DEPLOYMENT.md
echo.
pause
