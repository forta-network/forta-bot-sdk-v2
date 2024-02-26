FROM node:20-alpine
ENV FORTA_ENV=production
# Uncomment the following line to enable agent logging
# LABEL "network.forta.settings.agent-logs.enable"="true"
WORKDIR /app
COPY ./src ./src
COPY package*.json ./
COPY LICENSE.md ./
RUN npm ci --production
CMD [ "npm", "run", "start:prod" ]