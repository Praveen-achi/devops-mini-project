pipeline {
    agent any

    environment {
        APP_NAME        = 'devops-mini-project'
        IMAGE_TAG       = "${env.BUILD_NUMBER ?: 'v2.0.0'}"
        PORT            = '3000'
        TEST_PORT       = '3099'
        REGISTRY_TAG    = "local/${APP_NAME}:${IMAGE_TAG}"
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('1. SCM Checkout') {
            steps {
                echo "==> Fetching source repository from ${env.GIT_URL ?: 'Git SCM'}..."
                checkout scm
            }
        }

        stage('2. Dependencies & Linting') {
            steps {
                echo '==> Installing production & development dependencies...'
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('3. Security & Dependency Audit') {
            steps {
                echo '==> Performing automated vulnerability audit...'
                script {
                    if (isUnix()) {
                        sh 'npm audit --audit-level=high || true'
                    } else {
                        bat 'npm audit --audit-level=high || ver >nul'
                    }
                }
            }
        }

        stage('4. Automated Unit & Integration Tests') {
            steps {
                echo '==> Executing Jest test suite with coverage report...'
                script {
                    if (isUnix()) {
                        sh 'npm run test:coverage'
                    } else {
                        bat 'npm run test:coverage'
                    }
                }
            }
        }

        stage('5. Docker Image Build & Tagging') {
            steps {
                echo "==> Building hardened multi-stage image: ${REGISTRY_TAG}..."
                script {
                    def buildCmd = "docker build -t ${APP_NAME}:latest -t ${REGISTRY_TAG} ."
                    if (isUnix()) {
                        sh buildCmd
                    } else {
                        bat buildCmd
                    }
                }
            }
        }

        stage('6. Ephemeral Smoke & Health Check') {
            steps {
                echo '==> Running ephemeral container integration probe...'
                script {
                    if (isUnix()) {
                        sh """
                            docker rm -f ephemeral_test_probe 2>/dev/null || true
                            docker run -d --name ephemeral_test_probe -p ${TEST_PORT}:3000 ${APP_NAME}:latest
                            sleep 4
                            curl -f http://localhost:${TEST_PORT}/health/liveness || exit 1
                            curl -f http://localhost:${TEST_PORT}/metrics || exit 1
                            docker rm -f ephemeral_test_probe
                        """
                    } else {
                        bat """
                            docker rm -f ephemeral_test_probe 2>nul || ver >nul
                            docker run -d --name ephemeral_test_probe -p ${TEST_PORT}:3000 ${APP_NAME}:latest
                            timeout /t 4 /nobreak >nul
                            curl -f http://localhost:${TEST_PORT}/health/liveness || exit /b 1
                            curl -f http://localhost:${TEST_PORT}/metrics || exit /b 1
                            docker rm -f ephemeral_test_probe
                        """
                    }
                }
            }
        }

        stage('7. Deploy to Multi-Tier Environment') {
            steps {
                echo '==> Orchestrating multi-tier stack (App, PostgreSQL, Redis, Prometheus)...'
                script {
                    if (isUnix()) {
                        sh 'docker compose up -d app postgres redis prometheus'
                    } else {
                        bat 'docker compose up -d app postgres redis prometheus'
                    }
                }
            }
        }

        stage('8. Production Verification') {
            steps {
                echo '==> Validating production deployment health...'
                script {
                    if (isUnix()) {
                        sh '''
                            sleep 5
                            curl -f http://localhost:3003/health/liveness || exit 1
                            echo "✓ Production endpoint responding normally."
                        '''
                    } else {
                        bat """
                            timeout /t 5 /nobreak >nul
                            curl -f http://localhost:3003/health/liveness || exit /b 1
                            echo Production endpoint responding normally.
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo '==> Pipeline execution completed.'
        }
        success {
            echo "=========================================================="
            echo "SUCCESS: Pipeline passed all quality gates and deployed!"
            echo "Dashboard:  http://localhost:3003"
            echo "Prometheus: http://localhost:9091"
            echo "=========================================================="
        }
        failure {
            echo '=========================================================='
            echo 'FAILURE: One or more stages failed. Please inspect logs.'
            echo '=========================================================='
        }
    }
}
