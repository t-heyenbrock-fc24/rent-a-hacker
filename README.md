# rent-a-hacker

This is a simple web application that shall demonstrate security issues related with Node.js and MongoDB. The goal is not to present known or unknown vulnerabilities. It's more a reminder to programmers to think twice about your code...and to never ever trush user input!

## Installation

This project resides in a Docker container, so to get it up an running you need to have Docker installed on your machine. In case you don't, go to https://www.docker.com/ and download the latest version.

Here are all steps for building the Docker image:

```
git clone https://github.com/thomasheyenbrock/rent-a-hacker
cd rent-a-hacker
docker build -t rent-a-hacker .
docker run -p 8080:80 -d test
```

After that you can access the project at http://localhost:8080. You can of course use another port than `8080` on your local machine.

## Challenge

The goal is to capture the flag by executing `/usr/bin/get_flag` on the web-server.

There will be comming a description of how to solve this challenge soon.
