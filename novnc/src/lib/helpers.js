// @ts-ignore
import * as bootstrap from "bootstrap";
import { get } from "svelte/store";
import { appState } from "./stores/StateInformation";


// Extract value of given key from GET parameters.
// If the variable is not defined, return the default variable.
export function readQueryVariable(name, defaultVariable) {
    const result = new URLSearchParams(window.location.search).get(name);
    if (result == null) {
        return defaultVariable;
    }
    return result;
}

export const StatusMessageTypes = {
    INFORMATION: 0,
    WARNING: 1,
    ERROR: 2
};

// Show a status message
export function status(text, delay = 5000, type = StatusMessageTypes.INFORMATION) {
    const element = get(appState).status;
    if (!element) {
        console.error("Could not get status messages container");
        return;
    }

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
    element.appendChild(toastElement);
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

export async function queryWorkspaceProperties() {
    if (get(appState).properties == null) {
        const path = readQueryVariable("path", "websockify");
        const req = await fetch(
            "./queryWorkspace?token=" +
            readQueryVariable("token", "") +
            "&path=" +
            path,
        );

        // Handle error
        if (!req) {
            console.error("Error: did not get response from backend");
            return;
        }

        let res = await req.json();
        console.log(res);

        appState.update((s) => ({
            ...s,
            properties: res,
        }));
    }

    return get(appState).properties;
}