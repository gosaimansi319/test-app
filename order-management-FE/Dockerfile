FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_BASE_URL=
ENV VITE_BASE_URL=${VITE_BASE_URL}

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

RUN npm run build

FROM nginx:1.27-alpine
<<<<<<< HEAD
COPY nginx.conf /etc/nginx/conf.d/default.conf
=======


COPY nginx.conf /etc/nginx/conf.d/default.conf


>>>>>>> 3814f6a (updated files)
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
