// --- 1. CONFIGURACIÓN Y ESTADO ---
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

// Nuestra "Fuente de Verdad" (Aquí vive todo el progreso de NanoAudit)


// =====================================================================
// 1. CONFIGURACIÓN DE SUPABASE
// =====================================================================


// =====================================================================
// 2. FUNCIÓN PARA DIBUJAR LOS PROYECTOS Y EL ACORDEÓN
// =====================================================================
// =====================================================================
// 2. FUNCIÓN PARA DIBUJAR LOS PROYECTOS (VERSIÓN PREMIUM)
// =====================================================================
// =====================================================================
// 2. FUNCIÓN PARA DIBUJAR LOS PROYECTOS (CON FECHAS INCLUIDAS)
// =====================================================================
async function fetchVisualizacion() {
    const accordionContainer = document.getElementById('projects-accordion');
    if (!accordionContainer) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: proyectos, error } = await supabaseClient
        .from('proyectos')
        .select('*, tareas (*)')
        .eq('usuario_id', session.user.id)
        .order('creado_en', { ascending: false });

    if (error) {
        console.error("Error al cargar datos:", error.message);
        return;
    }

    accordionContainer.innerHTML = '';

    proyectos.forEach((proj) => {
        const tareas = proj.tareas || [];
        const total = tareas.length;
        const completas = tareas.filter(t => t.completada === true).length;
        const pct = total > 0 ? Math.round((completas / total) * 100) : 0;
        
        const colorBarra = pct === 100 ? '#27ae60' : '#0984e3'; 

        let fondoTarjeta = '';
        if (pct < 30) fondoTarjeta = 'linear-gradient(135deg, #fff0f0 0%, #ffd6d6 100%)';
        else if (pct < 60) fondoTarjeta = 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)';
        else if (pct < 100) fondoTarjeta = 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)';
        else fondoTarjeta = 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)';

        // --- EXTRACCIÓN Y LIMPIEZA DE FECHAS ---
        // Cortamos la hora ('T') para dejar solo el formato AAAA-MM-DD
        const fechaInicio = proj.fecha_inicio ? proj.fecha_inicio.split('T')[0] : 'No definida';
        const fechaFin = proj.fecha_fin ? proj.fecha_fin.split('T')[0] : 'No definida';

        const card = document.createElement('div');
        card.className = 'accordion-item';
        card.style.cssText = `background: ${fondoTarjeta}; border-radius: 16px; margin-bottom: 25px; border: 1px solid rgba(0,0,0,0.05); overflow: hidden; box-shadow: 0 6px 15px rgba(0,0,0,0.08); transition: transform 0.2s;`;
        
        card.innerHTML = `
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('active')" style="padding: 25px; display: flex; justify-content: space-between; cursor: pointer; background: transparent;">
                <div style="display: flex; align-items: center; gap: 18px;">
                    <strong style="font-size: 1.4rem; color: #1e293b;">${proj.nombre}</strong>
                    <span style="background: rgba(255,255,255,0.6); color: #1e293b; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        ${pct === 100 ? 'CULMINADO' : 'EN CURSO'}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: 800; font-size: 1.2rem; color: #1e293b;">${pct}%</span>
                    <div style="width: 120px; height: 10px; background: rgba(255,255,255,0.7); border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="width: ${pct}%; height: 100%; background: ${colorBarra}; transition: width 0.4s ease-out;"></div>
                    </div>
                    <i class="fa-solid fa-chevron-down" style="color: #475569; font-size: 1.2rem;"></i>
                </div>
            </div>
            
            <div class="accordion-content" style="background: rgba(255,255,255,0.4); border-top: 1px solid rgba(0,0,0,0.05);">
                
                <div style="padding: 12px 25px; background: rgba(255,255,255,0.5); border-bottom: 1px dashed rgba(0,0,0,0.1); display: flex; gap: 30px; font-size: 0.95rem; color: #334155;">
                    <div><i class="fa-regular fa-calendar-days" style="color: #0984e3; margin-right: 5px;"></i> <strong>Inicio:</strong> ${fechaInicio}</div>
                    <div><i class="fa-regular fa-calendar-check" style="color: #e74c3c; margin-right: 5px;"></i> <strong>Culminación:</strong> ${fechaFin}</div>
                </div>

                <div style="padding: 20px 25px;">
                    ${tareas.length === 0 ? '<p style="color:#64748b; font-size:1rem; font-style: italic;">No hay tareas asignadas.</p>' : ''}
                    
                    ${tareas.map(t => `
                        <label style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;">
                            <input type="checkbox" class="task-check custom-checkbox" 
                                   data-id="${t.id}" 
                                   ${t.completada ? 'checked' : ''}>
                            <span style="font-size: 1.1rem; color: ${t.completada ? '#64748b' : '#334155'}; text-decoration: ${t.completada ? 'line-through' : 'none'}; font-weight: 500;">
                                ${t.descripcion}
                            </span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        accordionContainer.appendChild(card);
    });
}

// =====================================================================
// 3. BOTÓN DE SIMULACIÓN (EL CHISMOSO)
// =====================================================================
const btnActualizar = document.getElementById('btn_actualizar_proyecto');

// =====================================================================
// 3. MOTOR REAL DE GUARDADO (CON DETECTOR DE BLOQUEOS RLS)
// =====================================================================


if (btnActualizar) {
    btnActualizar.onclick = async () => {
        const checkboxes = document.querySelectorAll('.task-check');
        
        if (checkboxes.length === 0) return;

        btnActualizar.disabled = true;
        btnActualizar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        let bloqueadoPorRLS = false;

        try {
            for (let box of checkboxes) {
                const idTarea = parseInt(box.getAttribute('data-id'));
                const estaMarcada = box.checked === true; 

                // Le disparamos a Supabase y le exigimos que nos devuelva lo que cambió (.select())
                const { data, error } = await supabaseClient
                    .from('tareas')
                    .update({ completada: estaMarcada })
                    .eq('id', idTarea)
                    .select(); // <-- EL RADAR

                if (error) {
                    console.error("Error de Supabase:", error);
                } else if (!data || data.length === 0) {
                    // Si entra aquí, Supabase nos bloqueó silenciosamente
                    bloqueadoPorRLS = true;
                }
            }

            if (bloqueadoPorRLS) {
                alert("⚠️ ¡Alerta de Seguridad! Tu código está bien, pero Supabase bloqueó la actualización. Revisa las políticas 'UPDATE' en tu tabla 'tareas'.");
            } else {
                alert("✅ Actualización Guardada con Éxito!!!!");
                fetchVisualizacion(); // Recarga para mover la barra de porcentaje
            }

        } catch (error) {
            console.error("Fallo general:", error);
        } finally {
            btnActualizar.disabled = false;
            btnActualizar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar Proyectos';
        }
        
    };
    
}

// =====================================================================
// 4. ARRANQUE AL CARGAR
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchVisualizacion();
});