<script>
    import { appState } from "../stores/StateInformation";
    // @ts-ignore
    import KeyTable from "@novnc/novnc";

    var button;
    function click() {
        if (button && button.classList.contains("active")) {
            $appState.rfb.sendKey(KeyTable.XK_Control_L, "ControlLeft", true);
        } else {
            $appState.rfb.sendKey(KeyTable.XK_Control_L, "ControlLeft", false);
        }
        $appState.rfb.focus();
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
        id="btn-ctrl">Ctrl</a
    >
</li>
