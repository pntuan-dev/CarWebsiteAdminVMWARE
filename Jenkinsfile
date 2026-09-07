pipeline {
    agent any

    environment {
        DOCKER_USER     = 'tuanphan6511'
        APP_IMAGE       = "${DOCKER_USER}/car-admin"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        REGISTRY_CREDS  = 'dockerhub-credentials'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    echo "Chuan bi file cau hinh moi truong Production cho VPS..."
                    sh """
                        if [ -f env.production ]; then
                            cp env.production .env
                            echo "Da copy env.production -> .env thanh cong."
                        elif [ -f env.pro ]; then
                            cp env.pro .env
                            echo "Fallback: Da copy env.pro -> .env (nen tao env.production thay the)."
                        elif [ -f .env.pro ]; then
                            cp .env.pro .env
                            echo "Fallback: Da copy .env.pro -> .env."
                        else
                            echo "CANH BAO: Khong tim thay file env.production, env.pro hay .env.pro!"
                            exit 1
                        fi
                    """
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${REGISTRY_CREDS}") {
                        echo "Dang build Docker Image cho Admin/BE..."
                        def appImg = docker.build("${APP_IMAGE}:${IMAGE_TAG}", "-f Dockerfile .")
                        appImg.push("${IMAGE_TAG}")
                        appImg.push("latest")
                    }
                }
            }
            post {
                success {
                    echo "Build Admin/BE thanh cong! Xoa sach Docker build cache de tiet kiem dung luong o cung..."
                    sh 'docker builder prune -a -f'
                }
                failure {
                    echo "Build Admin/BE that bai! Giu nguyen Docker build cache de debug va tan dung lai layer."
                }
            }
        }

        stage('Run DB Migration') {
            steps {
                script {
                    echo "Kiem tra va chay dong bo database (neu co DATABASE_URL)..."
                    sh """
                        if [ -f .env ]; then
                            set -a
                            . ./.env
                            set +a
                        fi
                        if [ -n "\$DATABASE_URL" ]; then
                            echo "Dang dong bo schema Prisma voi database..."
                            docker run --rm \\
                                --network host \\
                                -e DATABASE_URL="\$DATABASE_URL" \\
                                ${APP_IMAGE}:${IMAGE_TAG} \\
                                ./node_modules/.bin/prisma db push --skip-generate || echo "Luu y: DB push co canh bao, tiep tuc deploy..."
                        else
                            echo "Khong tim thay DATABASE_URL, bo qua buoc migration."
                        fi
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
                        if [ -f .env ]; then
                            set -a
                            . ./.env
                            set +a
                        fi
                        echo "Gioi han task history cua Docker Swarm de khong luu qua nhieu container cu..."
                        docker swarm update --task-history-limit 1 2>/dev/null || true
                        echo "Kiem tra va tao mang overlay vinfast_net neu chua co..."
                        docker network inspect vinfast_net >/dev/null 2>&1 || docker network create --driver overlay --attachable vinfast_net
                        docker stack deploy -c docker-compose.prod.yml admin_stack --with-registry-auth
                    """
                }
            }
        }

        stage('Clean Old Containers & Images') {
            steps {
                script {
                    echo "Don dep container va image cu tranh tran bo nho..."
                    sh """
                        echo "1. Xoa container cu da tat (Exited)..."
                        docker container prune -f

                        echo "2. Xoa cac image dangling khong dung..."
                        docker image prune -f
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deploy Admin/BE thanh cong! Build #${BUILD_NUMBER}"
            sh 'docker container prune -f && docker image prune -f'
        }
        failure {
            echo "Deploy Admin/BE that bai! Kiem tra lai log."
        }
    }
}
