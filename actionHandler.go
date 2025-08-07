package main

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/SUASecLab/workadventure_admin_extensions/extensions"
	"github.com/kataras/jwt"
)

func auth(w http.ResponseWriter, r *http.Request) bool {
	// Get security token
	token := r.URL.Query().Get("token")
	token = html.EscapeString(token)

	// Check if token is valid
	validation, err := extensions.GetValidationResult("http://" + sidecarUrl +
		"/validate?token=" + token)

	if !validation.Valid || err != nil {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return false
	}

	// Check if user is allowed noVNC
	decision, err := extensions.GetAuthDecision("http://" + sidecarUrl +
		"/auth?token=" + token + "&service=noVNC")
	if !decision.Allowed || err != nil {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return false
	}
	return true
}

func actionQuery(w http.ResponseWriter, r *http.Request) {
	// Return if user is not authenticated
	if !auth(w, r) {
		return
	}

	// Get VM
	vmName := r.URL.Query().Get("vm")
	vmName = html.EscapeString(vmName)

	// Get vm from configuration
	var vmConf Forwarding
	for _, vm := range conf.Forwardings {
		if vm.WebSocket == vmName {
			vmConf = vm
			break
		}
	}

	// Send response
	r.Header.Set("Content-Type", "application/json")
	jsonData, err := json.Marshal(
		map[string]interface{}{
			"name":    vmConf.Name,
			"actions": vmConf.Operations,
			"other":   vmConf.OtherVMs,
		})

	if err != nil {
		log.Println("Could not send operation information:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	fmt.Fprintf(w, "%s", string(jsonData))
}

func actionHandler(w http.ResponseWriter, r *http.Request) {
	// Return if user is not authenticated
	if !auth(w, r) {
		return
	}

	// Get path
	path := r.URL.Query().Get("path")
	path = html.EscapeString(path)

	// get vm
	vmName := r.URL.Query().Get("vm")
	vmName = html.EscapeString(vmName)

	// Get operation
	operation := r.URL.Query().Get("operation")
	operation = html.EscapeString(operation)

	// Get vm from configuration
	var vmConf Forwarding
	for _, vm := range conf.Forwardings {
		if vm.WebSocket == path {
			vmConf = vm
			break
		}
	}

	// Check if the vm actually has that path
	if vmConf.Name != vmName && !slices.Contains(vmConf.OtherVMs, vmName) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	// Check if this vm has a name -> important for virsh restart request
	// len < 1 means the VM either does not exist or has no name property
	if len(vmName) < 1 {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Check if requested operation is allowed
	if !slices.Contains(vmConf.Operations, operation) {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return
	}

	// Generate token for websockify <-> vm-control communication
	currentTime := time.Now().Unix()
	communicationToken, err := jwt.Sign(jwt.HS256, []byte(jwtKey), map[string]interface{}{
		"vm":        vmName,
		"operation": operation,
		"iat":       currentTime,
		"nbf":       currentTime - 5,
		"exp":       currentTime + 5,
	})

	if err != nil {
		log.Println("Could not generate communication token:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	// Send request
	requestURL := fmt.Sprintf("http://%s:25000/?token=%s", strings.Split(vmConf.TcpSocket, ":")[0], string(communicationToken))
	res, err := http.Get(requestURL)
	if err != nil {
		log.Println("Could not make operation request:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	log.Println("Made operation request, code:", res.StatusCode)
	body, _ := io.ReadAll(res.Body)
	http.Error(w, string(body), res.StatusCode)
}
