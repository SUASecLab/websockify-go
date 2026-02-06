<script>
    // @ts-ignore
    import * as bootstrap from "bootstrap";

    import { onMount } from "svelte";
    import {
        readQueryVariable,
        status,
        StatusMessageTypes,
    } from "./helpers.js";
    import { appState } from "./stores/StateInformation";
    import { get } from "svelte/store";

    // @ts-ignore
    import RFB from "@novnc/novnc";

    export function connect(path) {
        // Connect to desktop
        status("Connecting");

        // Check if we are still connected to another session
        let oldRFB = get(appState).rfb;
        if (oldRFB) {
            oldRFB.disconnect();
        }

        // Get information
        const host = readQueryVariable("host", window.location.hostname);
        const port = readQueryVariable("port", window.location.port);
        const password = readQueryVariable("password", null);

        // Construct websocket url
        let url = new URL("https://" + host + window.location.pathname + path);
        if (window.location.protocol === "https:") {
            url.protocol = "wss:";
        } else {
            url.protocol = "ws:";
        }

        if (port) {
            url.port = port;
        }

        // Create RFB
        let screen = get(appState).screen;
        let rfb = new RFB(screen, url.href, {
            credentials: { password: password },
        });

        // Enable scaling
        rfb.scaleViewport = true;

        // Add listeners to important events from the RFB module
        // Connected to virtual machine
        rfb.addEventListener("connect", function (e) {
            status("Connected to " + get(appState).desktopName);
        });

        // Disconnected from virtual machine
        rfb.addEventListener("disconnect", function (e) {
            if (e.detail.clean) {
                if (get(appState).desktopName) {
                    status(
                        `Disconnected from ${get(appState).desktopName}`,
                        10000,
                        StatusMessageTypes.WARNING,
                    );
                } else {
                    status("Disconnected", 10000, StatusMessageTypes.WARNING);
                }
            } else {
                status(
                    "Something went wrong, connection is closed",
                    10000,
                    StatusMessageTypes.ERROR,
                );

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
            // TODO: check
            rfb.sendCredentials({ password: password });
        });

        // Received name of the virtual machine from the server
        rfb.addEventListener("desktopname", function (e) {
            appState.update((s) => ({
                ...s,
                desktopName: e.detail.name,
            }));
        });

        // Set parameters that can be changed on an active connection
        rfb.viewOnly = readQueryVariable("view_only", false);

        // Store RFB
        appState.update((s) => ({
            ...s,
            rfb: rfb,
        }));
    }

    onMount(() => {
        // Read parameters specified in the URL query string to get information about the websocket
        // By default, use the host and port of server that served this file
        const path = readQueryVariable("path", "websockify");
        connect(path);

        // Export function to store
        appState.update((s) => ({
            ...s,
            connect: connect,
        }));
    });
</script>

<div id="screen" bind:this={$appState.screen}>
    <!-- This is where the remote screen will appear -->
</div>
