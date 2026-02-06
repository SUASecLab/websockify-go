<script>
    import { appState } from "../stores/StateInformation";
    // @ts-ignore
    import KeyTable from "@novnc/novnc";

    var button;
    function click() {
        if (button && button.classList.contains("active")) {
            $appState.rfb.sendKey(KeyTable.XK_Super_L, "MetaLeft", true);
        } else {
            $appState.rfb.sendKey(KeyTable.XK_Super_L, "MetaLeft", false);
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
        id="btn-windows">Windows</a
    >
</li>
