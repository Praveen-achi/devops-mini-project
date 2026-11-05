# 🚀 DevOps Mini Project (Docker + Jenkins CI/CD)

A complete end-to-end DevOps mini-project demonstrating continuous integration and continuous deployment (CI/CD) with a containerized Node.js application, automated testing, Docker containerization, and a Jenkins Declarative Pipeline.

---

## 📌 Architecture & Features

- **Microservice / Web App**: Node.js Express service with interactive dashboard, `/health` endpoint, and `/api/info` endpoint.
- **Automated Testing**: Jest & Supertest unit test suite.
- **Containerization**: Optimized multi-stage `Dockerfile` with non-root security and integrated Docker health checks.
- **Orchestration**: `docker-compose.yml` to spin up both the application and a Jenkins LTS controller in isolated bridge network.
- **CI/CD Pipeline**: Declarative `Jenkinsfile` automating:
  1. Source Code Checkout
  2. Dependency Installation
  3. Automated Unit Testing
  4. Docker Image Build & Tagging
  5. Container Smoke Testing (Spin container & verify `/health`)
  6. Deployment to Docker environment

---

## 📂 Project Structure

```
C:\devops_mini_project
├── .dockerignore                 # Excludes unneeded files from Docker image
├── .gitignore                    # Excludes node_modules, logs, and artifacts from Git
├── Dockerfile                    # Multi-stage production container build
├── docker-compose.yml            # Multi-service setup (Web App + Jenkins)
├── Jenkinsfile                   # Declarative CI/CD pipeline
├── package.json                  # Dependencies and scripts
├── README.md                     # Project documentation & instructions
├── scripts/
│   ├── get-jenkins-password.ps1  # Helper to retrieve Jenkins initial password
│   └── start.ps1                 # Single command startup script
├── src/
│   └── app.js                    # Express application
└── tests/
    └── app.test.js               # Jest unit tests
```

---

## 🛠️ Quick Start

### 1. Run Locally (Node.js)

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Start the application
npm start
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

### 2. Run with Docker Compose

To start both the application and the Jenkins controller:

```powershell
docker compose up -d --build
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Jenkins Controller**: [http://localhost:8080](http://localhost:8080)

To retrieve the initial Jenkins administrator password:
```powershell
.\scripts\get-jenkins-password.ps1
# OR
docker exec devops_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## ⚙️ Configuring Jenkins Pipeline

1. Open **[http://localhost:8080](http://localhost:8080)** in your browser.
2. Enter the administrator password retrieved above and install suggested plugins.
3. Click **New Item** -> Name it `devops-mini-project` -> Choose **Pipeline** -> Click **OK**.
4. In the configuration page, scroll down to the **Pipeline** section:
   - **Definition**: Select `Pipeline script from SCM`
   - **SCM**: Select `Git`
   - **Repository URL**: Enter your Git repository URL (e.g. `https://github.com/Praveen-achi/devops-mini-project.git`)
   - **Branch Specifier**: `*/main`
   - **Script Path**: `Jenkinsfile`
5. Click **Save** and then click **Build Now**.
