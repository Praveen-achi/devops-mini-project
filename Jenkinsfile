pipeline {
    agent any

    environment {
        APP_NAME  = 'devops-mini-project'
        IMAGE_TAG = "${env.BUILD_NUMBER ?: 'v2.0.0'}"
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('1. SCM Checkout') {
            steps {
                echo '==> Checking out repository source...'
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                echo '==> Installing npm packages inside node:20-alpine container...'
                sh 'npm install'
            }
        }

        stage('3. Run Automated Tests') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                echo '==> Running automated Jest tests...'
                sh 'npm test'
            }
        }

        stage('4. Docker Build') {
            steps {
                echo "==> Building Docker image: ${APP_NAME}:${IMAGE_TAG}..."
                sh "docker build -t ${APP_NAME}:latest -t ${APP_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('5. Container Smoke Test') {
            steps {
                echo '==> Verifying container runtime and health endpoint...'
                sh """
                    docker rm -f smoke_test_container 2>/dev/null || true
                    docker run -d --name smoke_test_container ${APP_NAME}:latest
                    sleep 4
                    docker exec smoke_test_container wget -qO- http://localhost:3000/health/liveness || exit 1
                    docker rm -f smoke_test_container
                """
            }
        }

        stage('6. Deploy') {
            steps {
                echo '==> Deploying microservices stack with Docker Compose...'
                sh 'docker compose up -d app postgres redis prometheus'
            }
        }
    }

    post {
        always {
            sh 'docker rm -f smoke_test_container 2>/dev/null || true'
            echo '==> Pipeline execution finished.'
        }
        success {
            echo "=========================================================="
            echo "SUCCESS: Build #${env.BUILD_NUMBER} passed successfully!"
            echo "=========================================================="
        }
        failure {
            echo '=========================================================='
            echo 'FAILURE: Pipeline encountered errors. Check stage logs.'
            echo '=========================================================='
        }
    }
}
