<script>
    import { appState } from "./stores/StateInformation";
</script>

<div
    id="status"
    bind:this={$appState.status}
    class="p-3 m-0 border-0 bd-example m-0 border-0"
>
    <!-- Toasts appear here -->
</div>
