Write-Host "Starting DevOps Mini Project with Docker Compose..." -ForegroundColor Green
docker compose up -d --build

Write-Host "`nWaiting for Jenkins to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`nJenkins Initial Admin Password:" -ForegroundColor Cyan
docker exec devops_jenkins cat /var/jenkins_home/secrets/initialAdminPassword

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "Services are running:"
Write-Host " - Web App: http://localhost:3003"
Write-Host " - Jenkins: http://localhost:8083"
Write-Host "==============================================="
