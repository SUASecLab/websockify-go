FROM golang:1.24-alpine AS golang-builder

RUN addgroup -S websockify && adduser -S websockify -G websockify

WORKDIR /src/app
COPY --chown=websockify:websockify . .

RUN go get
RUN go build

FROM scratch
COPY --from=golang-builder /src/app/websockify /websockify
COPY --from=golang-builder /etc/passwd /etc/passwd

USER websockify
CMD [ "/websockify" ]
