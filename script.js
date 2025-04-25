document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const btnNuevaReunion = document.getElementById('btnNuevaReunion');
    const modalReunion = document.getElementById('modalReunion');
    const modalDetalles = document.getElementById('modalDetalles');
    const formReunion = document.getElementById('formReunion');
    const listaReuniones = document.getElementById('listaReuniones');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroFecha = document.getElementById('filtroFecha');
    const filtroArea = document.getElementById('filtroArea');
    const buscarReunion = document.getElementById('buscarReunion');
    const btnBuscar = document.getElementById('btnBuscar');
    const estadoSelect = document.getElementById('estado');
    const grupoConclusiones = document.getElementById('grupoConclusiones');
    const syncMessage = document.getElementById('syncMessage');
    
    // Variables
    let reuniones = JSON.parse(localStorage.getItem('reuniones')) || [];
    let reunionEditando = null;
    
    // Inicializar la aplicación
    function init() {
        cargarReuniones();
        actualizarContadores();
        
        // Mostrar/ocultar campo de conclusiones según estado
        estadoSelect.addEventListener('change', function() {
            grupoConclusiones.style.display = this.value === 'realizada' ? 'block' : 'none';
        });
        
        // Escuchar cambios desde otros dispositivos
        setupDataSync();
    }
    
    // Cargar reuniones en la lista
    function cargarReuniones(filtros = {}) {
        listaReuniones.innerHTML = '';
        
        let reunionesFiltradas = [...reuniones];
        
        // Aplicar filtros
        if (filtros.estado && filtros.estado !== 'todas') {
            reunionesFiltradas = reunionesFiltradas.filter(r => r.estado === filtros.estado);
        }
        
        if (filtros.fecha) {
            const fechaFiltro = new Date(filtros.fecha).setHours(0, 0, 0, 0);
            reunionesFiltradas = reunionesFiltradas.filter(r => {
                const fechaReunion = new Date(r.fecha).setHours(0, 0, 0, 0);
                return fechaReunion === fechaFiltro;
            });
        }
        
        if (filtros.area && filtros.area !== 'todas') {
            reunionesFiltradas = reunionesFiltradas.filter(r => r.area === filtros.area);
        }
        
        if (filtros.busqueda) {
            const termino = filtros.busqueda.toLowerCase();
            reunionesFiltradas = reunionesFiltradas.filter(r => 
                r.titulo.toLowerCase().includes(termino) || 
                r.area.toLowerCase().includes(termino) ||
                r.participantes.toLowerCase().includes(termino)
            );
        }
        
        // Ordenar por fecha (más recientes primero)
        reunionesFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (reunionesFiltradas.length === 0) {
            listaReuniones.innerHTML = '<p class="no-reuniones">No hay videoconferencias que coincidan con los criterios de búsqueda.</p>';
            return;
        }
        
        reunionesFiltradas.forEach(reunion => {
            const reunionElement = document.createElement('div');
            reunionElement.className = 'reunion-item';
            reunionElement.innerHTML = `
                <span class="reunion-estado estado-${reunion.estado}">${formatEstado(reunion.estado)}</span>
                <h3>${reunion.titulo}</h3>
                <div class="reunion-info">
                    <span><i class="far fa-calendar-alt"></i> ${formatFecha(reunion.fecha)}</span>
                    <span><i class="far fa-clock"></i> ${reunion.horaInicio} - ${reunion.horaTerminacion}</span>
                    <span><i class="fas fa-users"></i> ${reunion.area}</span>
                </div>
                <p class="reunion-participantes"><i class="fas fa-user-friends"></i> ${reunion.participantes.split(',').slice(0, 3).join(', ')}${reunion.participantes.split(',').length > 3 ? '...' : ''}</p>
            `;
            
            reunionElement.addEventListener('click', () => mostrarDetallesReunion(reunion.id));
            listaReuniones.appendChild(reunionElement);
        });
    }
    
    // Mostrar modal de nueva reunión
    btnNuevaReunion.addEventListener('click', () => {
        reunionEditando = null;
        document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
        formReunion.reset();
        grupoConclusiones.style.display = 'none';
        estadoSelect.value = 'pendiente';
        modalReunion.style.display = 'block';
    });
    
    // Manejar envío del formulario
    formReunion.addEventListener('submit', function(e) {
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
            if (index !== -1) {
                reuniones[index] = reunionData;
            }
        } else {
            reuniones.push(reunionData);
        }
        
        guardarReuniones();
        sincronizarDatos();
        cargarReuniones();
        actualizarContadores();
        
        // Cerrar el modal después de guardar
        cerrarModal(modalReunion);
    });
    
    // Mostrar detalles de una reunión
    function mostrarDetallesReunion(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;
        
        document.getElementById('detalleTitulo').textContent = reunion.titulo;
        document.getElementById('detalleFecha').textContent = formatFecha(reunion.fecha);
        document.getElementById('detalleHorario').textContent = `${reunion.horaInicio} - ${reunion.horaTerminacion}`;
        document.getElementById('detalleArea').textContent = reunion.area;
        document.getElementById('detalleLugar').textContent = reunion.lugar;
        
        const detalleLiga = document.getElementById('detalleLiga');
        if (reunion.liga) {
            detalleLiga.href = reunion.liga.startsWith('http') ? reunion.liga : `https://${reunion.liga}`;
            detalleLiga.style.display = 'inline';
        } else {
            detalleLiga.style.display = 'none';
        }
        
        document.getElementById('detalleParticipantes').textContent = reunion.participantes;
        document.getElementById('detalleEstado').textContent = formatEstado(reunion.estado);
        
        const seccionConclusiones = document.getElementById('seccionConclusiones');
        const detalleConclusiones = document.getElementById('detalleConclusiones');
        
        if (reunion.estado === 'realizada' && reunion.conclusiones) {
            seccionConclusiones.style.display = 'block';
            detalleConclusiones.textContent = reunion.conclusiones;
        } else {
            seccionConclusiones.style.display = 'none';
        }
        
        // Configurar botones
        document.getElementById('btnEditar').onclick = () => editarReunion(reunion.id);
        document.getElementById('btnEliminar').onclick = () => eliminarReunion(reunion.id);
        
        modalDetalles.style.display = 'block';
    }
    
    // Editar reunión
    function editarReunion(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;
        
        reunionEditando = id;
        document.getElementById('modalTitulo').textContent = 'Editar Videoconferencia';
        
        // Llenar el formulario con los datos de la reunión
        document.getElementById('reunionId').value = reunion.id;
        document.getElementById('titulo').value = reunion.titulo;
        document.getElementById('fecha').value = reunion.fecha;
        document.getElementById('horaInicio').value = reunion.horaInicio;
        document.getElementById('horaTerminacion').value = reunion.horaTerminacion;
        document.getElementById('area').value = reunion.area;
        document.getElementById('lugar').value = reunion.lugar;
        document.getElementById('liga').value = reunion.liga;
        document.getElementById('participantes').value = reunion.participantes;
        document.getElementById('estado').value = reunion.estado;
        document.getElementById('conclusiones').value = reunion.conclusiones;
        
        grupoConclusiones.style.display = reunion.estado === 'realizada' ? 'block' : 'none';
        
        cerrarModal(modalDetalles);
        modalReunion.style.display = 'block';
    }
    
    // Eliminar reunión
    function eliminarReunion(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta videoconferencia?')) {
            reuniones = reuniones.filter(r => r.id !== id);
            guardarReuniones();
            sincronizarDatos();
            cargarReuniones();
            actualizarContadores();
            cerrarModal(modalDetalles);
        }
    }
    
    // Guardar reuniones en localStorage
    function guardarReuniones() {
        localStorage.setItem('reuniones', JSON.stringify(reuniones));
    }
    
    // Configurar sincronización de datos
    function setupDataSync() {
        // Escuchar cambios desde otras pestañas
        window.addEventListener('storage', function(e) {
            if (e.key === 'reuniones') {
                const datosGuardados = localStorage.getItem('reuniones');
                if (datosGuardados) {
                    reuniones = JSON.parse(datosGuardados);
                    cargarReuniones();
                    actualizarContadores();
                    mostrarMensajeSincronizacion();
                }
            }
        });
        
        // Usar BroadcastChannel si está disponible
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('videoconferencias_channel');
            channel.onmessage = function(e) {
                if (e.data.type === 'datos_actualizados') {
                    const datosGuardados = localStorage.getItem('reuniones');
                    if (datosGuardados) {
                        reuniones = JSON.parse(datosGuardados);
                        cargarReuniones();
                        actualizarContadores();
                        mostrarMensajeSincronizacion();
                    }
                }
            };
        }
    }
    
    // Sincronizar datos con otros dispositivos
    function sincronizarDatos() {
        // Disparar evento storage para otras pestañas
        localStorage.setItem('reuniones', JSON.stringify(reuniones));
        
        // Usar BroadcastChannel si está disponible
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('videoconferencias_channel');
            channel.postMessage({ type: 'datos_actualizados' });
            channel.close();
        }
        
        mostrarMensajeSincronizacion();
    }
    
    // Mostrar mensaje de sincronización
    function mostrarMensajeSincronizacion() {
        syncMessage.style.display = 'block';
        setTimeout(() => {
            syncMessage.style.display = 'none';
        }, 2500);
    }
    
    // Actualizar contadores del resumen
    function actualizarContadores() {
        const pendientes = reuniones.filter(r => r.estado === 'pendiente').length;
        const realizadas = reuniones.filter(r => r.estado === 'realizada').length;
        const canceladas = reuniones.filter(r => r.estado === 'cancelada').length;
        
        document.getElementById('contadorPendientes').textContent = pendientes;
        document.getElementById('contadorRealizadas').textContent = realizadas;
        document.getElementById('contadorCanceladas').textContent = canceladas;
    }
    
    // Formatear fecha para mostrar
    function formatFecha(fechaString) {
        const fecha = new Date(fechaString);
        const opciones = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        return fecha.toLocaleDateString('es-ES', opciones);
    }
    
    // Formatear estado para mostrar
    function formatEstado(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'realizada': 'Realizada',
            'cancelada': 'Cancelada'
        };
        return estados[estado] || estado;
    }
    
    // Cerrar modal
    function cerrarModal(modal) {
        modal.style.display = 'none';
    }
    
    // Eventos para cerrar modales
    document.querySelectorAll('.cerrar-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'modalReunion') {
                if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
                    cerrarModal(modal);
                }
            } else {
                cerrarModal(modal);
            }
        });
    });
    
    // Prevenir cierre accidental del modal de reunión
    modalReunion.addEventListener('click', function(e) {
        if (e.target === this) {
            if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
                cerrarModal(modalReunion);
            }
        }
    });
    
    // Aplicar filtros
    function aplicarFiltros() {
        const filtros = {
            estado: filtroEstado.value,
            fecha: filtroFecha.value || null,
            area: filtroArea.value || null,
            busqueda: buscarReunion.value.trim() || null
        };
        cargarReuniones(filtros);
    }
    
    filtroEstado.addEventListener('change', aplicarFiltros);
    filtroFecha.addEventListener('change', aplicarFiltros);
    filtroArea.addEventListener('change', aplicarFiltros);
    btnBuscar.addEventListener('click', aplicarFiltros);
    buscarReunion.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') aplicarFiltros();
    });
    
    // Inicializar la aplicación
    init();
});