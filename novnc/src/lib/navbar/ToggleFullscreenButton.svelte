<script>
    import screenfull from "screenfull";
    import { appState } from "../stores/StateInformation";

    var button;

    function toggleFullscreen() {
        screenfull.toggle();
        let rfb = $appState.rfb;
        rfb.scaleViewport = true;
        appState.update((s) => ({
            ...s,
            rfb: rfb,
        }));

        if (button && screenfull.isFullscreen) {
            button.innerHTML = `<i class="bi bi-fullscreen"></i>`;
        } else if (button) {
            button.innerHTML = `<i class="bi bi-fullscreen-exit"></i>`;
        }
    }
</script>

<button
    bind:this={button}
    onclick={() => toggleFullscreen()}
    type="button"
    class="btn btn-outline-light"
    data-bs-toggle="button"
    id="fullscreenButton"
    title="Toggle fullscreen"
>
    <i class="bi bi-fullscreen"></i>
</button>
