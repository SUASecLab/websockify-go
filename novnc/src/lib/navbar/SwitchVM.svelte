<script>
    import { onMount } from "svelte";
    import { queryWorkspaceProperties } from "../helpers";
    import { appState } from "../stores/StateInformation";

    let button;
    let visitableVMs = [];

    onMount(async () => {
        const request = await queryWorkspaceProperties();
        visitableVMs = request.visitable ?? [];
    });

    function switchWorkspace(websocket) {
        if ($appState.connect) {
            $appState.connect(websocket);
        }
    }
</script>

<div class="btn-group" role="group">
    <button
        bind:this={button}
        class="btn btn-outline-light dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title="Switch virtual machine"
        disabled={visitableVMs.length == 0}
        ><i class="bi bi-pc-display"></i>
    </button>
    <ul class="dropdown-menu">
        {#each visitableVMs as vm}
            <li>
                <a
                    class="dropdown-item"
                    href="#top"
                    onclick={() => switchWorkspace(vm.webSocket)}
                >
                    {vm.name}
                </a>
            </li>
        {/each}
    </ul>
</div>
