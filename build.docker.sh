docker rmi $(sudo docker image ls | grep "horarios_uninorte_api")
docker build . -t horarios_uninorte_api:Dockerfile