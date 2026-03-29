// Referencias de los paneles
const btnSI = document.getElementById("btn-sign--in");
const btnUP = document.getElementById("btn-sign--up");
const container = document.getElementById("main-container");

// Referencias de Recuperar Contraseña
const showForgotBtn = document.getElementById("show-forgot-password");
const showLoginBtn = document.getElementById("show-login");
const formLogin = document.getElementById("form-login");
const formRecover = document.getElementById("form-recover");

// Animación de Deslizamiento (Register <-> Login)
btnSI.addEventListener("click", () => {
    container.classList.remove("toggle");
});

btnUP.addEventListener("click", () => {
    container.classList.add("toggle");
});

// Intercambiar formularios (Login <-> Recuperar)
showForgotBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Evita que la página salte
    formLogin.style.display = "none";
    formRecover.style.display = "flex";
});

showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    formRecover.style.display = "none";
    formLogin.style.display = "flex";
});

// Evitar que los formularios recarguen la página al dar enter (Preparación para Supabase)
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Iniciando sesión...");
    // Aquí pondremos la lógica de Supabase
});

document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Registrando usuario...");
    // Aquí pondremos la lógica de Supabase
});

// --- 1. CONFIGURACIÓN DE SUPABASE ---
// IMPORTANTE: Reemplaza con tus credenciales de Supabase
const supabaseUrl = 'https://jucmbiekaobfrkvkaqpk.supabase.co';
const supabaseKey = 'sb_publishable_ZIGP_5VePuVBBw8qMJs67A_XNdya-Df';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Referencias visuales (Animaciones)


// Animaciones de paneles
btnSI.addEventListener("click", () => container.classList.remove("toggle"));
btnUP.addEventListener("click", () => container.classList.add("toggle"));
showForgotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    formLogin.style.display = "none";
    formRecover.style.display = "flex";
});
showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    formRecover.style.display = "none";
    formLogin.style.display = "flex";
});

// --- 2. LÓGICA DE REGISTRO ---
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const btn = document.getElementById('btn-register');
    btn.textContent = "Registrando...";
    btn.disabled = true;

    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const nombre = document.getElementById('reg-nombre').value;
    const usuario = document.getElementById('reg-usuario').value;

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: nombre, username: usuario }
        }
    });

    btn.textContent = "Registrarte";
    btn.disabled = false;

    if (error) {
        alert("Error al registrar: " + error.message);
    } else {
        alert("¡Registro exitoso! Ya puedes iniciar sesión.");
        
        // ¡ESTA ES LA LÍNEA NUEVA QUE LIMPIA LAS CELDAS!
        document.getElementById('form-register').reset(); 
        
        container.classList.remove("toggle"); 
    }
});

// --- 3. LÓGICA DE INICIO DE SESIÓN ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-login');
    btn.textContent = "Verificando...";
    btn.disabled = true;

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    btn.textContent = "Ingresar";
    btn.disabled = false;

    if (error) {
        // Ahora sí te avisará si la contraseña está mal o si falta confirmar el correo
        alert("Atención: " + error.message); 
    } else {
        console.log("Login exitoso, redirigiendo..."); // Para que lo veas en la consola F12
        document.getElementById('form-login').reset(); // Limpiamos las celdas por si acaso
        
        // Redirigimos al dashboard
        window.location.href = '../Dashboard/index.html'; 
    }
});

// --- 4. LOGIN CON GOOGLE ---
document.getElementById('btn-google-login').addEventListener('click', async () => {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/index.html' // A dónde ir tras loguearse
        }
    });
    if (error) alert("Error con Google: " + error.message);
});

// --- 5. RECUPERAR CONTRASEÑA ---
document.getElementById('form-recover').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recover-email').value;
    
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password.html',
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Se ha enviado un enlace de recuperación a tu correo.");
    }
});