sudo docker rmi $(sudo docker image ls | grep "horarios_uninorte_api")
sudo docker build . -t horarios_uninorte_api:Dockerfile