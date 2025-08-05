// A Go version WebSocket to TCP socket proxy
// Copyright 2021 Michael.liu
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"strconv"
)

var (
	configurationFile *string
	conf              Configuration
	httpSocket        string
	tcpSocket         *string
	webRoot           *string

	jwtKey     string
	sidecarUrl string
)

func init() {
	path, err := os.Getwd()
	if err != nil {
		log.Printf("Could net get current working directory: %s", err)
	}

	configurationFile = flag.String("f", "", "configuration file")
	httpPort := flag.Int("l", 6080, "http service port")
	tcpSocket = flag.String("t", "127.0.0.1:5900", "tcp service address")
	webRoot = flag.String("web", path, "web root folder")

	setHttpSocket(httpPort)
}

func setHttpSocket(httpPort *int) {
	httpSocket = ":" + strconv.Itoa(*httpPort)
}

func addHeaders(fs http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")

		fs.ServeHTTP(w, r)
	}
}

func main() {
	flag.Parse()
	log.SetFlags(0)

	// read sidecar url and jwt key
	sidecarUrl = os.Getenv("SIDECAR_URL")
	jwtKey = os.Getenv("JWT_KEY")

	path, err := os.Getwd()
	if err != nil {
		log.Println(err)
	}

	if len(*configurationFile) > 0 {
		conf = readConfigurationFile(*configurationFile)
		setHttpSocket(&conf.HttpPort)
		*webRoot = conf.WebRoot

		for _, forwarding := range conf.Forwardings {
			log.Printf("Serving WS of %s at %s", forwarding.TcpSocket, forwarding.WebSocket)
			handler := &tcpHandler{
				tcpSocket: forwarding.TcpSocket,
			}
			http.Handle("/"+forwarding.WebSocket, handler)
		}
	} else {
		log.Printf("Serving WS of %s at %s/websockify", *tcpSocket, httpSocket)
		handler := &tcpHandler{
			tcpSocket: *tcpSocket,
		}
		http.Handle("/websockify", handler)
	}

	if *webRoot != path && len(*webRoot) > 0 {
		log.Printf("Serving %s at %s", *webRoot, httpSocket)

		// serve files with added header
		// see https://dev.to/mecode4food/serving-static-files-with-custom-headers-using-golang-426h
		fs := http.FileServer(http.Dir(*webRoot))
		http.Handle("/", addHeaders(fs))
	}

	// VM action handler
	http.HandleFunc("/action", actionHandler)
	http.HandleFunc("/actionQuery", actionQuery)
	log.Fatal(http.ListenAndServe(httpSocket, nil))
}
