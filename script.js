document.addEventListener('DOMContentLoaded', function() {
    // URL de la API de Google Apps Script (debes reemplazarla con tu URL real)
    const API_URL = 'https://script.google.com/macros/s/AKfycbyGnmqnfQLYFUAJor30KAQlVtIyx1hC-2MRMZe4SQYPfKuqAKWjQ8ueBOqFMvateAgV/exec';

    // Selección de todos los elementos del DOM con verificación
    const elementos = {
        // Botones y controles principales
        btnNuevaReunion: document.getElementById('btnNuevaReunion'),
        btnBuscar: document.getElementById('btnBuscar'),
        
        // Modales
        modalReunion: document.getElementById('modalReunion'),
        modalDetalles: document.getElementById('modalDetalles'),
        
        // Formulario
        formReunion: document.getElementById('formReunion'),
        reunionId: document.getElementById('reunionId'),
        titulo: document.getElementById('titulo'),
        fecha: document.getElementById('fecha'),
        horaInicio: document.getElementById('horaInicio'),
        horaTerminacion: document.getElementById('horaTerminacion'),
        area: document.getElementById('area'),
        lugar: document.getElementById('lugar'),
        liga: document.getElementById('liga'),
        participantes: document.getElementById('participantes'),
        estadoSelect: document.getElementById('estado'),
        
        // Lista y contenedores
        listaReuniones: document.getElementById('listaReuniones'),
        
        // Filtros
        filtroEstado: document.getElementById('filtroEstado'),
        filtroFecha: document.getElementById('filtroFecha'),
        filtroArea: document.getElementById('filtroArea'),
        buscarReunion: document.getElementById('buscarReunion'),
        
        // Contadores
        contadorPendientes: document.getElementById('contadorPendientes'),
        contadorRealizadas: document.getElementById('contadorRealizadas'),
        contadorCanceladas: document.getElementById('contadorCanceladas'),
        
        // Detalles de reunión
        detalleTitulo: document.getElementById('detalleTitulo'),
        detalleFecha: document.getElementById('detalleFecha'),
        detalleHorario: document.getElementById('detalleHorario'),
        detalleArea: document.getElementById('detalleArea'),
        detalleLugar: document.getElementById('detalleLugar'),
        detalleLiga: document.getElementById('detalleLiga'),
        detalleParticipantes: document.getElementById('detalleParticipantes'),
        detalleEstado: document.getElementById('detalleEstado'),
        
        // Botones de detalles
        btnEditar: document.getElementById('btnEditar'),
        btnEliminar: document.getElementById('btnEliminar'),
        
        // Mensajes
        syncMessage: document.getElementById('syncMessage')
    };

    // Variables de estado
    let reuniones = [];
    let reunionEditando = null;

    // Función para cargar los datos desde Google Sheets
    async function cargarDatos() {
        try {
            // Mostrar estado de carga
            if (elementos.listaReuniones) {
                elementos.listaReuniones.innerHTML = '<p class="cargando">Cargando datos de videoconferencias...</p>';
            }
            
            // Realizar la petición a la API
            const respuesta = await fetch(API_URL);
            
            // Verificar si la respuesta es correcta
            if (!respuesta.ok) {
                throw new Error(`Error en la petición: ${respuesta.status} ${respuesta.statusText}`);
            }
            
            // Procesar la respuesta JSON
            const resultado = await respuesta.json();
            
            // Verificar el estado de la respuesta
            if (resultado.status !== 'success') {
                throw new Error(resultado.message || 'Error al obtener los datos');
            }
            
            // Almacenar las reuniones y actualizar la interfaz
            reuniones = resultado.data || [];
            actualizarContadores();
            cargarReuniones();
            
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            mostrarMensaje(`Error al cargar los datos: ${error.message}`, true);
            
            // Mostrar mensaje de error en la interfaz
            if (elementos.listaReuniones) {
                elementos.listaReuniones.innerHTML = '<p class="error">No se pudieron cargar los datos. Por favor, recarga la página.</p>';
            }
        }
    }

    // Función para guardar una reunión
    async function guardarReunion(datosReunion) {
        let botonGuardar = null;
        const textoOriginalBoton = 'Guardar';
        
        try {
            // Obtener el botón de guardar y cambiar su estado
            if (elementos.formReunion) {
                botonGuardar = elementos.formReunion.querySelector('button[type="submit"]');
                if (botonGuardar) {
                    botonGuardar.textContent = 'Guardando...';
                    botonGuardar.disabled = true;
                }
            }
            
            // Realizar la petición POST a la API
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'save',
                    data: datosReunion
                })
            });
            
            // Verificar si la respuesta es correcta
            if (!respuesta.ok) {
                throw new Error(`Error en la petición: ${respuesta.status}`);
            }
            
            // Procesar la respuesta JSON
            const resultado = await respuesta.json();
            
            // Verificar el estado de la respuesta
            if (resultado.status !== 'success') {
                throw new Error(resultado.message || 'Error al guardar los datos');
            }
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Videoconferencia guardada correctamente');
            
            // Recargar los datos
            await cargarDatos();
            
            return resultado.id || datosReunion.id;
            
        } catch (error) {
            console.error('Error al guardar la reunión:', error);
            mostrarMensaje(`Error al guardar: ${error.message}`, true);
            return false;
            
        } finally {
            // Restaurar el botón a su estado original
            if (botonGuardar) {
                botonGuardar.textContent = textoOriginalBoton;
                botonGuardar.disabled = false;
            }
        }
    }

    // Función para eliminar una reunión
    async function eliminarReunion(idReunion) {
        // Confirmar antes de eliminar
        if (!confirm('¿Estás seguro que deseas eliminar esta videoconferencia? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            // Realizar la petición DELETE a la API
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: idReunion
                })
            });
            
            // Verificar si la respuesta es correcta
            if (!respuesta.ok) {
                throw new Error(`Error en la petición: ${respuesta.status}`);
            }
            
            // Procesar la respuesta JSON
            const resultado = await respuesta.json();
            
            // Verificar el estado de la respuesta
            if (resultado.status !== 'success') {
                throw new Error(resultado.message || 'Error al eliminar la reunión');
            }
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Videoconferencia eliminada correctamente');
            
            // Recargar los datos
            await cargarDatos();
            
            // Cerrar el modal de detalles
            if (elementos.modalDetalles) {
                elementos.modalDetalles.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error al eliminar la reunión:', error);
            mostrarMensaje(`Error al eliminar: ${error.message}`, true);
        }
    }

    // Función para cargar las reuniones en la lista
    function cargarReuniones() {
        // Verificar que el contenedor existe
        if (!elementos.listaReuniones) return;
        
        // Limpiar la lista
        elementos.listaReuniones.innerHTML = '';
        
        // Obtener los filtros activos
        const filtros = obtenerFiltrosActivos();
        
        // Filtrar y ordenar las reuniones
        const reunionesFiltradas = reuniones
            .filter(reunion => filtrarPorEstado(reunion, filtros.estado))
            .filter(reunion => filtrarPorFecha(reunion, filtros.fecha))
            .filter(reunion => filtrarPorArea(reunion, filtros.area))
            .filter(reunion => filtrarPorBusqueda(reunion, filtros.busqueda))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Mostrar mensaje si no hay reuniones
        if (reunionesFiltradas.length === 0) {
            elementos.listaReuniones.innerHTML = '<p class="no-reuniones">No se encontraron videoconferencias con los filtros actuales</p>';
            return;
        }
        
        // Crear elementos para cada reunión
        reunionesFiltradas.forEach(reunion => {
            const elementoReunion = document.createElement('div');
            elementoReunion.className = 'reunion-item';
            elementoReunion.innerHTML = `
                <span class="reunion-estado estado-${reunion.estado}">${formatearEstado(reunion.estado)}</span>
                <h3>${reunion.titulo || 'Sin título'}</h3>
                <div class="reunion-info">
                    <span><i class="far fa-calendar-alt"></i> ${formatearFecha(reunion.fecha)}</span>
                    <span><i class="far fa-clock"></i> ${reunion.horaInicio || '--:--'} - ${reunion.horaTerminacion || '--:--'}</span>
                    <span><i class="fas fa-users"></i> ${reunion.area || 'Sin área especificada'}</span>
                </div>
                <p class="reunion-participantes">
                    <i class="fas fa-user-friends"></i> 
                    ${reunion.participantes ? reunion.participantes.split(',').slice(0, 3).join(', ') : 'No especificados'}
                    ${reunion.participantes && reunion.participantes.split(',').length > 3 ? '...' : ''}
                </p>
            `;
            
            // Agregar evento para mostrar detalles
            elementoReunion.addEventListener('click', () => mostrarDetallesReunion(reunion.id));
            
            // Agregar a la lista
            elementos.listaReuniones.appendChild(elementoReunion);
        });
    }

    // Función para mostrar los detalles de una reunión
    function mostrarDetallesReunion(idReunion) {
        // Buscar la reunión por ID
        const reunion = reuniones.find(r => r.id === idReunion);
        if (!reunion || !elementos.modalDetalles) return;
        
        // Llenar los detalles
        if (elementos.detalleTitulo) elementos.detalleTitulo.textContent = reunion.titulo || 'Sin título';
        if (elementos.detalleFecha) elementos.detalleFecha.textContent = formatearFecha(reunion.fecha) || 'Fecha no especificada';
        if (elementos.detalleHorario) elementos.detalleHorario.textContent = `${reunion.horaInicio || '--:--'} - ${reunion.horaTerminacion || '--:--'}`;
        if (elementos.detalleArea) elementos.detalleArea.textContent = reunion.area || 'Área no especificada';
        if (elementos.detalleLugar) elementos.detalleLugar.textContent = reunion.lugar || 'Lugar no especificado';
        
        // Configurar el enlace de la videoconferencia
        if (elementos.detalleLiga) {
            if (reunion.liga) {
                elementos.detalleLiga.href = reunion.liga.startsWith('http') ? reunion.liga : `https://${reunion.liga}`;
                elementos.detalleLiga.style.display = 'inline';
            } else {
                elementos.detalleLiga.style.display = 'none';
            }
        }
        
        if (elementos.detalleParticipantes) {
            elementos.detalleParticipantes.textContent = reunion.participantes || 'Participantes no especificados';
        }
        
        if (elementos.detalleEstado) {
            elementos.detalleEstado.textContent = formatearEstado(reunion.estado) || 'Estado no especificado';
        }
        
        // Configurar botones de editar y eliminar
        if (elementos.btnEditar) {
            elementos.btnEditar.onclick = () => editarReunion(reunion.id);
        }
        
        if (elementos.btnEliminar) {
            elementos.btnEliminar.onclick = () => eliminarReunion(reunion.id);
        }
        
        // Mostrar el modal
        elementos.modalDetalles.style.display = 'block';
    }

    // Función para editar una reunión
    function editarReunion(idReunion) {
        // Buscar la reunión por ID
        const reunion = reuniones.find(r => r.id === idReunion);
        if (!reunion || !elementos.modalReunion) return;
        
        // Configurar el modal de edición
        if (elementos.reunionId) elementos.reunionId.value = reunion.id;
        if (elementos.titulo) elementos.titulo.value = reunion.titulo || '';
        if (elementos.fecha) elementos.fecha.value = reunion.fecha || '';
        if (elementos.horaInicio) elementos.horaInicio.value = reunion.horaInicio || '';
        if (elementos.horaTerminacion) elementos.horaTerminacion.value = reunion.horaTerminacion || '';
        if (elementos.area) elementos.area.value = reunion.area || '';
        if (elementos.lugar) elementos.lugar.value = reunion.lugar || '';
        if (elementos.liga) elementos.liga.value = reunion.liga || '';
        if (elementos.participantes) elementos.participantes.value = reunion.participantes || '';
        if (elementos.estadoSelect) elementos.estadoSelect.value = reunion.estado || 'pendiente';
        
        // Cambiar el título del modal
        const tituloModal = document.getElementById('modalTitulo');
        if (tituloModal) tituloModal.textContent = 'Editar Videoconferencia';
        
        // Guardar el ID de la reunión que se está editando
        reunionEditando = idReunion;
        
        // Mostrar el modal de edición y cerrar el de detalles
        elementos.modalReunion.style.display = 'block';
        if (elementos.modalDetalles) elementos.modalDetalles.style.display = 'none';
    }

    // Función para actualizar los contadores
    function actualizarContadores() {
        if (elementos.contadorPendientes) {
            elementos.contadorPendientes.textContent = reuniones.filter(r => r.estado === 'pendiente').length;
        }
        if (elementos.contadorRealizadas) {
            elementos.contadorRealizadas.textContent = reuniones.filter(r => r.estado === 'realizada').length;
        }
        if (elementos.contadorCanceladas) {
            elementos.contadorCanceladas.textContent = reuniones.filter(r => r.estado === 'cancelada').length;
        }
    }

    // Función para mostrar mensajes al usuario
    function mostrarMensaje(mensaje, esError = false) {
        if (!elementos.syncMessage) return;
        
        elementos.syncMessage.textContent = mensaje;
        elementos.syncMessage.style.backgroundColor = esError ? '#dc3545' : '#28a745';
        elementos.syncMessage.style.display = 'block';
        
        setTimeout(() => {
            if (elementos.syncMessage) {
                elementos.syncMessage.style.display = 'none';
            }
        }, 3000);
    }

    // Función para formatear fechas
    function formatearFecha(fechaString) {
        if (!fechaString) return 'Fecha no especificada';
        
        try {
            const opciones = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC'
            };
            const fecha = new Date(fechaString);
            
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                return fechaString;
            }
            
            return fecha.toLocaleDateString('es-ES', opciones);
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fechaString;
        }
    }

    // Función para formatear estados
    function formatearEstado(estado) {
        const estados = {
            pendiente: 'Pendiente',
            realizada: 'Realizada',
            cancelada: 'Cancelada'
        };
        return estados[estado] || estado;
    }

    // Función para cerrar modales
    function cerrarModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Función para obtener los filtros activos
    function obtenerFiltrosActivos() {
        return {
            estado: elementos.filtroEstado ? elementos.filtroEstado.value : 'todas',
            fecha: elementos.filtroFecha ? elementos.filtroFecha.value : '',
            area: elementos.filtroArea ? elementos.filtroArea.value : 'todas',
            busqueda: elementos.buscarReunion ? elementos.buscarReunion.value.trim().toLowerCase() : ''
        };
    }

    // Funciones de filtrado
    function filtrarPorEstado(reunion, estado) {
        return estado === 'todas' || reunion.estado === estado;
    }

    function filtrarPorFecha(reunion, fecha) {
        if (!fecha) return true;
        if (!reunion.fecha) return false;
        
        try {
            const fechaReunion = new Date(reunion.fecha).setHours(0, 0, 0, 0);
            const fechaFiltro = new Date(fecha).setHours(0, 0, 0, 0);
            return fechaReunion === fechaFiltro;
        } catch (error) {
            console.error('Error al filtrar por fecha:', error);
            return false;
        }
    }

    function filtrarPorArea(reunion, area) {
        return area === 'todas' || reunion.area === area;
    }

    function filtrarPorBusqueda(reunion, busqueda) {
        if (!busqueda) return true;
        
        const textoBusqueda = busqueda.toLowerCase();
        const campos = [
            reunion.titulo,
            reunion.area,
            reunion.participantes,
            reunion.lugar
        ];
        
        return campos.some(campo => 
            campo && campo.toString().toLowerCase().includes(textoBusqueda)
        );
    }

    // Configurar event listeners
    function configurarEventListeners() {
        // Evento para el formulario
        if (elementos.formReunion) {
            elementos.formReunion.addEventListener('submit', async function(evento) {
                evento.preventDefault();
                
                // Validar campos requeridos
                if (!elementos.titulo || !elementos.titulo.value ||
                    !elementos.fecha || !elementos.fecha.value ||
                    !elementos.horaInicio || !elementos.horaInicio.value ||
                    !elementos.horaTerminacion || !elementos.horaTerminacion.value ||
                    !elementos.area || !elementos.area.value ||
                    !elementos.lugar || !elementos.lugar.value) {
                    mostrarMensaje('Por favor complete todos los campos requeridos', true);
                    return;
                }
                
                // Preparar los datos de la reunión
                const datosReunion = {
                    id: elementos.reunionId ? elementos.reunionId.value : Date.now().toString(),
                    titulo: elementos.titulo.value,
                    fecha: elementos.fecha.value,
                    horaInicio: elementos.horaInicio.value,
                    horaTerminacion: elementos.horaTerminacion.value,
                    area: elementos.area.value,
                    lugar: elementos.lugar.value,
                    liga: elementos.liga ? elementos.liga.value : '',
                    participantes: elementos.participantes ? elementos.participantes.value : 'No especificados',
                    estado: elementos.estadoSelect ? elementos.estadoSelect.value : 'pendiente'
                };
                
                // Guardar la reunión
                const exito = await guardarReunion(datosReunion);
                
                // Si se guardó correctamente, limpiar el formulario y cerrar el modal
                if (exito) {
                    if (elementos.formReunion) elementos.formReunion.reset();
                    if (elementos.reunionId) elementos.reunionId.value = '';
                    if (elementos.modalReunion) elementos.modalReunion.style.display = 'none';
                    reunionEditando = null;
                }
            });
        }
        
        // Evento para el botón Nueva Reunión
        if (elementos.btnNuevaReunion) {
            elementos.btnNuevaReunion.addEventListener('click', function() {
                reunionEditando = null;
                
                // Cambiar el título del modal
                const tituloModal = document.getElementById('modalTitulo');
                if (tituloModal) tituloModal.textContent = 'Nueva Videoconferencia';
                
                // Limpiar el formulario
                if (elementos.formReunion) elementos.formReunion.reset();
                if (elementos.reunionId) elementos.reunionId.value = '';
                if (elementos.estadoSelect) elementos.estadoSelect.value = 'pendiente';
                
                // Establecer valores por defecto
                const ahora = new Date();
                if (elementos.fecha) elementos.fecha.value = ahora.toISOString().split('T')[0];
                if (elementos.horaInicio) elementos.horaInicio.value = ahora.toTimeString().substring(0, 5);
                
                // Mostrar el modal
                if (elementos.modalReunion) elementos.modalReunion.style.display = 'block';
            });
        }
        
        // Eventos para los filtros
        if (elementos.filtroEstado) {
            elementos.filtroEstado.addEventListener('change', cargarReuniones);
        }
        if (elementos.filtroFecha) {
            elementos.filtroFecha.addEventListener('change', cargarReuniones);
        }
        if (elementos.filtroArea) {
            elementos.filtroArea.addEventListener('change', cargarReuniones);
        }
        
        // Evento para el botón Buscar
        if (elementos.btnBuscar) {
            elementos.btnBuscar.addEventListener('click', function(evento) {
                evento.preventDefault();
                cargarReuniones();
            });
        }
        
        // Eventos para cerrar modales
        document.querySelectorAll('.btn-cerrar-modal').forEach(boton => {
            boton.addEventListener('click', function() {
                document.querySelectorAll('.modal').forEach(modal => {
                    cerrarModal(modal);
                });
            });
        });
    }

    // Inicializar la aplicación
    function inicializar() {
        // Verificar elementos esenciales
        if (!elementos.formReunion || !elementos.listaReuniones) {
            console.error('No se encontraron elementos esenciales en el DOM');
            mostrarMensaje('Error al inicializar la aplicación', true);
            return;
        }
        
        // Configurar event listeners
        configurarEventListeners();
        
        // Cargar datos iniciales
        cargarDatos();
    }

    // Iniciar la aplicación cuando el DOM esté listo
    inicializar();
});
