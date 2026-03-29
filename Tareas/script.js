// Referencias al DOM
const projectSelect = document.getElementById('project-select');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksTbody = document.getElementById('tasks-tbody');
const counterDisplay = document.getElementById('counter-display');
const submitTasksBtn = document.getElementById('submit-tasks-btn');
const supabaseUrl = 'https://jucmbiekaobfrkvkaqpk.supabase.co';
const supabaseKey = 'sb_publishable_ZIGP_5VePuVBBw8qMJs67A_XNdya-Df';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);



// --- GUARDIÁN DE SESIÓN (PROTECCIÓN DEL DASHBOARD) ---
async function verificarSesion() {
    // Le preguntamos a Supabase si hay un token JWT válido guardado
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (!session) {
        // Si no hay sesión, expulsamos al usuario al login inmediatamente
        window.location.replace('../Login/index.html');
        return;
    }

    // Si hay sesión, personalizamos el perfil con sus datos
    // Buscamos el 'username' que guardamos al registrar, si no existe usamos la primera parte de su correo
    const userMetadata = session.user.user_metadata;
    const nombreMostrado = userMetadata.username || session.user.email.split('@')[0];
    
    // Actualizamos el nombre en el menú lateral
    const userProfileName = document.querySelector('.user-profile strong');
    if (userProfileName) {
        userProfileName.textContent = nombreMostrado;
    }
}

// Ejecutamos el guardián apenas carga el script
verificarSesion();

// --- FUNCIÓN PARA CERRAR SESIÓN ---
// Puedes agregar un botón en tu index.html con el id="btn-logout" y usar esto:
async function cerrarSesion() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.replace('../Login/index.html');
    }
}
// document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

// --- GUARDIÁN DE SESIÓN Y GESTIÓN DE PERFIL ---
async function verificarSesion() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.replace('../Login/index.html');
        return;
    }

    // Extraemos los metadatos del usuario logueado
    const userMetadata = session.user.user_metadata;
    
    // Inyectamos los datos en la barra lateral
    document.getElementById('user-name').textContent = userMetadata.full_name || 'Usuario Tarea';
    // Si por algún motivo no hay username registrado, usamos axelito004 como nombre base de sistema
    document.getElementById('user-username').textContent = '@' + (userMetadata.username || 'axelito004');
    document.getElementById('user-avatar').src = userMetadata.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=fallback';
}

// Inicializar guardián
verificarSesion();

// --- LÓGICA DEL MENÚ DE CERRAR SESIÓN ---
const profileBtn = document.getElementById('user-profile-btn');
const logoutMenu = document.getElementById('logout-menu');
const btnLogout = document.getElementById('btn-logout');

// Mostrar/Ocultar el menú al hacer clic en el perfil
profileBtn.addEventListener('click', () => {
    logoutMenu.classList.toggle('show');
});

// Cerrar el menú si hacemos clic en cualquier otra parte de la pantalla
document.addEventListener('click', (event) => {
    if (!profileBtn.contains(event.target) && !logoutMenu.contains(event.target)) {
        logoutMenu.classList.remove('show');
    }
});

// Función real para matar la sesión en Supabase
btnLogout.addEventListener('click', async () => {
    // Cambiamos el texto para que se vea que está cargando
    btnLogout.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saliendo...';
    
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.replace('../Login/index.html'); // Expulsamos al usuario de vuelta al login
    } else {
        alert("Hubo un problema al cerrar sesión.");
        btnLogout.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar Sesión';
    }
});

// Nuestra lista temporal (La cola)
let colaTareas = [];

// --- 2. CARGAR PROYECTOS EN EL SELECTOR ---
async function cargarProyectos() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: proyectos, error } = await supabaseClient
        .from('proyectos')
        .select('id, nombre')
        .eq('usuario_id', session.user.id);

    if (error) {
        console.error("Error al cargar proyectos:", error.message);
        return;
    }

    // Limpiar y llenar el dropdown
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="" disabled selected>-- Elige un proyecto --</option>';
        proyectos.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.nombre;
            projectSelect.appendChild(option);
        });
    }
}

// --- 3. AGREGAR A LA LISTA TEMPORAL (Local) ---
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
        const proyectoId = projectSelect.value;
        const proyectoNombre = projectSelect.options[projectSelect.selectedIndex].text;
        const descripcion = taskInput.value.trim();

        if (!proyectoId || !descripcion) {
            alert("⚠️ Selecciona un proyecto y escribe una tarea.");
            return;
        }

        // Agregamos al array local
        colaTareas.push({ proyectoId, proyectoNombre, descripcion });
        
        // Limpiar input y refrescar vista
        taskInput.value = '';
        actualizarTablaTemporal();
    });
}

// --- 4. DIBUJAR LA TABLA TEMPORAL ---
function actualizarTablaTemporal() {
    if (!tasksTbody) return;
    
    tasksTbody.innerHTML = '';
    
    colaTareas.forEach((t, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.proyectoNombre}</td>
            <td>${t.descripcion}</td>
            <td style="text-align: center;">
                <button class="delete-btn" onclick="quitarDeCola(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;
        tasksTbody.appendChild(row);
    });

    // Actualizar el contador (Total: X)
    if (counterDisplay) {
        counterDisplay.textContent = `Total: ${colaTareas.length}`;
    }
}

// Función para quitar de la lista si te equivocas
window.quitarDeCola = (index) => {
    colaTareas.splice(index, 1);
    actualizarTablaTemporal();
};

// --- 5. SUBIR TODO A LA NUBE (Supabase) ---
if (submitTasksBtn) {
    submitTasksBtn.addEventListener('click', async () => {
        if (colaTareas.length === 0) {
            alert("La lista está vacía.");
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        
        submitTasksBtn.disabled = true;
        submitTasksBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';

        // Preparamos el array para insertar en lote (Bulk Insert)
        const tareasParaSubir = colaTareas.map(t => ({
            usuario_id: session.user.id,
            proyecto_id: t.proyectoId,
            descripcion: t.descripcion,
            completada: false
        }));

        const { error } = await supabaseClient
            .from('tareas')
            .insert(tareasParaSubir);

        if (error) {
            alert("❌ Error al subir: " + error.message);
        } else {
            alert("✅ ¡Tareas cargadas con éxito a la base de datos!");
            colaTareas = []; // Limpiamos la cola
            actualizarTablaTemporal();
        }

        submitTasksBtn.disabled = false;
        submitTasksBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Cargar Tareas a la Base de Datos';
    });
}

// --- 6. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Sincronizar sesión (Foto y Nombre)
    verificarSesion(); 
    // Llenar el select
    cargarProyectos();
});
