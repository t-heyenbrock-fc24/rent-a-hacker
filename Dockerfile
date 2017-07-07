FROM debian:jessie

# Update and upgrade
RUN apt-get update && apt-get upgrade -y

# Install git, curl, supervisor
RUN apt-get install --fix-missing -y git curl supervisor

# Install nginx
RUN apt-get install -y nginx

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y nodejs && \
    apt-get install -y build-essential

# Install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6 && \
    echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.4 main" | tee /etc/apt/sources.list.d/mongodb-org-3.4.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    mkdir -p /data/db

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Setup nginx
COPY setup /usr/src/app/setup
RUN bash setup/setup_nginx.sh && \
    rm setup/setup_nginx.sh

# Setup mongodb
RUN bash setup/setup_mongo.sh && \
    rm -r setup

# Install app dependencies
COPY app/package.json /usr/src/app/
RUN npm install

# Copy app
COPY app /usr/src/app

# Setup flag-files
COPY flags/get_flag /usr/bin/
RUN \
    chown root:root /usr/bin/get_flag  && \
    chmod 111 /usr/bin/get_flag  && \
    chmod u+s /usr/bin/get_flag

# setup supervisord
RUN mkdir -p /var/log/supervisor
COPY setup/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord"]
