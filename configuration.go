package main

import (
	"encoding/json"
	"log"
	"os"
)

type Forwarding struct {
	TcpSocket  string   `json:"tcpSocket"`
	WebSocket  string   `json:"webSocket"`
	Name       string   `json:"name"`
	Operations []string `json:"operations"`
	OtherVMs   []string `json:"otherVMs"`
}

type Configuration struct {
	HttpPort    int          `json:"httpPort"`
	WebRoot     string       `json:"webRoot"`
	Forwardings []Forwarding `json:"forwardings"`
}

func readConfigurationFile(name string) Configuration {
	content, err := os.ReadFile(name)
	if err != nil {
		log.Fatalf("Can not read configuration file %s: %s",
			name, err)
		os.Exit(1)
	}

	if !json.Valid(content) {
		log.Fatalf("The JSON of %s is invalid", name)
		os.Exit(1)
	}

	var configuration Configuration
	err = json.Unmarshal(content, &configuration)
	if err != nil {
		log.Fatalf("Can not read JSON from %s: %s",
			name, err)
	}
	return configuration
}
