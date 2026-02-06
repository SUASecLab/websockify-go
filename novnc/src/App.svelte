<script>
  // @ts-ignore
  import * as bootstrap from "bootstrap";

  import Alerts from "./lib/Alerts.svelte";
  import NavbarHoverArea from "./lib/navbar/NavbarHoverArea.svelte";
  import NavbarWrapper from "./lib/navbar/NavbarWrapper.svelte";
  import Screen from "./lib/Screen.svelte";
  import StatusToasts from "./lib/StatusToasts.svelte";
  import { onMount } from "svelte";
  import { status } from "./lib/helpers.js";
  import RestartModal from "./lib/navbar/RestartModal.svelte";
  import { appState } from "./lib/stores/StateInformation";

  onMount(() => {
    status(
      "Hover over the blue line on top to control the virtual machine.",
      20000,
    );

    // Resize listener: rescale display if present and window resized
    window.onresize = function () {
      let rfb = $appState.rfb;
      if (rfb) {
        rfb.scaleViewport = true;
        appState.update((s) => ({
          ...s,
          rfb: rfb,
        }));
      }
    };
  });
</script>

<main>
  <!-- Area that can be hovered and shows navbar if hovered -->
  <NavbarHoverArea />

  <!-- Navbar wrapper -->
  <NavbarWrapper />

  <!-- Toasts -->
  <StatusToasts />

  <!-- Restart alerts -->
  <Alerts />

  <!-- Screen -->
  <Screen />

  <!-- Restart modal-->
  <RestartModal />
</main>
