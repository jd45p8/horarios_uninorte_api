sudo docker rmi $(sudo docker image ls | grep "ghorariosu_server")
sudo docker build . -t ghorariosu_server:Dockerfile