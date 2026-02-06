<script>
    import { appState } from "./stores/StateInformation";
</script>

{#if $appState.alert.length > 0}
    <div id="alert">
        <!-- Restart alert will appear here -->
        <div class="alert alert-primary" role="alert">
            {$appState.alert}
        </div>
    </div>
{/if}
