FROM ubuntu:latest
RUN apt update \
    && apt upgrade -y\
    && apt install curl -y
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt install nodejs -y
RUN npm i
EXPOSE 8080/tcp