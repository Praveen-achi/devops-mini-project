pipeline {
    agent any

    environment {
        APP_NAME  = 'devops-mini-project'
        IMAGE_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
        PORT      = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from Git repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                // Works on both Linux and Windows Jenkins runners
                script {
                    if (isUnix()) {
                        sh 'npm install'
                    } else {
                        bat 'npm install'
                    }
                }
            }
        }

        stage('Run Unit Tests') {
            steps {
                echo 'Executing automated unit tests...'
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker image: ${APP_NAME}:${IMAGE_TAG}..."
                script {
                    if (isUnix()) {
                        sh "docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest ."
                    } else {
                        bat "docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest ."
                    }
                }
            }
        }

        stage('Container Health Check') {
            steps {
                echo 'Running smoke test on container...'
                script {
                    if (isUnix()) {
                        sh '''
                            docker rm -f devops_test_container 2>/dev/null || true
                            docker run -d --name devops_test_container -p 3001:3000 ${APP_NAME}:latest
                            sleep 5
                            curl -f http://localhost:3001/health || (docker logs devops_test_container && exit 1)
                            docker rm -f devops_test_container
                        '''
                    } else {
                        bat """
                            docker rm -f devops_test_container 2>nul || ver >nul
                            docker run -d --name devops_test_container -p 3001:3000 ${APP_NAME}:latest
                            timeout /t 5 /nobreak >nul
                            curl -f http://localhost:3001/health || exit /b 1
                            docker rm -f devops_test_container
                        """
                    }
                }
            }
        }

        stage('Deploy / Run') {
            steps {
                echo 'Deploying application with Docker...'
                script {
                    if (isUnix()) {
                        sh 'docker compose up -d web-app'
                    } else {
                        bat 'docker compose up -d web-app'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'CI/CD pipeline execution finished.'
        }
        success {
            echo 'SUCCESS: Build, test, and container deployment succeeded!'
        }
        failure {
            echo 'FAILURE: Pipeline encountered errors. Please check stage logs.'
        }
    }
}
