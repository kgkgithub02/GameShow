FROM node:20-bullseye-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
ENV NPM_CONFIG_OPTIONAL=true
RUN rm -f package-lock.json && npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
