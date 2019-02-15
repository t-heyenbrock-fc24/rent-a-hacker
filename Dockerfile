FROM debian:jessie

# Update and upgrade
RUN apt-get update && apt-get upgrade -y

# Install curl, supervisor, nginx
RUN apt-get install --fix-missing -y curl supervisor nginx

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
  apt-get install -y nodejs build-essential

# Install mongodb
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4 && \
  echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list && \
  apt-get update && \
  apt-get install -y mongodb-org && \
  mkdir -p /data/db

# Install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install yarn

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Setup nginx and mongodb
COPY setup /usr/src/app/setup
RUN bash setup/setup_nginx.sh && \
  bash setup/setup_mongo.sh && \
  rm -r setup

# Install app dependencies
COPY app/package.json app/yarn.lock /usr/src/app/
RUN yarn

# Copy app
COPY app /usr/src/app

# Setup flag executable
COPY flags/get_flag /usr/bin/
RUN \
  chown root:root /usr/bin/get_flag && \
  chmod 111 /usr/bin/get_flag && \
  chmod u+s /usr/bin/get_flag

# Setup supervisord
RUN mkdir -p /var/log/supervisor
COPY setup/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord"]
