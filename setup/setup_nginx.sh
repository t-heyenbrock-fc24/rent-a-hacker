rm /etc/nginx/sites-available/default
echo "server {
  listen 80;

  server_name localhost;

  location / {
    proxy_pass http://localhost:8080;
  }
}" >> /etc/nginx/sites-available/default
