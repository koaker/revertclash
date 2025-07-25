FROM node:lts-alpine

RUN apk add --no-cache git

WORKDIR /app

RUN git clone https://github.com/spocel/revertclash.git .

RUN npm install

EXPOSE 3000
EXPOSE 3001

CMD ["npm", "run", "start"]
