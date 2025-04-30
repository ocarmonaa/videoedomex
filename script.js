// =============================================
// CONFIGURACIÓN INICIAL DE BACK4APP
// =============================================
const BACK4APP_APP_ID = 'pONZsNwqhottjlfOr4WXfQ1dkLmHpIoyhSWIhDh6';
const BACK4APP_JS_KEY = 'ZpyyhUzzeNIbYbgqYYkwJEw9YFaKwmRYFFdD8L5V';
Parse.initialize(BACK4APP_APP_ID, BACK4APP_JS_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

// =============================================
// ELEMENTOS DEL DOM (COMPLETOS)
// =============================================
const elementos = {
    // Botones principales
    btnNuevaReunion: document.getElementById('btnNuevaReunion'),
    btnBuscar: document.getElementById('btnBuscar'),
    btnGuardar: document.getElementById('btnGuardar'),
    btnEditar: document.getElementById('btnEditar'),
    btnEliminar: document.getElementById('btnEliminar'),
    
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
    estado: document.getElementById('estado'),
    
    // Filtros
    filtroEstado: document.getElementById('filtroEstado'),
    filtroFecha: document.getElementById('filtroFecha'),
    filtroArea: document.getElementById('filtroArea'),
    buscarReunion: document.getElementById('buscarReunion'),
    
    // Lista y resumen
    listaReuniones: document.getElementById('listaReuniones'),
    contadorPendientes: document.getElementById('contadorPendientes'),
    contadorRealizadas: document.getElementById('contadorRealizadas'),
    contadorCanceladas: document.getElementById('contadorCanceladas'),
    
    // Detalles
    detalleTitulo: document.getElementById('detalleTitulo'),
    detalleFecha: document.getElementById('detalleFecha'),
    detalleHorario: document.getElementById('detalleHorario'),
    detalleArea: document.getElementById('detalleArea'),
    detalleLugar: document.getElementById('detalleLugar'),
    detalleLiga: document.getElementById('detalleLiga'),
    detalleParticipantes: document.getElementById('detalleParticipantes'),
    detalleEstado: document.getElementById('detalleEstado'),
    
    // Mensajes
    syncMessage: document.getElementById('syncMessage'),
    
    // Botones de cerrar
    cerrarModalBtns: document.querySelectorAll('.btn-cerrar-modal')
};

let reuniones = [];
let reunionEditando = null;

// =============================================
// FUNCIONES PRINCIPALES (COMPLETAS)
// =============================================

async function inicializarBack4App() {
    try {
        console.log('Inicializando conexión con Back4App...');
        const config = await Parse.Config.get();
        console.log('Conexión exitosa con Back4App');
        return true;
    } catch (error) {
        console.error('Error al conectar con Back4App:', error);
        throw new Error(`Error de conexión: ${error.message}`);
    }
}

async function cargarDatos() {
    try {
        console.log('Cargando datos desde Back4App...');
        elementos.listaReuniones.innerHTML = '<p class="cargando">Cargando videoconferencias...</p>';
        
        const query = new Parse.Query('Videoconferencia');
        query.ascending('fecha', 'horaInicio');
        
        const results = await query.find();
        reuniones = results.map(item => ({
            id: item.id,
            titulo: item.get('titulo') || 'Sin título',
            fecha: item.get('fecha') || 'No definida',
            horaInicio: item.get('horaInicio') || '--:--',
            horaTerminacion: item.get('horaTerminacion') || '--:--',
            area: item.get('area') || 'No especificada',
            lugar: item.get('lugar') || 'Virtual',
            liga: item.get('liga') || '',
            participantes: item.get('participantes') || 'No especificados',
            estado: item.get('estado') || 'pendiente',
            createdAt: item.createdAt
        }));
        
        actualizarContadores();
        cargarReuniones();
        console.log('Datos cargados correctamente');
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        elementos.listaReuniones.innerHTML = `
            <div class="error-container">
                <p class="error">Error al cargar datos</p>
                <p>${error.message || 'Verifica tu conexión a internet'}</p>
                <button onclick="window.location.reload()" class="btn-primario">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
        mostrarMensaje(`❌ Error: ${error.message || 'No se pudieron cargar los datos'}`, true);
    }
}

async function guardarDatos(reunionData) {
    try {
        console.log('Iniciando proceso de guardado...');
        
        // Validación exhaustiva
        const errores = [];
        if (!reunionData.titulo?.trim()) errores.push('El título es obligatorio');
        if (!reunionData.fecha) errores.push('La fecha es obligatoria');
        if (!reunionData.horaInicio) errores.push('La hora de inicio es obligatoria');
        if (!reunionData.area) errores.push('El área es obligatoria');
        
        if (errores.length > 0) {
            throw new Error(errores.join('\n'));
        }

        const Videoconferencia = Parse.Object.extend('Videoconferencia');
        let reunion;

        if (reunionEditando) {
            console.log('Editando reunión existente:', reunionEditando);
            const query = new Parse.Query(Videoconferencia);
            reunion = await query.get(reunionEditando);
            if (!reunion) {
                throw new Error('No se encontró la reunión a editar');
            }
        } else {
            console.log('Creando nueva reunión');
            reunion = new Videoconferencia();
        }

        // Asignación de valores
        const campos = {
            titulo: reunionData.titulo.trim(),
            fecha: reunionData.fecha,
            horaInicio: reunionData.horaInicio,
            horaTerminacion: reunionData.horaTerminacion || '',
            area: reunionData.area,
            lugar: reunionData.lugar || 'Virtual',
            liga: reunionData.liga || '',
            participantes: reunionData.participantes || 'No especificados',
            estado: reunionData.estado || 'pendiente'
        };

        Object.entries(campos).forEach(([key, value]) => {
            reunion.set(key, value);
        });

        console.log('Guardando en Back4App...');
        const resultado = await reunion.save();
        console.log('Guardado exitoso con ID:', resultado.id);

        mostrarMensaje('✅ Videoconferencia guardada correctamente');
        await cargarDatos();
        
        cerrarModal(elementos.modalReunion);
        elementos.formReunion.reset();
        reunionEditando = null;

        return true;
    } catch (error) {
        console.error('Error en guardarDatos:', error);
        mostrarMensaje(`❌ Error: ${error.message}`, true);
        return false;
    }
}

async function eliminarReunion(id) {
    if (!confirm('¿Estás seguro de eliminar esta videoconferencia?\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        console.log('Eliminando reunión con ID:', id);
        const Videoconferencia = Parse.Object.extend('Videoconferencia');
        const query = new Parse.Query(Videoconferencia);
        const reunion = await query.get(id);
        
        await reunion.destroy();
        mostrarMensaje('✅ Videoconferencia eliminada');
        await cargarDatos();
        cerrarModal(elementos.modalDetalles);
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarMensaje(`❌ Error al eliminar: ${error.message}`, true);
    }
}

// =============================================
// FUNCIONES DE INTERFAZ (COMPLETAS)
// =============================================

function cargarReuniones() {
    console.log('Actualizando lista de reuniones...');
    elementos.listaReuniones.innerHTML = '';
    
    const filtros = obtenerFiltrosActivos();
    const busqueda = filtros.busqueda.toLowerCase();
    
    const reunionesFiltradas = reuniones
        .filter(reunion => filtrarPorEstado(reunion, filtros.estado))
        .filter(reunion => filtrarPorFecha(reunion, filtros.fecha))
        .filter(reunion => filtrarPorArea(reunion, filtros.area))
        .filter(reunion => {
            if (!busqueda) return true;
            return (
                reunion.titulo.toLowerCase().includes(busqueda) ||
                reunion.area.toLowerCase().includes(busqueda) ||
                reunion.participantes.toLowerCase().includes(busqueda)
            );
        })
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    if (reunionesFiltradas.length === 0) {
        elementos.listaReuniones.innerHTML = '<p class="no-reuniones">No hay videoconferencias con estos filtros</p>';
        return;
    }
    
    reunionesFiltradas.forEach(reunion => {
        const elemento = document.createElement('div');
        elemento.className = 'reunion-item';
        elemento.innerHTML = `
            <span class="reunion-estado estado-${reunion.estado}">
                ${formatearEstado(reunion.estado)}
            </span>
            <h3>${reunion.titulo}</h3>
            <div class="reunion-info">
                <span><i class="far fa-calendar-alt"></i> ${formatearFecha(reunion.fecha)}</span>
                <span><i class="far fa-clock"></i> ${reunion.horaInicio} - ${reunion.horaTerminacion}</span>
                <span><i class="fas fa-users"></i> ${reunion.area}</span>
            </div>
            <p class="reunion-participantes">
                <i class="fas fa-user-friends"></i> 
                ${reunion.participantes.split(',').slice(0, 3).join(', ')}
                ${reunion.participantes.split(',').length > 3 ? '...' : ''}
            </p>
        `;
        
        elemento.addEventListener('click', () => mostrarDetalles(reunion.id));
        elementos.listaReuniones.appendChild(elemento);
    });
}

function mostrarDetalles(id) {
    console.log('Mostrando detalles para reunión ID:', id);
    const reunion = reuniones.find(r => r.id === id);
    if (!reunion) {
        console.error('Reunión no encontrada');
        return;
    }
    
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
    
    elementos.btnEditar.onclick = () => editarReunion(id);
    elementos.btnEliminar.onclick = () => eliminarReunion(id);
    
    elementos.modalDetalles.style.display = 'block';
}

function editarReunion(id) {
    console.log('Editando reunión ID:', id);
    const reunion = reuniones.find(r => r.id === id);
    if (!reunion) {
        console.error('Reunión no encontrada para edición');
        return;
    }
    
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
    elementos.participantes.value = reunion.participantes;
    elementos.estado.value = reunion.estado;
    
    elementos.modalReunion.style.display = 'block';
    cerrarModal(elementos.modalDetalles);
}

// =============================================
// FUNCIONES UTILITARIAS (COMPLETAS)
// =============================================

function formatearFecha(fechaString) {
    try {
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-ES', opciones);
    } catch {
        return fechaString;
    }
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
    if (!elementos.syncMessage) {
        console.error('Elemento de mensaje no encontrado');
        return;
    }
    
    elementos.syncMessage.innerHTML = texto;
    elementos.syncMessage.style.backgroundColor = esError ? '#dc3545' : '#28a745';
    elementos.syncMessage.style.display = 'block';
    
    // Reiniciar animación
    elementos.syncMessage.style.animation = 'none';
    setTimeout(() => {
        elementos.syncMessage.style.animation = 'fadeInOut 2.5s ease-in-out';
    }, 10);
    
    setTimeout(() => {
        elementos.syncMessage.style.display = 'none';
    }, 3000);
}

function cerrarModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal cerrado');
    }
}

function obtenerFiltrosActivos() {
    return {
        estado: elementos.filtroEstado.value,
        fecha: elementos.filtroFecha.value,
        area: elementos.filtroArea.value,
        busqueda: elementos.buscarReunion.value.trim()
    };
}

function filtrarPorEstado(reunion, estado) {
    return estado === 'todas' || reunion.estado === estado;
}

function filtrarPorFecha(reunion, fecha) {
    if (!fecha) return true;
    return reunion.fecha === fecha;
}

function filtrarPorArea(reunion, area) {
    return area === 'todas' || reunion.area === area;
}

// =============================================
// MANEJADORES DE EVENTOS (COMPLETOS)
// =============================================

async function manejarSubmitFormulario(e) {
    e.preventDefault();
    console.log('Formulario enviado');
    
    if (!elementos.btnGuardar) {
        console.error('Botón Guardar no encontrado');
        return;
    }

    // Cambiar estado del botón
    const textoOriginal = elementos.btnGuardar.innerHTML;
    elementos.btnGuardar.disabled = true;
    elementos.btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const reunionData = {
            id: elementos.reunionId.value,
            titulo: elementos.titulo.value,
            fecha: elementos.fecha.value,
            horaInicio: elementos.horaInicio.value,
            horaTerminacion: elementos.horaTerminacion.value,
            area: elementos.area.value,
            lugar: elementos.lugar.value,
            liga: elementos.liga.value,
            participantes: elementos.participantes.value,
            estado: elementos.estado.value
        };

        console.log('Datos del formulario:', reunionData);
        await guardarDatos(reunionData);
    } catch (error) {
        console.error('Error en submit:', error);
    } finally {
        // Restaurar botón
        elementos.btnGuardar.disabled = false;
        elementos.btnGuardar.innerHTML = textoOriginal;
    }
}

function configurarEventListeners() {
    console.log('Configurando event listeners...');
    
    // Formulario
    if (elementos.formReunion) {
        elementos.formReunion.addEventListener('submit', manejarSubmitFormulario);
    } else {
        console.error('Formulario no encontrado');
    }
    
    // Botón nueva reunión
    if (elementos.btnNuevaReunion) {
        elementos.btnNuevaReunion.addEventListener('click', () => {
            reunionEditando = null;
            document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
            elementos.formReunion.reset();
            elementos.estado.value = 'pendiente';
            
            const ahora = new Date();
            const fechaActual = ahora.toISOString().split('T')[0];
            const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + 
                              ahora.getMinutes().toString().padStart(2, '0');
            
            elementos.fecha.value = fechaActual;
            elementos.horaInicio.value = horaActual;
            
            // Calcular hora de terminación (1 hora después)
            const horaTerminacion = new Date(ahora.getTime() + 60 * 60 * 1000);
            elementos.horaTerminacion.value = 
                horaTerminacion.getHours().toString().padStart(2, '0') + ':' + 
                horaTerminacion.getMinutes().toString().padStart(2, '0');
            
            elementos.modalReunion.style.display = 'block';
        });
    }
    
    // Filtros
    if (elementos.filtroEstado) {
        elementos.filtroEstado.addEventListener('change', cargarReuniones);
    }
    if (elementos.filtroFecha) {
        elementos.filtroFecha.addEventListener('change', cargarReuniones);
    }
    if (elementos.filtroArea) {
        elementos.filtroArea.addEventListener('change', cargarReuniones);
    }
    
    // Buscador
    if (elementos.btnBuscar) {
        elementos.btnBuscar.addEventListener('click', (e) => {
            e.preventDefault();
            cargarReuniones();
        });
    }
    
    // Cerrar modales
    if (elementos.cerrarModalBtns) {
        elementos.cerrarModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    cerrarModal(modal);
                });
            });
        });
    }
    
    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(modal => {
                cerrarModal(modal);
            });
        }
    });
}

// =============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =============================================

async function inicializarApp() {
    console.log('Iniciando aplicación...');
    
    try {
        // Verificar elementos críticos
        if (!elementos.formReunion || !elementos.btnGuardar || !elementos.listaReuniones) {
            throw new Error('Elementos críticos del DOM no encontrados');
        }
        
        // Inicializar Back4App
        await inicializarBack4App();
        
        // Configurar eventos
        configurarEventListeners();
        
        // Cargar datos iniciales
        await cargarDatos();
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarMensaje(`❌ Error crítico: ${error.message}`, true);
        
        // Mostrar interfaz de error
        document.body.innerHTML = `
            <div class="error-critico">
                <h2>Error crítico en la aplicación</h2>
                <p>${error.message || 'Error desconocido'}</p>
                <p>Verifica tu conexión a internet y recarga la página</p>
                <button onclick="window.location.reload()" class="btn-primario">
                    <i class="fas fa-sync-alt"></i> Recargar
                </button>
                <p class="nota">Si el problema persiste, contacta al administrador</p>
            </div>
        `;
    }
}

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(inicializarApp, 1);
} else {
    document.addEventListener('DOMContentLoaded', inicializarApp);
}