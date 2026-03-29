// Si el usuario ya tiene una sesión activa, lo pateamos directo al Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.replace('../Dashboard/index.html');
    }
});