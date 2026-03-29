// --- WIDGET DE LA HORA ---
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// --- WIDGET DEL CALENDARIO ---
function updateCalendar() {
    const now = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    document.getElementById('month-year').textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
    document.getElementById('date-number').textContent = now.getDate();
    document.getElementById('day-name').textContent = days[now.getDay()];
}
updateCalendar();

// --- WIDGET DE PROYECTOS ---


// --- LÓGICA DE NOTAS (Escribir y Guardar) ---

// --- CONFIGURACIÓN DE SUPABASE ---
// IMPORTANTE: Reemplaza estos valores con los tuyos (Settings > API en Supabase)
const supabaseUrl = 'https://jucmbiekaobfrkvkaqpk.supabase.co';
const supabaseKey = 'sb_publishable_ZIGP_5VePuVBBw8qMJs67A_XNdya-Df';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DE NOTAS CON SUPABASE ---
const savedNotesList = document.getElementById('saved-notes-list');
const newNoteInput = document.getElementById('new-note-input');
const saveNoteBtn = document.getElementById('save-note-btn');
const charCounter = document.getElementById('char-counter');
const MAX_CHARS = 125;

// 1. Contador de caracteres en tiempo real
newNoteInput.addEventListener('input', () => {
    const currentLength = newNoteInput.value.length;
    charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
    
    // Si llega a 125, se pone rojo
    if (currentLength >= MAX_CHARS) {
        charCounter.classList.add('limit');
    } else {
        charCounter.classList.remove('limit');
    }
});

// ==========================================
//   LÓGICA DE NOTAS CON SUPABASE
// ==========================================


// 1. Contador de caracteres en tiempo real
newNoteInput.addEventListener('input', () => {
    const currentLength = newNoteInput.value.length;
    charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
    
    // Si llega a 125, se pone rojo (usando la clase .limit de tu CSS)
    if (currentLength >= MAX_CHARS) {
        charCounter.classList.add('limit');
    } else {
        charCounter.classList.remove('limit');
    }
});

// 2. Función para descargar LAS NOTAS DEL USUARIO ACTUAL
async function fetchNotas() {
    // Verificamos quién es el usuario logueado en este momento
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Si no hay sesión activa, no hacemos nada
    if (!session) return;

    // Pedimos a Supabase solo las notas que le pertenecen a este usuario
    const { data, error } = await supabaseClient
        .from('notas')
        .select('*')
        .eq('usuario_id', session.user.id) // Filtro de seguridad
        .order('creado_en', { ascending: false }); // De la más nueva a la más vieja

    if (error) {
        console.error("Error al cargar las notas:", error);
        return;
    }

    // Limpiamos el contenedor y dibujamos las notas reales
    savedNotesList.innerHTML = ''; 
    data.forEach(nota => {
        const div = document.createElement('div');
        div.className = 'saved-note';
        
        // Estructura: texto a la izquierda, botón de papelera a la derecha
        div.innerHTML = `
            <div class="note-text">${nota.texto}</div>
            <button class="delete-note-btn" onclick="borrarNota(${nota.id})" title="Eliminar nota">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        savedNotesList.appendChild(div);
    });
}

// 3. Función global para borrar una nota en Supabase
window.borrarNota = async function(id) {
    // Confirmación nativa del navegador para evitar borrados accidentales
    if (!confirm("¿Estás seguro de que deseas eliminar esta nota?")) return;

    // Llamada a la base de datos para borrar la fila exacta
    const { error } = await supabaseClient
        .from('notas')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Error al eliminar la nota de la base de datos.");
        console.error(error);
    } else {
        fetchNotas(); // Refrescamos la lista visualmente
    }
}

// 4. Evento al hacer clic en "Guardar"
saveNoteBtn.addEventListener('click', async () => {
    const text = newNoteInput.value.trim();
    if (text === '') return;

    // Obtenemos al usuario actual para firmar la nota
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("Debes iniciar sesión para guardar notas.");
        return;
    }

    // Efecto de carga en el botón
    saveNoteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    saveNoteBtn.disabled = true;

    // Insertamos la nota junto con el ID del dueño
    const { error } = await supabaseClient
        .from('notas')
        .insert([{ 
            texto: text,
            usuario_id: session.user.id // Vinculación crucial
        }]);

    // Restauramos el botón
    saveNoteBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar';
    saveNoteBtn.disabled = false;

    if (error) {
        alert("Hubo un error al guardar la nota en la nube.");
        console.error(error);
    } else {
        // Limpieza de la interfaz tras el éxito
        newNoteInput.value = ''; 
        charCounter.textContent = `0 / ${MAX_CHARS}`;
        charCounter.classList.remove('limit');
        fetchNotas(); // Recargamos para ver la nueva nota
    }
});

// 5. Cargar las notas automáticamente al entrar al Dashboard
fetchNotas();


//Fin modulo Notas


// =====================================================================
// FUNCIÓN PARA CARGAR NOTICIAS REALES (API DEV.TO)
// =====================================================================
// =====================================================================
// FUNCIÓN PARA CARGAR NOTICIAS REALES (API DEV.TO - ANTI CORS)
// =====================================================================
async function fetchTechNews() {
    // AQUÍ ESTÁ EL CAMBIO: Apuntando exactamente a tu ID "news-list"
    const newsContainer = document.getElementById('news-list'); 
    
    if (!newsContainer) {
        console.error("No se encontró el contenedor de noticias.");
        return;
    }

    newsContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Conectando con la red global...</p>';

    try {
        // Petición a la API pública de Dev.to (Etiqueta: Ciberseguridad)
        const response = await fetch('https://dev.to/api/articles?tag=cybersecurity&per_page=3');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        newsContainer.innerHTML = ''; // Limpiamos el spinner de carga

        // Recorremos los artículos reales y los dibujamos
        data.forEach(news => {
            const article = document.createElement('div');
            article.className = 'news-item'; 
            
            article.style.cssText = 'padding: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 10px; transition: background 0.2s; border-radius: 8px;';
            
            const fechaPublicacion = new Date(news.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

            article.innerHTML = `
                <h4 style="margin: 0 0 8px 0; color: #0984e3; font-size: 1.1rem; line-height: 1.3;">
                    ${news.title}
                </h4>
                <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #64748b;">
                    <i class="fa-solid fa-terminal"></i> Autor: ${news.user.name}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                    <span style="color: #94a3b8; font-weight: 600;">
                        <i class="fa-regular fa-calendar"></i> ${fechaPublicacion}
                    </span>
                    <a href="${news.url}" target="_blank" style="text-decoration: none; font-weight: 800; color: #1e293b; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; transition: background 0.2s;">
                        Leer artículo <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;
            
            // Efecto hover sutil
            article.addEventListener('mouseenter', () => article.style.backgroundColor = '#f8fafc');
            article.addEventListener('mouseleave', () => article.style.backgroundColor = 'transparent');

            newsContainer.appendChild(article);
        });

    } catch (error) {
        console.error("Fallo crítico en la API de noticias:", error);
        newsContainer.innerHTML = `
            <div style="text-align: center; color: #e74c3c; padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Error de conexión con el servidor de noticias.</p>
            </div>
        `;
    }
}

// Arrancar la función al cargar la página
document.addEventListener('DOMContentLoaded', fetchTechNews);

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
// FUNCIÓN PARA CARGAR LOS ÚLTIMOS PROYECTOS (MINI-WIDGET INTERACTIVO)
// =====================================================================
async function fetchUltimosProyectos() {
    const listContainer = document.getElementById('projects-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 10px;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando proyectos...</p>';

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: proyectos, error } = await supabaseClient
        .from('proyectos')
        .select('*, tareas (*)')
        .eq('usuario_id', session.user.id)
        .order('creado_en', { ascending: false })
        .limit(4);

    if (error) {
        console.error("Error al cargar últimos proyectos:", error);
        listContainer.innerHTML = '<p style="text-align:center; color:#e74c3c;">Error de conexión.</p>';
        return;
    }

    listContainer.innerHTML = ''; 

    if (proyectos.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#888; font-style: italic; padding: 10px;">No hay proyectos recientes.</p>';
        return;
    }

    // Dibujamos los proyectos
    proyectos.forEach(proj => {
        const tareas = proj.tareas || [];
        const total = tareas.length;
        const completas = tareas.filter(t => t.completada === true).length;
        const pct = total > 0 ? Math.round((completas / total) * 100) : 0;
        const color = pct === 100 ? '#27ae60' : '#0984e3';

        // 1. Preparamos el HTML de las tareas en miniatura
        let tareasHTML = '';
        if (total === 0) {
            tareasHTML = '<p style="font-size: 0.8rem; color: #94a3b8; font-style: italic; margin-top: 10px; text-align: center;">Sin tareas asignadas.</p>';
        } else {
            tareasHTML = '<ul style="margin-top: 12px; padding-left: 0; list-style: none; border-top: 1px dashed #cbd5e1; padding-top: 10px;">';
            tareas.forEach(t => {
                // Iconos visuales dependiendo del estado
                const icono = t.completada ? '<i class="fa-solid fa-check" style="color: #27ae60;"></i>' : '<i class="fa-regular fa-clock" style="color: #0984e3;"></i>';
                const tachado = t.completada ? 'line-through' : 'none';
                const colorTexto = t.completada ? '#94a3b8' : '#475569';
                
                tareasHTML += `
                    <li style="font-size: 0.85rem; color: ${colorTexto}; text-decoration: ${tachado}; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 8px;">
                        <span style="margin-top: 2px;">${icono}</span> 
                        <span>${t.descripcion}</span>
                    </li>`;
            });
            tareasHTML += '</ul>';
        }

        // 2. Creamos la tarjeta del proyecto
        const li = document.createElement('li');
        li.style.cssText = `list-style: none; margin-bottom: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid ${color}; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: background 0.2s;`;
        
        li.innerHTML = `
            <div class="mini-accordion-header" style="cursor: pointer; user-select: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75%;" title="${proj.nombre}">
                        <i class="fa-solid fa-chevron-right toggle-icon" style="font-size: 0.75rem; color: #64748b; margin-right: 6px; transition: transform 0.2s;"></i>
                        ${proj.nombre}
                    </strong>
                    <span style="font-size: 0.85rem; font-weight: 800; color: ${color};">${pct}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: ${color}; transition: width 0.5s ease-out;"></div>
                </div>
            </div>
            
            <div class="mini-accordion-content" style="display: none;">
                ${tareasHTML}
            </div>
        `;

        // 3. Le inyectamos la interactividad (El Clic)
        const header = li.querySelector('.mini-accordion-header');
        const content = li.querySelector('.mini-accordion-content');
        const icon = li.querySelector('.toggle-icon');

        header.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            // Alternamos la visibilidad
            content.style.display = isHidden ? 'block' : 'none';
            // Rotamos la flechita para dar feedback visual
            icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
            // Cambiamos un poco el fondo al expandir
            li.style.background = isHidden ? '#ffffff' : '#f8fafc';
        });

        listContainer.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded',fetchUltimosProyectos);