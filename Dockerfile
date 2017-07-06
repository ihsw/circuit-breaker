FROM node

RUN mkdir -p /srv/app
COPY ./app /srv/app
WORKDIR /srv/app

CMD ["bash"]