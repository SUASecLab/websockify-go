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
	// Handed over as parameters
	configurationFile *string
	tcpSocket         *string
	webRoot           *string

	// Set during initialization
	conf       Configuration
	httpSocket string

	// Read from environment
	jwtKey     string
	sidecarUrl string
)

// Initialize the websockify service: parse flags handed over
func init() {
	path, err := os.Getwd()
	if err != nil {
		log.Fatalf("Could net get current working directory: %s", err)
	}

	// Read configuration file if present
	configurationFile = flag.String("f", "", "configuration file")

	// Read port of VNC server to forward if present
	tcpSocket = flag.String("t", "127.0.0.1:5900", "tcp service address")

	// Read web root folder if present
	webRoot = flag.String("web", path, "web root folder")

	// Set socket HTTP server should listen to
	httpPort := flag.Int("l", 6080, "http service port")
	setHttpSocket(httpPort)
}

// Update socket HTTP server should listen to (requires port)
func setHttpSocket(httpPort *int) {
	httpSocket = ":" + strconv.Itoa(*httpPort)
}

// Add cache control header to http handler
func addHeaders(fs http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")

		fs.ServeHTTP(w, r)
	}
}

// Main (entry) function
func main() {
	// Parse flags -> calls init function
	flag.Parse()
	log.SetFlags(0)

	// Read sidecar url and jwt key
	sidecarUrl = os.Getenv("SIDECAR_URL")
	if len(sidecarUrl) == 0 {
		log.Println("No sidecar URL provided")
	}

	jwtKey = os.Getenv("JWT_KEY")
	if len(jwtKey) == 0 {
		log.Println("No JWT key provided")
	}

	// Get current directory
	path, err := os.Getwd()
	if err != nil {
		log.Fatalln(err)
	}

	// Read configuration file if present
	if len(*configurationFile) > 0 {
		// Read configuration file
		conf = readConfigurationFile(*configurationFile)

		// Set socket and web root
		setHttpSocket(&conf.HttpPort)
		*webRoot = conf.WebRoot

		// Iterate over forwardings and serve web sockets
		for _, forwarding := range conf.Forwardings {
			log.Printf("Serving WS of %s at %s", forwarding.TcpSocket, forwarding.WebSocket)
			handler := &tcpHandler{
				tcpSocket: forwarding.TcpSocket,
			}
			http.Handle("/"+forwarding.WebSocket, handler)
		}
	} else {
		// Otherwise serve default websocket at default path /websockify with the read tcp and HTTP socket
		log.Printf("Serving WS of %s at %s/websockify", *tcpSocket, httpSocket)
		handler := &tcpHandler{
			tcpSocket: *tcpSocket,
		}
		http.Handle("/websockify", handler)
	}

	// Serve webroot if specified
	if *webRoot != path && len(*webRoot) > 0 {
		log.Printf("Serving %s at %s", *webRoot, httpSocket)

		// serve files with added header
		// see https://dev.to/mecode4food/serving-static-files-with-custom-headers-using-golang-426h
		fs := http.FileServer(http.Dir(*webRoot))
		http.Handle("/", addHeaders(fs))
	}

	// Register action handlers for VM actions
	http.HandleFunc("/action", actionHandler)
	http.HandleFunc("/actionQuery", actionQuery)

	// Start HTTP server
	log.Fatal(http.ListenAndServe(httpSocket, nil))
}
