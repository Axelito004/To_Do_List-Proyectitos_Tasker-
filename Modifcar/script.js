// Referencias al DOM
const projectSelect = document.getElementById('edit-project-select');
const editPanel = document.getElementById('edit-panel');
const startDateInput = document.getElementById('edit-start-date');
const endDateInput = document.getElementById('edit-end-date');
const tasksContainer = document.getElementById('edit-tasks-container');
const saveBtn = document.getElementById('save-modifications-btn');
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

// =====================================================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN
// =====================================================================


let proyectoActual = null;

// =====================================================================
// 2. CARGAR EL SELECTOR DE PROYECTOS
// =====================================================================
async function cargarSelectorProyectos() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return window.location.replace('../Login/index.html');

    // Cargar perfil
    const meta = session.user.user_metadata;
    const nameEl = document.getElementById('user-name');
    const userEl = document.getElementById('user-username');
    const avatar = document.getElementById('user-avatar');
    
    if(nameEl) nameEl.textContent = meta.full_name || 'Usuario';
    if(userEl) userEl.textContent = '@' + (meta.username || 'axelito004');
    if(avatar) avatar.src = meta.avatar_url || `https://ui-avatars.com/api/?name=Usuario&background=0984e3&color=fff&bold=true`;

    const { data: proyectos, error } = await supabaseClient
        .from('proyectos')
        .select('id, nombre')
        .eq('usuario_id', session.user.id);

    if (error) return console.error("Error al cargar selector:", error);

    proyectos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nombre;
        projectSelect.appendChild(option);
    });
}

// =====================================================================
// 3. CARGAR DETALLES AL SELECCIONAR UN PROYECTO
// =====================================================================
projectSelect.addEventListener('change', async (e) => {
    const proyectoId = e.target.value;

    if (!proyectoId) {
        editPanel.style.display = 'none';
        proyectoActual = null;
        return;
    }

    editPanel.style.display = 'block'; 
    tasksContainer.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Cargando datos...</p>';

    const { data, error } = await supabaseClient
        .from('proyectos')
        .select('*, tareas (*)')
        .eq('id', proyectoId)
        .single(); 

    if (error) {
        tasksContainer.innerHTML = '<p style="color:red;">Error al cargar los datos.</p>';
        return;
    }

    proyectoActual = data;

    // Fechas
    startDateInput.value = data.fecha_inicio ? data.fecha_inicio.split('T')[0] : '';
    endDateInput.value = data.fecha_fin ? data.fecha_fin.split('T')[0] : '';

    // Dibujar Tareas con el botón de Eliminar
    tasksContainer.innerHTML = '';
    const tareas = data.tareas || [];

    if (tareas.length === 0) {
        tasksContainer.innerHTML = '<p style="color:#666; font-style:italic;">Este proyecto no tiene tareas registradas.</p>';
    } else {
        tareas.forEach((t, index) => {
            const div = document.createElement('div');
            div.style.cssText = "display: flex; gap: 10px; margin-bottom: 15px; align-items: center;";
            
            // Estructura: Número + Input de texto + Botón rojo de basura
            div.innerHTML = `
                <span style="font-weight: bold; color: #0984e3; width: 25px;">${index + 1}.</span>
                <input type="text" class="custom-input task-edit-input" data-task-id="${t.id}" value="${t.descripcion}" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                <button class="btn-delete" title="Eliminar Tarea" style="background: #e74c3c; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; transition: background 0.2s;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            
            // Lógica para el botón de eliminar de esta fila específica
            const deleteBtn = div.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => eliminarTareaUnica(t.id, div, deleteBtn));

            tasksContainer.appendChild(div);
        });
    }
});

// =====================================================================
// 4. FUNCIÓN PARA ELIMINAR UNA TAREA ESPECÍFICA (NUEVO)
// =====================================================================
async function eliminarTareaUnica(idTarea, filaHtml, boton) {
    // 1. Confirmación de seguridad (UX de Ingeniero)
    const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas eliminar esta tarea permanentemente? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    // 2. Efecto visual de carga
    boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    boton.disabled = true;

    try {
        // 3. Disparo de destrucción a Supabase
        const { error } = await supabaseClient
            .from('tareas')
            .delete()
            .eq('id', idTarea);

        if (error) throw new Error(error.message);

        // 4. Magia de Frontend: Borramos la fila de la pantalla sin tener que recargar la página
        filaHtml.remove();
        
        // Mensaje discreto
        console.log(`✅ Tarea ${idTarea} eliminada de la base de datos.`);

        // Si se borraron todas, mostramos el mensaje de vacío
        if (tasksContainer.children.length === 0) {
            tasksContainer.innerHTML = '<p style="color:#666; font-style:italic;">Has eliminado todas las tareas de este proyecto.</p>';
        }

    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("❌ No se pudo eliminar la tarea. ¿Configuraste el RLS (DELETE) en Supabase?");
        boton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        boton.disabled = false;
    }
}

// =====================================================================
// 5. GUARDAR CAMBIOS (FECHA Y NOMBRES DE TAREAS)
// =====================================================================
saveBtn.addEventListener('click', async () => {
    if (!proyectoActual) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        const nuevaFechaFin = endDateInput.value;
        const { error: errorProyecto } = await supabaseClient
            .from('proyectos')
            .update({ fecha_fin: nuevaFechaFin })
            .eq('id', proyectoActual.id);

        if (errorProyecto) throw new Error("Error fecha: " + errorProyecto.message);

        const taskInputs = document.querySelectorAll('.task-edit-input');
        
        const promesasTareas = Array.from(taskInputs).map(input => {
            const idTarea = parseInt(input.getAttribute('data-task-id'));
            const nuevoTexto = input.value.trim();

            if (idTarea && nuevoTexto) {
                return supabaseClient
                    .from('tareas')
                    .update({ descripcion: nuevoTexto })
                    .eq('id', idTarea);
            }
        });

        await Promise.all(promesasTareas);

        alert("✅ ¡Modificaciones guardadas exitosamente!");
        
    } catch (error) {
        console.error("Fallo al actualizar:", error);
        alert("❌ Ocurrió un error al guardar los cambios.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar modificación';
    }
});

// Arranque
document.addEventListener('DOMContentLoaded', cargarSelectorProyectos);

// Nuestra "Fuente de Verdad" (Aquí vive todo el progreso de NanoAudit)

