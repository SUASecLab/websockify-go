<script>
    import { appState } from "../stores/StateInformation";
    // @ts-ignore
    import KeyTable from "@novnc/novnc";

    var button;

    function click() {
        if (button && button.classList.contains("active")) {
            $appState.rfb.sendKey(KeyTable.XK_Alt_L, "AltLeft", true);
        } else {
            $appState.rfb.sendKey(KeyTable.XK_Alt_L, "AltLeft", false);
        }
    }
</script>

<li>
    <a
        bind:this={button}
        onclick={() => click()}
        class="dropdown-item"
        href="#top"
        role="button"
        data-bs-toggle="button"
        id="btn-alt">Alt</a
    >
</li>
