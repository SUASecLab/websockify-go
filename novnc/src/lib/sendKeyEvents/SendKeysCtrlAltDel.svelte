<script>
    import { appState } from "../stores/StateInformation";

    function click() {
        $appState.rfb.sendCtrlAltDel();
    }
</script>

<li>
    <a
        onclick={() => click()}
        class="dropdown-item"
        href="#top"
        id="btn-ctrl+alt+del">Ctrl+Alt+Del</a
    >
</li>
