document.addEventListener('DOMContentLoaded', function() {
    // Asegúrate de que esta URL es la correcta de tu despliegue
    const API_URL = 'https://script.google.com/macros/s/AKfycbyWSA7BiNZPjjvQS4Is9GY2CzVlnCl3V4fAa-fCfysRi0IBQPaDz4pPRdcn7iADJIHr/exec';

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
        detalleEstado: document.getElementById('detalleEstado')
    };

    let reuniones = [];
    let reunionEditando = null;

    async function cargarDatos() {
        try {
            elementos.listaReuniones.innerHTML = '<p class="cargando">Cargando datos...</p>';
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== 'success') {
                throw new Error(result.message || 'Error al cargar datos');
            }
            
            reuniones = result.data || [];
            actualizarContadores();
            cargarReuniones();
        } catch (error) {
            console.error('Error al cargar datos:', error);
            mostrarMensaje(`Error al cargar datos: ${error.message}`, true);
            elementos.listaReuniones.innerHTML = '<p class="error">Error al cargar datos. Intenta recargar la página.</p>';
        }
    }

    async function guardarDatos(reunionData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    data: reunionData
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== 'success') {
                throw new Error(result.message || 'Error al guardar');
            }
            
            mostrarMensaje('Datos guardados exitosamente');
            await cargarDatos();
            return result.id || reunionData.id;
        } catch (error) {
            console.error('Error al guardar:', error);
            mostrarMensaje('Error al guardar: ' + error.message, true);
            return false;
        }
    }

    async function eliminarReunion(id) {
        if (!confirm('¿Eliminar esta videoconferencia permanentemente?')) return;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: id
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status !== 'success') {
                throw new Error(result.message || 'Error al eliminar');
            }
            
            mostrarMensaje('Reunión eliminada');
            await cargarDatos();
            cerrarModal(elementos.modalDetalles);
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarMensaje('Error al eliminar: ' + error.message, true);
        }
    }

    // Resto de las funciones permanecen igual...
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
        
        if (reunion.liga) {
            elementos.detalleLiga.href = reunion.liga.startsWith('http') ? reunion.liga : `https://${reunion.liga}`;
            elementos.detalleLiga.style.display = 'inline';
        } else {
            elementos.detalleLiga.style.display = 'none';
        }
        
        elementos.detalleParticipantes.textContent = reunion.participantes;
        elementos.detalleEstado.textContent = formatearEstado(reunion.estado);
        
        document.getElementById('btnEditar').onclick = () => editarReunion(id);
        document.getElementById('btnEliminar').onclick = () => eliminarReunion(id);
        
        elementos.modalDetalles.style.display = 'block';
    }

    function editarReunion(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;

        reunionEditando = id;
        document.getElementById('modalTitulo').textContent = 'Editar Videoconferencia';
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
        
        elementos.modalReunion.style.display = 'block';
        cerrarModal(elementos.modalDetalles);
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
            id: document.getElementById('reunionId').value || Utilities.getUuid(),
            titulo: document.getElementById('titulo').value,
            fecha: document.getElementById('fecha').value,
            horaInicio: document.getElementById('horaInicio').value,
            horaTerminacion: document.getElementById('horaTerminacion').value,
            area: document.getElementById('area').value,
            lugar: document.getElementById('lugar').value,
            liga: document.getElementById('liga').value,
            participantes: document.getElementById('participantes').value || 'No especificados',
            estado: document.getElementById('estado').value
        };

        const exito = await guardarDatos(reunionData);
        if (exito) {
            cerrarModal(elementos.modalReunion);
            elementos.formReunion.reset();
            reunionEditando = null;
        }
    });

    elementos.btnNuevaReunion.addEventListener('click', () => {
        reunionEditando = null;
        document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
        elementos.formReunion.reset();
        document.getElementById('reunionId').value = '';
        elementos.estadoSelect.value = 'pendiente';
        
        const ahora = new Date();
        document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
        document.getElementById('horaInicio').value = ahora.toTimeString().substring(0, 5);
        
        elementos.modalReunion.style.display = 'block';
    });

    [elementos.filtroEstado, elementos.filtroFecha, elementos.filtroArea].forEach(elemento => {
        elemento.addEventListener('change', cargarReuniones);
    });

    elementos.btnBuscar.addEventListener('click', (e) => {
        e.preventDefault();
        cargarReuniones();
    });

    function obtenerFiltrosActivos() {
        return {
            estado: elementos.filtroEstado.value,
            fecha: elementos.filtroFecha.value,
            area: elementos.filtroArea.value,
            busqueda: elementos.buscarReunion.value.trim().toLowerCase()
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
        return (reunion.titulo && reunion.titulo.toLowerCase().includes(busqueda)) ||
               (reunion.area && reunion.area.toLowerCase().includes(busqueda)) ||
               (reunion.participantes && reunion.participantes.toLowerCase().includes(busqueda));
    }

    // Inicializar la aplicación
    cargarDatos();
});
