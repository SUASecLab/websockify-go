// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap’s JS
import * as bootstrap from 'bootstrap'

// Import jquery
import $ from 'jquery';

// Import noVNC
import RFB from '@novnc/novnc'
import KeyTable from '@novnc/novnc'

// Extract value of given key from GET parameters.
// If the variable is not defined, return the default variable.
function readQueryVariable(name, defaultVariable) {
    const result = new URLSearchParams(window.location.search).get(name);
    if (result == null) {
        return defaultVariable;
    }
    return result;
}

// Show a status text in a toast
function status(text, delay = 5000, error=false) {
    const element = document.getElementById('status');
    var toastElement = document.createElement("div");

    // Change background for error
    var background = "text-bg-primary";
    if (error) {
        background = "text-bg-danger";
    }
    toastElement.innerHTML =
                `<div class="toast align-items-center ${background} border-0 fade show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body h6">
                            ${text}
                        </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>`;
    element.appendChild(toastElement.firstChild);
    const toastElList = document.querySelectorAll('.toast');

    // newest element is the last one
    var toastEl = toastElList[toastElList.length - 1];
    var toast = new bootstrap.Toast(toastEl, {
        animation: true,
        autohide: true,
        delay: delay
    });
    toast.show();
}

// ==============================================
// RFB
// ==============================================

// RFB data containers: RFB object and name of the computer
let rfb;
let desktopName;

// Start to initiate connection
status("Connecting");

// Read parameters specified in the URL query string to get information about the websocket
// By default, use the host and port of server that served this file
const host = readQueryVariable('host', window.location.hostname);
const port = readQueryVariable('port', window.location.port);
const password = readQueryVariable('password');
const path = readQueryVariable('path', 'websockify');

// Construct websocket url
let url = new URL("https://" + host + window.location.pathname + path);
if (window.location.protocol === "https:") {
    url.protocol = "wss:"
} else {
    url.protocol = "ws:"
}

if (port) {
    url.port = port;
}

// Creating a new RFB to start the connection
rfb = new RFB(document.getElementById('screen'), url.href,
    { credentials: { password: password } });

// Enable scaling
rfb.scaleViewport = true;

// Add listeners to important events from the RFB module
// Connected to virtual machine
rfb.addEventListener("connect", function (e) {
    status("Connected to " + desktopName);
});

// Disconnected from virtual machine
rfb.addEventListener("disconnect", function (e) {
    if (e.detail.clean) {
        status("Disconnected");
    } else {
        status("Something went wrong, connection is closed");

        // Show error modal
        const modalWrapper = document.createElement("div");
        modalWrapper.innerHTML = `
                    <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h1 class="modal-title fs-5" id="errorModalLabel">Connection error</h1>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    Could not connect to virtual machine. Please check your connection and retry.
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>`;

        const errorModal = modalWrapper.firstElementChild;
        document.body.appendChild(errorModal);
        const modal = new bootstrap.Modal(errorModal);
        modal.show();
    }
});

// Virtual machine requires yet unknown credentials
rfb.addEventListener("credentialsrequired", function (e) {
    const password = prompt("Password required:");
    rfb.sendCredentials({ password: password });
});

// Received name of the virtual machine from the server
rfb.addEventListener("desktopname", function(e) {
    desktopName = e.detail.name;
});

// Set parameters that can be changed on an active connection
rfb.viewOnly = readQueryVariable('view_only', false);

// ==============================================
// UI functionality
// ==============================================

// Fullscreen button click
const fullscreenButton = document.getElementById("fullscreenButton");
fullscreenButton.addEventListener("click", function () {
    if (fullscreenButton.classList.contains("active")) {
        // Enable fullscreen
        const element = document.documentElement;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }

        fullscreenButton.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen-exit" viewBox="0 0 16 16">
                        <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z"/>
                    </svg>`;
    } else {
        // Disable fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        
        fullscreenButton.innerHTML =
                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16">
                        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>
                    </svg>`;
    }
});

// Send key presses
const btn_ctrl = document.getElementById("btn-ctrl");
btn_ctrl.addEventListener("click", function () {
    if (btn_ctrl.classList.contains("active")) {
        rfb.sendKey(KeyTable.XK_Control_L, "ControlLeft", true);
    } else {
        rfb.sendKey(KeyTable.XK_Control_L, "ControlLeft", false);
    }
    rfb.focus();
});

const btn_alt = document.getElementById("btn-alt");
btn_alt.addEventListener("click", function () {
    if (btn_alt.classList.contains("active")) {
        rfb.sendKey(KeyTable.XK_Alt_L, "AltLeft", true);
    } else {
        rfb.sendKey(KeyTable.XK_Alt_L, "AltLeft", false);
    }
});

const btn_altgr = document.getElementById("btn-altgr");
btn_altgr.addEventListener("click", function () {
    if (btn_altgr.classList.contains("active")) {
        rfb.sendKey(KeyTable.XK_ISO_Level3_Shift, "AltRight", true);
    } else {
        rfb.sendKey(KeyTable.XK_ISO_Level3_Shift, "AltRight", false);
    }
});

const btn_win = document.getElementById("btn-windows");
btn_win.addEventListener("click", function () {
    if (btn_win.classList.contains("active")) {
        rfb.sendKey(KeyTable.XK_Super_L, "MetaLeft", true);
    } else {
        rfb.sendKey(KeyTable.XK_Super_L, "MetaLeft", false);
    }
});

document.getElementById("btn-tab").addEventListener("click", function () {
    rfb.sendKey(KeyTable.XK_Tab, "Tab");
});

document.getElementById("btn-esc").addEventListener("click", function () {
    rfb.sendKey(KeyTable.XK_Escape, "Escape")
});

document.getElementById("btn-ctrl+alt+del").addEventListener("click", function () {
    rfb.sendCtrlAltDel();
});

// Figure out whether to show restart button
$.ajax({
    url: "./actionQuery",
    type: "GET",
    data: {
        "token": readQueryVariable("token", ""),
        "vm": readQueryVariable("path", "")
    },
    success: function (response, status, xhr) {
        if (response) {
            try {
                let res = JSON.parse(response);
                if (res.actions.includes("restart")) {
                    document.getElementById("restartModalButton").style.visibility = "visible";
                }
            } catch (err) {
                console.error("Can not parse response: " + err.message);
                console.log(response);
            }
        } else {
            console.log("Invalid response received");
        }
    },
    error: function (xhr, status, error) {
        console.error("Error:", error);
    }
});

// VM restart button
const restartButton = document.getElementById("vm_restart_button")
restartButton.addEventListener("click", function () {
    // Hide modal
    const restartModal = document.getElementById("restartModal");
    const modal = bootstrap.Modal.getInstance(restartModal);
    modal.hide();

    $.ajax({
        url: "./action",
        type: "GET",
        data: {
            "token": readQueryVariable("token", ""),
            "vm": readQueryVariable("path", ""),
            "operation": "restart"
        },
        success: function (response, status, xhr) {
            // Restarting VM
            console.log("Restarting VM");

            // Change icon of modal button
            var restartModalButton = document.getElementById("restartModalButton");
            restartModalButton.innerHTML =
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hourglass-bottom" viewBox="0 0 16 16">
                    <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5m2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702s.18.149.5.149.5-.15.5-.15v-.7c0-.701.478-1.236 1.011-1.492A3.5 3.5 0 0 0 11.5 3V2z"/>
                </svg>`;

            // Disable modal
            restartModalButton.setAttribute("data-bs-target", "");

            // Show restart information
            var alert = document.getElementById("alert")
            alert.style.display = "block";
            alert.innerHTML =
                `<div class="alert alert-primary" role="alert">
                    Restarting virtual machine...
                </div>`;

            // Hide RFB
            document.getElementById("screen").innerHTML = "";

            // Reload after 10s
            setTimeout(() => {
                window.location.reload();
            }, 10000);
        },
        error: function (xhr, s, err) {
            status("Could not restart virtual machine.", 10000, true);
        }
    });
});

// Show navbar hint
status("Hover over the blue line on top to control the virtual machine.", 20000);