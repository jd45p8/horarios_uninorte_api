sudo docker run --rm -it --name="horarios_uninorte_api" --entrypoint=/bin/bash -v "$PWD"/:/root/Server.dev/ -w /root/Server.dev horarios_uninorte_api:Dockerfile
