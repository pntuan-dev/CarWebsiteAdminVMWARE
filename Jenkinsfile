pipeline {
    agent any

    environment {
        DOCKER_USER     = 'tuanphan6511'
        APP_IMAGE       = "${DOCKER_USER}/car-admin"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        REGISTRY_CREDS  = 'dockerhub-credentials'
        DATABASE_URL    = credentials('DATABASE_URL')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${REGISTRY_CREDS}") {
                        echo "Dang build Docker Image cho Admin/BE..."
                        def appImg = docker.build(
                            "${APP_IMAGE}:${IMAGE_TAG}",
                            "--build-arg DATABASE_URL=\"${DATABASE_URL}\" -f Dockerfile ."
                        )
                        appImg.push("${IMAGE_TAG}")
                        appImg.push("latest")
                    }
                }
            }
        }

        stage('Run DB Migration') {
            steps {
                script {
                    echo "Chay Prisma db push dong bo database..."
                    sh """
                        docker run --rm \\
                            --network host \\
                            -e DATABASE_URL="\${DATABASE_URL}" \\
                            ${APP_IMAGE}:${IMAGE_TAG} \\
                            npx prisma db push --skip-generate
                    """
                }
            }
        }

        stage('Deploy Zero-Downtime') {
            steps {
                script {
                    echo "Dang deploy len Docker Swarm..."
                    sh """
                        export APP_IMAGE=${APP_IMAGE}
                        export IMAGE_TAG=${IMAGE_TAG}
                        docker stack deploy -c docker-compose.prod.yml admin_stack --with-registry-auth
                    """
                }
            }
        }

        stage('Clean Old Images') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "Deploy Admin/BE thanh cong! Build #${BUILD_NUMBER}"
        }
        failure {
            echo "Deploy Admin/BE that bai! Kiem tra lai log."
        }
    }
}
