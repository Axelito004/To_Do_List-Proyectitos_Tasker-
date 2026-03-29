// Referencias al DOM
const projectNameInput = document.getElementById('project-name-input');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const addProjectBtn = document.getElementById('add-project-btn');
const projectsTbody = document.getElementById('projects-table-body');
const supabaseUrl = 'https://jucmbiekaobfrkvkaqpk.supabase.co';
const supabaseKey = 'sb_publishable_ZIGP_5VePuVBBw8qMJs67A_XNdya-Df';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
// Cargar proyectos guardados en el navegador, o usar datos por defecto
let projectsList = JSON.parse(localStorage.getItem('misProyectos')) || [
    
];

// Función para formatear la fecha a DD/MM/AAAA
function formatDate(dateString) {
    if (!dateString) return "Sin definir";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}



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


// --- 2. FUNCIÓN: CARGAR TABLA DESDE SUPABASE ---
async function fetchProyectos() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: proyectos, error } = await supabaseClient
        .from('proyectos')
        .select('*')
        .eq('usuario_id', session.user.id)
        .order('creado_en', { ascending: false });

    if (error) {
        console.error("Error al obtener proyectos:", error.message);
        return;
    }

    // Blindaje contra el error de 'null'
    if (projectsTbody) {
        projectsTbody.innerHTML = ''; 

        if (proyectos.length === 0) {
            projectsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #888;">No hay proyectos registrados en la nube.</td></tr>';
            return;
        }

        proyectos.forEach(proj => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${proj.nombre}</strong></td>
                <td>${proj.fecha_inicio || '---'}</td>
                <td>${proj.fecha_fin || '---'}</td>
                <td>
                    <button class="delete-btn" onclick="eliminarProyecto(${proj.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            projectsTbody.appendChild(row);
        });
    }
}

// --- 3. FUNCIÓN: SUBIR PROYECTO A LA NUBE ---
if (addProjectBtn) {
    addProjectBtn.addEventListener('click', async () => {
        const nombre = projectNameInput.value.trim();
        const inicio = startDateInput.value;
        const fin = endDateInput.value;

        if (!nombre) {
            alert("⚠️ El nombre del proyecto es obligatorio.");
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();

        // Estado de carga en el botón
        addProjectBtn.disabled = true;
        addProjectBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const { error } = await supabaseClient
            .from('proyectos')
            .insert([{
                nombre: nombre,
                fecha_inicio: inicio,
                fecha_fin: fin,
                usuario_id: session.user.id
            }]);

        if (error) {
            alert("❌ Error al guardar: " + error.message);
        } else {
            // Limpiar inputs
            projectNameInput.value = '';
            startDateInput.value = '';
            endDateInput.value = '';
            // Refrescar tabla
            await fetchProyectos();
        }

        addProjectBtn.disabled = false;
        addProjectBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar Proyecto';
    });
}

// --- 4. FUNCIÓN: ELIMINAR PROYECTO (Global para el onclick) ---
window.eliminarProyecto = async function(id) {
    const confirmacion = confirm("¿Estás seguro de eliminar este proyecto? Se borrarán también sus tareas asociadas.");
    
    if (confirmacion) {
        const { error } = await supabaseClient
            .from('proyectos')
            .delete()
            .eq('id', id);

        if (error) {
            alert("❌ No se pudo eliminar: " + error.message);
        } else {
            console.log("✅ Proyecto eliminado de Supabase");
            fetchProyectos(); // Recargar tabla
        }
    }
};

// =====================================================================
// 4. ARRANQUE AL CARGAR
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchProyectos();
});