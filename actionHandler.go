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

// Authenticate requests
func auth(w http.ResponseWriter, r *http.Request) bool {
	// Get security token
	token := r.URL.Query().Get("token")
	token = html.EscapeString(token)

	// Check if token is valid
	validation, err := extensions.GetValidationResult("http://" + sidecarUrl +
		"/validate?token=" + token)

	// Invalid token
	if !validation.Valid || err != nil {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return false
	}

	// Check if user is allowed to use noVNC
	decision, err := extensions.GetAuthDecision("http://" + sidecarUrl +
		"/auth?token=" + token + "&service=noVNC")

	// Not allowed
	if !decision.Allowed || err != nil {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		return false
	}

	// Valid and allowed
	return true
}

// Query the actions a user is allowed to perform on a certain VM
func queryWorkspace(w http.ResponseWriter, r *http.Request) {
	// Check token
	// Return if user is not authenticated
	if !auth(w, r) {
		return
	}

	// Get path
	path := r.URL.Query().Get("path")
	path = html.EscapeString(path)

	// Check if path has sufficient length
	if len(path) < 1 {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Get workspace from configuration
	var workspaceConfiguration *Forwarding
	for _, workspace := range conf.Forwardings {
		// Path will be the websocket of the default VM
		if workspace.DefaultVM.WebSocket == path {
			workspaceConfiguration = &workspace
			break
		}
	}

	// Check if we got a workspace configuration
	if workspaceConfiguration == nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Set up restartable VMs data structure
	var restartableVMs []string
	restartableVMs = append(restartableVMs, workspaceConfiguration.DefaultVM.Name)    // default vm
	restartableVMs = append(restartableVMs, workspaceConfiguration.RestartableVMs...) // the additional restartable ones

	// Allow restarting visitiable VMs
	for _, vm := range workspaceConfiguration.VisitableVMs {
		restartableVMs = append(restartableVMs, vm.Name)
	}

	// Setup data structure of visitable VMs
	var visitableVMs []PublicVM
	visitableVMs = append(visitableVMs, getPublicConf(workspaceConfiguration.DefaultVM)) // default vm

	// Add visitable VMs
	for _, vm := range workspaceConfiguration.VisitableVMs {
		visitableVMs = append(visitableVMs, getPublicConf(vm))
	}

	// Set up response
	r.Header.Set("Content-Type", "application/json")
	jsonData, err := json.Marshal(
		map[string]interface{}{
			"restartable": restartableVMs,
			"visitable":   visitableVMs,
		})

	// Could not convert response to JSON
	if err != nil {
		log.Println("Could not send operation information:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	// Send response
	fmt.Fprintf(w, "%s", string(jsonData))
}

// Checks if a VM with a certain name is present in a slice of VM
func vmListContainsName(vms []VM, name string) bool {
	for _, vm := range vms {
		if vm.Name == name {
			return true
		}
	}
	return false
}

func performRestart(w http.ResponseWriter, r *http.Request) {
	// Check token and permissions
	// Return if user is not authenticated
	if !auth(w, r) {
		return
	}

	// Get path (= WebSocket of default VM)
	path := r.URL.Query().Get("path")
	path = html.EscapeString(path)

	// Get VM parameter (the VM to be restarted)
	vmName := r.URL.Query().Get("vm")
	vmName = html.EscapeString(vmName)

	// Check if this vm has a name
	// -> important for our search here and the virsh restart request
	// len < 1 means the VM either does not exist or has no name property
	if len(vmName) < 1 {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Get VM fordwardings from configuration
	// (can be default VM, visitable or restartable,
	//  but the path to check against is the websocket one from the default VM)
	var workspaceConfiguration *Forwarding
	for _, workspace := range conf.Forwardings {
		if workspace.DefaultVM.WebSocket == path {
			workspaceConfiguration = &workspace
			break
		}
	}

	// Check if we got a workspace configuration
	if workspaceConfiguration == nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	// Check if the name of the VM occurs in the configuration
	if !(workspaceConfiguration.DefaultVM.Name == vmName ||
		slices.Contains(workspaceConfiguration.RestartableVMs, vmName) ||
		vmListContainsName(workspaceConfiguration.VisitableVMs, vmName)) {
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	// Generate token for websockify <-> vm-control communication
	currentTime := time.Now().Unix()
	communicationToken, err := jwt.Sign(jwt.HS256, []byte(jwtKey), map[string]interface{}{
		"vm":        vmName,
		"operation": "restart",
		"iat":       currentTime,
		"nbf":       currentTime - 5,
		"exp":       currentTime + 5,
	})

	if err != nil {
		log.Println("Could not generate communication token:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	// Send request (here we assume that all VMs that are part of a workspace are hosted on the same hypervisor)
	// Hence we take the IP address of the default vm
	requestURL := fmt.Sprintf("http://%s:25000/?token=%s",
		strings.Split(workspaceConfiguration.DefaultVM.TcpSocket, ":")[0],
		string(communicationToken))

	log.Printf("%s", "Sending restart request: "+requestURL)

	// Evaluate response
	res, err := http.Get(requestURL)

	// An error occurred -> return error
	if err != nil {
		log.Println("Could not make operation request:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	// Here we assume everything worked as expected
	log.Println("Made operation request, code:", res.StatusCode)
	body, _ := io.ReadAll(res.Body)

	// This is the success status code, but there is only the error method to report it back
	http.Error(w, string(body), res.StatusCode)
}
