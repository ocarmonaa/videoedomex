document.addEventListener('DOMContentLoaded', function() {
    // Reemplaza esta URL con la URL de despliegue de tu Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbzQ-7CRARt3vdZKO3FwXYp7yvSkwVILwf0WOyfwpC_-gs4NUzwRmALwQayP-Jz-tFo3/exec';

    // Selección de todos los elementos del DOM
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
        detalleEstado: document.getElementById('detalleEstado'),
        reunionId: document.getElementById('reunionId'),
        titulo: document.getElementById('titulo'),
        fecha: document.getElementById('fecha'),
        horaInicio: document.getElementById('horaInicio'),
        horaTerminacion: document.getElementById('horaTerminacion'),
        area: document.getElementById('area'),
        lugar: document.getElementById('lugar'),
        liga: document.getElementById('liga'),
        participantes: document.getElementById('participantes')
    };

    let reuniones = [];
    let reunionEditando = null;

    // Función para cargar datos desde Google Sheets
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

    // Función para guardar datos en Google Sheets
    async function guardarDatos(reunionData) {
        try {
            const botonGuardar = elementos.formReunion.querySelector('button[type="submit"]');
            const textoOriginal = botonGuardar.textContent;
            botonGuardar.textContent = 'Guardando...';
            botonGuardar.disabled = true;

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
        } finally {
            const botonGuardar = elementos.formReunion.querySelector('button[type="submit"]');
            botonGuardar.textContent = 'Guardar';
            botonGuardar.disabled = false;
        }
    }

    // Función para eliminar una reunión
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

    // Función para cargar las reuniones en la lista
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
                    ${reunion.participantes?.split(',').slice(0, 3).join(', ') || 'No especificados'}${reunion.participantes?.split(',').length > 3 ? '...' : ''}
                </p>
            `;
            elemento.addEventListener('click', () => mostrarDetalles(reunion.id));
            elementos.listaReuniones.appendChild(elemento);
        });
    }

    // Función para mostrar los detalles de una reunión
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
        
        elementos.detalleParticipantes.textContent = reunion.participantes || 'No especificados';
        elementos.detalleEstado.textContent = formatearEstado(reunion.estado);
        
        document.getElementById('btnEditar').onclick = () => editarReunion(id);
        document.getElementById('btnEliminar').onclick = () => eliminarReunion(id);
        
        elementos.modalDetalles.style.display = 'block';
    }

    // Función para editar una reunión
    function editarReunion(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;

        reunionEditando = id;
        document.getElementById('modalTitulo').textContent = 'Editar Videoconferencia';
        elementos.reunionId.value = reunion.id;
        elementos.titulo.value = reunion.titulo;
        elementos.fecha.value = reunion.fecha;
        elementos.horaInicio.value = reunion.horaInicio;
        elementos.horaTerminacion.value = reunion.horaTerminacion;
        elementos.area.value = reunion.area;
        elementos.lugar.value = reunion.lugar;
        elementos.liga.value = reunion.liga || '';
        elementos.participantes.value = reunion.participantes || '';
        elementos.estadoSelect.value = reunion.estado;
        
        elementos.modalReunion.style.display = 'block';
        cerrarModal(elementos.modalDetalles);
    }

    // Función para formatear la fecha
    function formatearFecha(fechaString) {
        if (!fechaString) return 'Fecha no especificada';
        try {
            const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(fechaString).toLocaleDateString('es-ES', opciones);
        } catch (e) {
            return fechaString;
        }
    }

    // Función para formatear el estado
    function formatearEstado(estado) {
        const estados = {
            pendiente: 'Pendiente',
            realizada: 'Realizada',
            cancelada: 'Cancelada'
        };
        return estados[estado] || estado;
    }

    // Función para actualizar los contadores
    function actualizarContadores() {
        elementos.contadorPendientes.textContent = reuniones.filter(r => r.estado === 'pendiente').length;
        elementos.contadorRealizadas.textContent = reuniones.filter(r => r.estado === 'realizada').length;
        elementos.contadorCanceladas.textContent = reuniones.filter(r => r.estado === 'cancelada').length;
    }

    // Función para mostrar mensajes al usuario
    function mostrarMensaje(texto, esError = false) {
        elementos.syncMessage.textContent = texto;
        elementos.syncMessage.style.backgroundColor = esError ? '#dc3545' : '#28a745';
        elementos.syncMessage.style.display = 'block';
        setTimeout(() => {
            elementos.syncMessage.style.display = 'none';
        }, 3000);
    }

    // Función para cerrar modales
    function cerrarModal(modal) {
        modal.style.display = 'none';
    }

    // Event listeners para cerrar modales
    document.querySelectorAll('.btn-cerrar-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                cerrarModal(modal);
            });
        });
    });

    // Manejador del formulario
    elementos.formReunion.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validación básica del formulario
        if (!elementos.titulo.value || !elementos.fecha.value || !elementos.horaInicio.value || 
            !elementos.horaTerminacion.value || !elementos.area.value || !elementos.lugar.value) {
            mostrarMensaje('Por favor complete todos los campos requeridos', true);
            return;
        }

        const reunionData = {
            id: elementos.reunionId.value || Date.now().toString(),
            titulo: elementos.titulo.value,
            fecha: elementos.fecha.value,
            horaInicio: elementos.horaInicio.value,
            horaTerminacion: elementos.horaTerminacion.value,
            area: elementos.area.value,
            lugar: elementos.lugar.value,
            liga: elementos.liga.value,
            participantes: elementos.participantes.value || 'No especificados',
            estado: elementos.estadoSelect.value
        };

        const exito = await guardarDatos(reunionData);
        if (exito) {
            cerrarModal(elementos.modalReunion);
            elementos.formReunion.reset();
            elementos.reunionId.value = '';
            reunionEditando = null;
        }
    });

    // Event listener para el botón Nueva Reunión
    elementos.btnNuevaReunion.addEventListener('click', () => {
        reunionEditando = null;
        document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
        elementos.formReunion.reset();
        elementos.reunionId.value = '';
        elementos.estadoSelect.value = 'pendiente';
        
        const ahora = new Date();
        elementos.fecha.value = ahora.toISOString().split('T')[0];
        elementos.horaInicio.value = ahora.toTimeString().substring(0, 5);
        
        elementos.modalReunion.style.display = 'block';
    });

    // Event listeners para los filtros
    [elementos.filtroEstado, elementos.filtroFecha, elementos.filtroArea].forEach(elemento => {
        elemento.addEventListener('change', cargarReuniones);
    });

    // Event listener para el botón Buscar
    elementos.btnBuscar.addEventListener('click', (e) => {
        e.preventDefault();
        cargarReuniones();
    });

    // Función para obtener los filtros activos
    function obtenerFiltrosActivos() {
        return {
            estado: elementos.filtroEstado.value,
            fecha: elementos.filtroFecha.value,
            area: elementos.filtroArea.value,
            busqueda: elementos.buscarReunion.value.trim().toLowerCase()
        };
    }

    // Funciones de filtrado
    function filtrarPorEstado(reunion, estado) {
        return estado === 'todas' || reunion.estado === estado;
    }

    function filtrarPorFecha(reunion, fecha) {
        if (!fecha) return true;
        try {
            const fechaReunion = new Date(reunion.fecha).setHours(0,0,0,0);
            const fechaFiltro = new Date(fecha).setHours(0,0,0,0);
            return fechaReunion === fechaFiltro;
        } catch (e) {
            return false;
        }
    }

    function filtrarPorArea(reunion, area) {
        return area === 'todas' || reunion.area === area;
    }

    function filtrarPorBusqueda(reunion, busqueda) {
        if (!busqueda) return true;
        const textoBusqueda = busqueda.toLowerCase();
        return (reunion.titulo && reunion.titulo.toLowerCase().includes(textoBusqueda)) ||
               (reunion.area && reunion.area.toLowerCase().includes(textoBusqueda)) ||
               (reunion.participantes && reunion.participantes.toLowerCase().includes(textoBusqueda));
    }

    // Inicializar la aplicación
    cargarDatos();
});
