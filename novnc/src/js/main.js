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
const StatusMessageTypes = Object.freeze({
    INFORMATION: 0,
    WARNING: 1,
    ERROR: 2
});

function status(text, delay = 5000, type = StatusMessageTypes.INFORMATION) {
    const element = document.getElementById('status');
    var toastElement = document.createElement("div");

    // Change background for error
    var background = "text-bg-primary";
    switch (type) {
        case StatusMessageTypes.WARNING:
            background = "text-bg-warning";
            break;
        case StatusMessageTypes.ERROR:
            background = "text-bg-danger";
            break;
        default:
            background = "text-bg-primary";
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
        if (desktopName) {
            status(`Disconnected from ${desktopName}`, 10000, StatusMessageTypes.WARNING);
        } else {
            status("Disconnected", 10000, StatusMessageTypes.WARNING);
        }
    } else {
        status("Something went wrong, connection is closed", 10000, StatusMessageTypes.ERROR);

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
rfb.addEventListener("desktopname", function (e) {
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
        "vm": path
    },
    success: function (response, status, xhr) {
        if (response) {
            try {
                let res = JSON.parse(response);
                if (res.actions.includes("restart")) {
                    // Restart possible
                    // Construct table with VM(s)
                    const tableParent = document.getElementById("modal-body-vms");

                    // Add currently used VM
                    let currentVMRow = document.createElement("tr")
                    currentVMRow.innerHTML =
                        `<td>${res.name}</td>
                        <td><button type="button" class="btn btn-danger" id="vm_restart_button">Restart</button></td>`;
                    tableParent.appendChild(currentVMRow);
                    document.getElementById("vm_restart_button").addEventListener("click", () => { restartVM(res.name, path, true); });

                    // Add other VMs
                    if (res.other) {
                        res.other.forEach(vm => {
                            let additionalVMRow = document.createElement("tr")
                            additionalVMRow.innerHTML =
                                `<td>${vm}</td>
                                <td><button type="button" class="btn btn-danger" id="vm_restart_button-${vm}">Restart</button></td>`;
                            tableParent.appendChild(additionalVMRow);
                            document.getElementById(`vm_restart_button-${vm}`).addEventListener("click", () => { restartVM(vm, path); });
                        });
                    }

                    // Show button to restart VMs
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

// VM restart function
function restartVM(vm, path, reload = false) {
    console.log("Requested restart of " + vm);
    $.ajax({
        url: "./action",
        type: "GET",
        data: {
            "token": readQueryVariable("token", ""),
            "path": path,
            "vm": vm,
            "operation": "restart"
        },
        success: function (response, s, xhr) {
            // Restarting VM
            console.log("Restarting VM");

            if (reload) {
                // Hide modal
                const restartModal = document.getElementById("restartModal");
                const modal = bootstrap.Modal.getInstance(restartModal);
                modal.hide();

                // Show large alert as restart information
                var alert = document.getElementById("alert")
                alert.style.display = "block";
                alert.innerHTML =
                    `<div class="alert alert-primary" role="alert">
                        Restarting ${vm}...
                    </div>`;

                // Hide button
                document.getElementById("restartModalButton").style.visibility = "hidden";

                // Hide RFB
                document.getElementById("screen").innerHTML = "";

                // Reload after 10s
                setTimeout(() => {
                    window.location.reload();
                }, 10000);
            } else {
                status(`Restarting ${vm}...`, 30000, StatusMessageTypes.WARNING);
            }
        },
        error: function (xhr, s, err) {
            status("Could not restart virtual machine.", 10000, StatusMessageTypes.ERROR);
        }
    });
};

// Show navbar hint
status("Hover over the blue line on top to control the virtual machine.", 20000);

// ==============================================
// Dark/light mode
// ==============================================

// Get currently stored theme
let theme = localStorage.getItem("theme");

// No or invalid theme stored
if ((theme == null) || ((theme != "light") && (theme != "dark"))) {
    theme = "dark"
    window.localStorage.setItem("theme", theme)
}

// Get theme switch button
const themeButton = document.getElementById("theme-switch");

// Enable dark mode function
function enableDarkMode() {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    window.localStorage.setItem("theme", "dark");
    themeButton.innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sun-fill" viewBox="0 0 16 16">
            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
        </svg>`;
}

// Enable light mode function
function enableLightMode() {
    document.documentElement.setAttribute("data-bs-theme", "light");
    window.localStorage.setItem("theme", "light");
    themeButton.innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon-stars-fill" viewBox="0 0 16 16">
            <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/>
            <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.73 1.73 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.73 1.73 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.73 1.73 0 0 0 1.097-1.097zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
        </svg>`;
}

// Set theme
if (theme == "dark") {
    enableDarkMode();
} else {
    enableLightMode();
}

// Change theme button
themeButton.addEventListener("click", () => {
    if (document.documentElement.getAttribute("data-bs-theme") == "light") {
        enableDarkMode();
    } else {
        enableLightMode();
    }
});
