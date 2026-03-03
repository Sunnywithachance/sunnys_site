# Serve a static site using nginx
FROM nginx:alpine

# Copy your static files into nginx web root
COPY . /usr/share/nginx/html

# Optional: if your site is in a subfolder like /dist, use:
# COPY dist/ /usr/share/nginx/html

EXPOSE 80
