cd "$(dirname "$0")"

sudo docker image remove -f zarathustra-backend-dev:latest
sudo docker-compose build
sudo docker-compose --profile dev up --remove-orphans