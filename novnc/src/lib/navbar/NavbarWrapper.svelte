<script>
    import "bootstrap-icons/font/bootstrap-icons.css";
    import SwitchDarkModeLightModeButton from "./SwitchDarkModeLightModeButton.svelte";
    import SendKeyEventsDropdown from "../sendKeyEvents/SendKeyEventsDropdown.svelte";
    import ToggleFullscreenButton from "./ToggleFullscreenButton.svelte";
    import RestartButton from "./RestartButton.svelte";
    import SwitchVM from "./SwitchVM.svelte";
</script>

<!-- Navbar wrapper -->

<div class="navbar-wrapper">
    <nav class="navbar bg-primary justify-content-center">
        <div class="navbar-content">
            <div
                class="btn-group"
                role="group"
                aria-label="Navigation bar button group"
            >
                <SwitchDarkModeLightModeButton />
                <SendKeyEventsDropdown />
                <ToggleFullscreenButton />
                <SwitchVM />
                <RestartButton />
            </div>
        </div>
    </nav>
</div>
