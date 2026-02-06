<script>
    import { appState } from "../stores/StateInformation";
    // @ts-ignore
    import KeyTable from "@novnc/novnc";

    var button;
    function click() {
        $appState.rfb.sendKey(KeyTable.XK_Tab, "Tab");
    }
</script>

<li>
    <a
        bind:this={button}
        onclick={() => click()}
        class="dropdown-item"
        href="#top"
        id="btn-tab">Tab</a
    >
</li>
