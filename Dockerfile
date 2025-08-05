FROM golang:1.24-alpine AS golang-builder

RUN addgroup -S websockify && adduser -S websockify -G websockify

WORKDIR /src/app
COPY --chown=websockify:websockify . .

RUN go get
RUN go build

FROM node:22-alpine AS node-builder
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY novnc/package.json novnc/package-lock.json /opt/app/
RUN npm ci
COPY novnc/vite.config.js .
COPY novnc/src ./src/
RUN ["npm", "run", "build"]

FROM scratch
COPY --from=golang-builder /src/app/websockify /websockify
COPY --from=golang-builder /etc/passwd /etc/passwd
COPY --from=node-builder /opt/app/dist /web
USER websockify
CMD [ "/websockify" ]
