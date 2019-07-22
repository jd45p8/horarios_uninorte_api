FROM ubuntu:latest
RUN apt update \
    && apt upgrade -y\
    && apt install curl build-essential -y
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt install nodejs -y
COPY ./ /root/Server
WORKDIR /root/Server
EXPOSE 8080/tcp
CMD npm i --production && npm start