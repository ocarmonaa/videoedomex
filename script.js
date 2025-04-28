document.addEventListener('DOMContentLoaded', function() {
    // Configurar con tu URL de Google Apps Script
    const API_URL = 'TU_URL_DE_APPS_SCRIPT';

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

    async function cargarDatos() {
        try {
            elementos.listaReuniones.innerHTML = '<p class="cargando">Cargando datos...</p>';
            
            const response = await fetch(`${API_URL}?action=get`);
            if (!response.ok) throw new Error('Error al cargar datos');
            
            reuniones = await response.json();
            actualizarContadores();
            cargarReuniones();
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al cargar datos', true);
            elementos.listaReuniones.innerHTML = '<p class="error">Error al cargar datos</p>';
        }
    }

    async function guardarDatos(reunionData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'save',
                    data: reunionData
                })
            });

            if (!response.ok) throw new Error('Error al guardar');
            
            mostrarMensaje('Datos guardados exitosamente');
            await cargarDatos();
            return true;
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al guardar datos', true);
            return false;
        }
    }

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
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'delete',
                    id: id
                })
            });

            if (!response.ok) throw new Error('Error al eliminar');
            
            mostrarMensaje('Reunión eliminada');
            await cargarDatos();
            cerrarModal(elementos.modalDetalles);
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error al eliminar', true);
        }
    }

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

    function cerrarModal(modal) {
        modal.style.display = 'none';
    }

    document.querySelectorAll('.btn-cerrar-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                cerrarModal(modal);
            });
        });
    });

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

        const exito = await guardarDatos(reunionData);
        if (exito) {
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

    elementos.estadoSelect.addEventListener('change', function() {
        elementos.grupoConclusiones.style.display = this.value === 'realizada' ? 'block' : 'none';
    });

    [elementos.filtroEstado, elementos.filtroFecha, elementos.filtroArea].forEach(elemento => {
        elemento.addEventListener('change', cargarReuniones);
    });

    elementos.btnBuscar.addEventListener('click', (e) => {
        e.preventDefault();
        cargarReuniones();
    });

    cargarDatos();
});

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