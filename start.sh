cd "$(dirname "$0")"

sudo docker-compose down --remove-orphans

sudo docker network create zarathustra-intelligence_default

sudo docker image remove -f zarathustra-intelligence-backend-prod:latest
sudo docker-compose build

sudo docker-compose --profile prod up -d