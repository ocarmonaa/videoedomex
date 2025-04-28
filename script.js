document.addEventListener('DOMContentLoaded', function() {
    // ===================== CONFIGURACIÓN GITHUB =====================
    const GITHUB_USER = 'ocarmonaa';          // Cambiar por tu usuario
    const GITHUB_REPO = 'videoedomex';      // Cambiar por tu repositorio
    const FILE_PATH = 'videos.txt';            // Archivo en tu repositorio
    const GITHUB_TOKEN = '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';           // ¡NUNCA PUBLICAR ESTO!
    
    const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
    
    // ===================== ELEMENTOS DEL DOM =====================
    const elementos = {
        btnNuevaReunion: document.getElementById('btnNuevaReunion'),
        modalReunion: document.getElementById('modalReunion'),
        modalDetalles: document.getElementById('modalDetalles'),
        formReunion: document.getElementById('formReunion'),
        listaReuniones: document.getElementById('listaReuniones'),
        filtroEstado: document.getElementById('filtroEstado'),
        filtroFecha: document.getElementById('filtroFecha'),
        filtroArea: document.getElementById('filtroArea'),
        buscarReunion: document.getElementById('buscarReunion'),
        btnBuscar: document.getElementById('btnBuscar'),
        estadoSelect: document.getElementById('estado'),
        grupoConclusiones: document.getElementById('grupoConclusiones'),
        syncMessage: document.getElementById('syncMessage'),
        contadorPendientes: document.getElementById('contadorPendientes'),
        contadorRealizadas: document.getElementById('contadorRealizadas'),
        contadorCanceladas: document.getElementById('contadorCanceladas'),
        detalleTitulo: document.getElementById('detalleTitulo'),
        detalleFecha: document.getElementById('detalleFecha'),
        detalleHorario: document.getElementById('detalleHorario'),
        detalleArea: document.getElementById('detalleArea'),
        detalleLugar: document.getElementById('detalleLugar'),
        detalleLiga: document.getElementById('detalleLiga'),
        detalleParticipantes: document.getElementById('detalleParticipantes'),
        detalleEstado: document.getElementById('detalleEstado'),
        detalleConclusiones: document.getElementById('detalleConclusiones'),
        seccionConclusiones: document.getElementById('seccionConclusiones')
    };

    let reuniones = [];
    let reunionEditando = null;
    let fileSha = null;

    // ===================== FUNCIONES PRINCIPALES =====================
    async function cargarDatos() {
        try {
            elementos.listaReuniones.innerHTML = '<p class="cargando">Cargando datos desde GitHub...</p>';
            
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            fileSha = data.sha;
            const contenido = atob(data.content.replace(/\s/g, ''));
            reuniones = contenido ? JSON.parse(contenido) : [];
            
            actualizarContadores();
            cargarReuniones();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al cargar datos desde GitHub', true);
            elementos.listaReuniones.innerHTML = '<p class="error">Error al cargar datos</p>';
        }
    }

    async function guardarDatos() {
        try {
            const contenido = JSON.stringify(reuniones, null, 2);
            const contenidoBase64 = btoa(contenido);

            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: 'Actualización desde la aplicación',
                    content: contenidoBase64,
                    sha: fileSha
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            fileSha = data.content.sha;
            mostrarMensaje('Datos guardados en GitHub exitosamente');
            return true;
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al guardar en GitHub', true);
            return false;
        }
    }

    // ===================== FUNCIONES DE INTERFAZ =====================
    function cargarReuniones() {
        elementos.listaReuniones.innerHTML = '';
        const filtros = obtenerFiltrosActivos();

        const reunionesFiltradas = reuniones
            .filter(r => filtrarPorEstado(r, filtros.estado))
            .filter(r => filtrarPorFecha(r, filtros.fecha))
            .filter(r => filtrarPorArea(r, filtros.area))
            .filter(r => filtrarPorBusqueda(r, filtros.busqueda))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (reunionesFiltradas.length === 0) {
            elementos.listaReuniones.innerHTML = '<p class="no-reuniones">No hay videoconferencias</p>';
            return;
        }

        reunionesFiltradas.forEach(reunion => {
            const elemento = document.createElement('div');
            elemento.className = 'reunion-item';
            elemento.innerHTML = `
                <span class="reunion-estado estado-${reunion.estado}">${formatearEstado(reunion.estado)}</span>
                <h3>${reunion.titulo}</h3>
                <div class="reunion-info">
                    <span><i class="far fa-calendar-alt"></i> ${formatearFecha(reunion.fecha)}</span>
                    <span><i class="far fa-clock"></i> ${reunion.horaInicio} - ${reunion.horaTerminacion}</span>
                    <span><i class="fas fa-users"></i> ${reunion.area}</span>
                </div>
                <p class="reunion-participantes">
                    <i class="fas fa-user-friends"></i> 
                    ${reunion.participantes.split(',').slice(0, 3).join(', ')}${reunion.participantes.split(',').length > 3 ? '...' : ''}
                </p>
            `;
            elemento.addEventListener('click', () => mostrarDetalles(reunion.id));
            elementos.listaReuniones.appendChild(elemento);
        });
    }

    function mostrarDetalles(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;

        elementos.detalleTitulo.textContent = reunion.titulo;
        elementos.detalleFecha.textContent = formatearFecha(reunion.fecha);
        elementos.detalleHorario.textContent = `${reunion.horaInicio} - ${reunion.horaTerminacion}`;
        elementos.detalleArea.textContent = reunion.area;
        elementos.detalleLugar.textContent = reunion.lugar;
        
        elementos.detalleLiga.href = reunion.liga?.startsWith('http') ? reunion.liga : `https://${reunion.liga}`;
        elementos.detalleLiga.style.display = reunion.liga ? 'inline' : 'none';
        
        elementos.detalleParticipantes.textContent = reunion.participantes;
        elementos.detalleEstado.textContent = formatearEstado(reunion.estado);
        
        elementos.detalleConclusiones.textContent = reunion.conclusiones || 'Sin conclusiones';
        elementos.seccionConclusiones.style.display = reunion.estado === 'realizada' ? 'block' : 'none';
        
        document.getElementById('btnEditar').onclick = () => editarReunion(id);
        document.getElementById('btnEliminar').onclick = () => eliminarReunion(id);
        
        elementos.modalDetalles.style.display = 'block';
    }

    async function eliminarReunion(id) {
        if (!confirm('¿Eliminar esta videoconferencia permanentemente?')) return;
        
        reuniones = reuniones.filter(r => r.id !== id);
        const exito = await guardarDatos();
        if (exito) {
            cargarReuniones();
            actualizarContadores();
            cerrarModal(elementos.modalDetalles);
        }
    }

    // ===================== FUNCIONES AUXILIARES =====================
    function formatearFecha(fechaString) {
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-ES', opciones);
    }

    function formatearEstado(estado) {
        const estados = {
            pendiente: 'Pendiente',
            realizada: 'Realizada',
            cancelada: 'Cancelada'
        };
        return estados[estado] || estado;
    }

    function actualizarContadores() {
        elementos.contadorPendientes.textContent = reuniones.filter(r => r.estado === 'pendiente').length;
        elementos.contadorRealizadas.textContent = reuniones.filter(r => r.estado === 'realizada').length;
        elementos.contadorCanceladas.textContent = reuniones.filter(r => r.estado === 'cancelada').length;
    }

    function mostrarMensaje(texto, esError = false) {
        elementos.syncMessage.textContent = texto;
        elementos.syncMessage.style.backgroundColor = esError ? '#dc3545' : '#28a745';
        elementos.syncMessage.style.display = 'block';
        setTimeout(() => elementos.syncMessage.style.display = 'none', 3000);
    }

    // ===================== EVENTOS =====================
    elementos.formReunion.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const reunionData = {
            id: reunionEditando || Date.now().toString(),
            titulo: document.getElementById('titulo').value,
            fecha: document.getElementById('fecha').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaTerminacion: document.getElementById('horaTerminacion').value,
            area: document.getElementById('area').value,
            lugar: document.getElementById('lugar').value,
            liga: document.getElementById('liga').value,
            participantes: document.getElementById('participantes').value || 'No especificados',
            estado: document.getElementById('estado').value,
            conclusiones: document.getElementById('conclusiones').value || ''
        };

        if (reunionEditando) {
            const index = reuniones.findIndex(r => r.id === reunionEditando);
            if (index !== -1) reuniones[index] = reunionData;
        } else {
            reuniones.push(reunionData);
        }

        const exito = await guardarDatos();
        if (exito) {
            cargarReuniones();
            actualizarContadores();
            cerrarModal(elementos.modalReunion);
        }
    });

    elementos.btnNuevaReunion.addEventListener('click', () => {
        reunionEditando = null;
        document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
        elementos.formReunion.reset();
        elementos.grupoConclusiones.style.display = 'none';
        elementos.estadoSelect.value = 'pendiente';
        
        const ahora = new Date();
        document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
        document.getElementById('horaInicio').value = ahora.toTimeString().substring(0, 5);
        
        elementos.modalReunion.style.display = 'block';
    });

    // ===================== INICIALIZACIÓN =====================
    cargarDatos();
});

// Funciones de filtrado (mantener fuera del event listener)
function obtenerFiltrosActivos() {
    return {
        estado: document.getElementById('filtroEstado').value,
        fecha: document.getElementById('filtroFecha').value,
        area: document.getElementById('filtroArea').value,
        busqueda: document.getElementById('buscarReunion').value.trim().toLowerCase()
    };
}

function filtrarPorEstado(reunion, estado) {
    return estado === 'todas' || reunion.estado === estado;
}

function filtrarPorFecha(reunion, fecha) {
    if (!fecha) return true;
    const fechaReunion = new Date(reunion.fecha).setHours(0,0,0,0);
    const fechaFiltro = new Date(fecha).setHours(0,0,0,0);
    return fechaReunion === fechaFiltro;
}

function filtrarPorArea(reunion, area) {
    return area === 'todas' || reunion.area === area;
}

function filtrarPorBusqueda(reunion, busqueda) {
    if (!busqueda) return true;
    return reunion.titulo.toLowerCase().includes(busqueda) ||
           reunion.area.toLowerCase().includes(busqueda) ||
           reunion.participantes.toLowerCase().includes(busqueda);
}
