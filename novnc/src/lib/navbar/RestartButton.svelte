<script>
    import { appState } from "../stores/StateInformation";
</script>

<button
    type="button"
    class="btn btn-outline-warning"
    data-bs-toggle="modal"
    data-bs-target="#restartModal"
    title="Restart virtual machine"
    disabled={!$appState.restartEnabled}
    ><i class="bi bi-arrow-clockwise"></i></button
>
