<script>
    import SendKeyAlt from "./SendKeyAlt.svelte";
    import SendKeyAltGr from "./SendKeyAltGr.svelte";
    import SendKeyCtrl from "./SendKeyCtrl.svelte";
    import SendKeyEsc from "./SendKeyEsc.svelte";
    import SendKeysCtrlAltDel from "./SendKeysCtrlAltDel.svelte";
    import SendKeyTab from "./SendKeyTab.svelte";
    import SendKeyWindows from "./SendKeyWindows.svelte";

</script>
<div class="btn-group" role="group">
    <button
        class="btn btn-outline-light dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title="Send key event"
        ><i class="bi bi-keyboard"></i>
    </button>
    <ul class="dropdown-menu">
        <SendKeyCtrl />
        <SendKeyAlt />
        <SendKeyAltGr />
        <SendKeyWindows />
        <SendKeyTab />
        <SendKeyEsc />
        <SendKeysCtrlAltDel />
    </ul>
</div>
