<script>
    // @ts-ignore
    import * as bootstrap from "bootstrap";

    import { onMount } from "svelte";
    import {
        queryWorkspaceProperties,
        readQueryVariable,
        status,
        StatusMessageTypes,
    } from "../helpers.js";
    import { appState } from "../stores/StateInformation";

    var restartModal;
    var path;
    var res;

    async function restartVM(vm, path) {
        console.log("Requested restart of " + vm);

        // Restart VM
        try {
            const req = await fetch(
                "./performRestart?token=" +
                    readQueryVariable("token", "") +
                    "&path=" +
                    path +
                    "&vm=" +
                    vm,
            );

            // Handle error
            if (!req) {
                throw new Error("Error: did not get response from backend");
            }

            if (!req.ok) {
                throw new Error(
                    "Error: got a status code indicating an error: " +
                        req.status,
                );
            }

            // Reload page if restarted VM is the currently shown one
            if ($appState.desktopName.includes(vm)) {
                // Hide modal
                if (restartModal) {
                    const modal = bootstrap.Modal.getInstance(restartModal);
                    modal.hide();
                }

                // Show large alert and disable button
                appState.update((s) => ({
                    ...s,
                    alert: `Restarting ${vm}...`,
                    restartEnabled: false,
                }));

                // Hide RFB
                $appState.screen.innerHTML = "";

                // Reload after 10s
                setTimeout(() => {
                    window.location.reload();
                }, 10000);
            } else {
                status(
                    `Restarting ${vm}...`,
                    30000,
                    StatusMessageTypes.WARNING,
                );
            }

            console.log("Restarting VM");
        } catch (err) {
            console.log(err);
            status(
                "Could not restart virtual machine",
                15000,
                StatusMessageTypes.ERROR,
            );
        }
    }

    onMount(async () => {
        // Figure out whether we have restart permissions
        // If yes, enable the restart button
        // Also check which other VMs we are allowed to visit
        try {
            path = readQueryVariable("path", "websockify");
            res = await queryWorkspaceProperties();

            // Enable button to restart VMs
            appState.update((s) => ({
                ...s,
                restartEnabled: true,
            }));
        } catch (err) {
            // Handle error
            console.error("Error: ", err);
        }
    });
</script>

<div
    bind:this={restartModal}
    id="restartModal"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="restartModalLabel"
    aria-hidden="true"
>
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="restartModalLabel">
                    Restart virtual machine?
                </h1>
                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                ></button>
            </div>
            <div class="modal-body">
                If you restart a virtual machine, all currently unsaved work on
                it will be discarded. Make sure you saved all your data before
                restarting. Please note it might take a couple of minutes until
                all internal services offered by the virtual machine are
                available again.
            </div>
            <div class="modal-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Virtual machine</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if res && res.restartable}
                            {#each res.restartable as vm}
                                <tr>
                                    <td>{vm}</td>
                                    <td>
                                        <button
                                            type="button"
                                            class="btn btn-danger"
                                            onclick={() => restartVM(vm, path)}
                                            >Restart</button
                                        >
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-primary"
                    data-bs-dismiss="modal">Close</button
                >
            </div>
        </div>
    </div>
</div>
