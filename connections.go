package main

import (
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type tcpHandler struct {
	tcpSocket string
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *tcpHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("%s: failed to upgrade to WS: %s", time.Now().Format(time.Stamp), err)
		return
	}

	vnc, err := net.Dial("tcp", h.tcpSocket)
	if err != nil {
		log.Printf("%s: failed to bind to the VNC Server: %s", time.Now().Format(time.Stamp), err)
	}

	go forwardTcp(ws, vnc)
	go forwardWeb(ws, vnc)
}

func forwardTcp(wsConn *websocket.Conn, conn net.Conn) {
	var tcpBuffer [1024]byte
	defer func() {
		if conn != nil {
			conn.Close()
		}
		if wsConn != nil {
			wsConn.Close()
		}
	}()
	for {
		if (conn == nil) || (wsConn == nil) {
			return
		}
		n, err := conn.Read(tcpBuffer[0:])
		if err != nil {
			log.Printf("%s: reading from TCP failed: %s", time.Now().Format(time.Stamp), err)
			return
		} else {
			if err := wsConn.WriteMessage(websocket.BinaryMessage, tcpBuffer[0:n]); err != nil {
				log.Printf("%s: writing to WS failed: %s", time.Now().Format(time.Stamp), err)
			}
		}
	}
}

func forwardWeb(wsConn *websocket.Conn, conn net.Conn) {
	defer func() {
		if err := recover(); err != nil {
			log.Printf("%s: reading from WS failed: %s", time.Now().Format(time.Stamp), err)
		}
		if conn != nil {
			conn.Close()
		}
		if wsConn != nil {
			wsConn.Close()
		}
	}()
	for {
		if (conn == nil) || (wsConn == nil) {
			return
		}

		_, buffer, err := wsConn.ReadMessage()
		if err == nil {
			if _, err := conn.Write(buffer); err != nil {
				log.Printf("%s: writing to TCP failed: %s", time.Now().Format(time.Stamp), err)
			}
		}
	}
}
