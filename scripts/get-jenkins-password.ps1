Write-Host "Retrieving Jenkins Initial Admin Password..." -ForegroundColor Cyan
docker exec devops_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
