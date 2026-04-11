FROM nginx:alpine

# Copy the simulator HTML file to the nginx web root
COPY index.html /usr/share/nginx/html/

# Expose port 80 for the web server
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
