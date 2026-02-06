<script>
    import { onMount } from "svelte";

    var themeButton;

    // Button click (change theme) functionality
    function switchTheme() {
        if (document.documentElement.getAttribute("data-bs-theme") == "light") {
            enableDarkMode();
        } else {
            enableLightMode();
        }
    }

    // Enable dark mode function
    function enableDarkMode() {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        window.localStorage.setItem("theme", "dark");
        themeButton.innerHTML = `<i class="bi bi-sun-fill"></i>`;
    }

    // Enable light mode function
    function enableLightMode() {
        document.documentElement.setAttribute("data-bs-theme", "light");
        window.localStorage.setItem("theme", "light");
        themeButton.innerHTML = `<i class="bi bi-moon-stars-fill"></i>`;
    }

    // Get currently stored theme
    function applyCurrentMode(currentTheme) {
        let theme = localStorage.getItem("theme");

        // No or invalid theme stored -> set to dark mode
        if (theme == null || (theme != "light" && theme != "dark")) {
            theme = "dark";
            window.localStorage.setItem("theme", theme);
        }

        // No theme change
        if (currentTheme && theme == currentTheme) {
            return theme;
        }

        // Set theme
        if (theme == "dark") {
            enableDarkMode();
        } else {
            enableLightMode();
        }

        return theme;
    }

    onMount(() => {
        // Apply selected mode
        var currentTheme = applyCurrentMode();

        // Check regularly for updates
        setInterval(() => {
            currentTheme = applyCurrentMode(currentTheme);
        }, 250);
    });
</script>

<!-- This button will get its content during onMount -->
<button
    bind:this={themeButton}
    onclick={() => switchTheme()}
    type="button"
    class="btn btn-outline-light"
    id="theme-switch"
    title="Switch between dark and light mode"
    ><i class="bi bi-hourglass-split"></i></button
>
