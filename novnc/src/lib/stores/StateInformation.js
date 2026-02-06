import { writable } from "svelte/store";

export const appState = writable({
    rfb: null,
    desktopName: "",
    properties: null,
    restartEnabled: false,
    alert: "",
    screen: null,
    connect: null,
    status: null
});