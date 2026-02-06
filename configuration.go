package main

import (
	"encoding/json"
	"log"
	"os"
)

/*
type Forwarding struct {
	TcpSocket  string   `json:"tcpSocket"`
	WebSocket  string   `json:"webSocket"`
	Name       string   `json:"name"`
	Operations []string `json:"operations"`
	OtherVMs   []string `json:"otherVMs"`
}*/

type VM struct {
	TcpSocket string `json:"tcpSocket"`
	WebSocket string `json:"webSocket"`
	Name      string `json:"name"`
}

type Forwarding struct {
	DefaultVM      VM       `json:"defaultVM"`
	VisitableVMs   []VM     `json:"visitableVMs"`
	RestartableVMs []string `json:"restartableVMs"`
}

type Configuration struct {
	HttpPort    int          `json:"httpPort"`
	WebRoot     string       `json:"webRoot"`
	Forwardings []Forwarding `json:"forwardings"`
}

// Transform VM conf to public conf
func getPublicConf(vm VM) PublicVM {
	return PublicVM{
		WebSocket: vm.WebSocket,
		Name:      vm.Name,
	}
}

type PublicVM struct {
	WebSocket string `json:"webSocket"`
	Name      string `json:"name"`
}

// Read a configuration file into a configuration struct
func readConfigurationFile(path string) Configuration {
	content, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("Can not read configuration file %s: %s",
			path, err)
		os.Exit(1)
	}

	if !json.Valid(content) {
		log.Fatalf("The JSON of %s is invalid", path)
		os.Exit(1)
	}

	var configuration Configuration
	err = json.Unmarshal(content, &configuration)
	if err != nil {
		log.Fatalf("Can not read JSON from %s: %s",
			path, err)
	}
	return configuration
}
