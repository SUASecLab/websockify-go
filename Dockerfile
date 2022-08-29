FROM golang:1.19-alpine

RUN addgroup -S websockify && adduser -S websockify -G websockify
USER websockify

WORKDIR /src/app
COPY --chown=websockify:websockify . .

RUN go get
RUN go install
