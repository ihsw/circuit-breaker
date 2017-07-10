FROM node

RUN mkdir -p /srv/app
COPY ./app /srv/app
WORKDIR /srv/app

RUN npm install -s \
  && npm run -s build

CMD ["node", "."]
