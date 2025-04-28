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
    let reuniones = [];
    const ARCHIVO_TXT = 'videos.txt';
    const GITHUB_URL = 'https://raw.githubusercontent.com/ocarmonaa/videoedomex/main/';
    let datosCargados = false;
    
    // Elementos para importar/exportar
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = '.txt';
    inputFile.style.display = 'none';
    
    // Inicializar aplicación
    async function init() {
        await cargarDatosIniciales();
        crearBotonesArchivo();
        configurarEventos();
        actualizarContadores();
        cargarReuniones();
        
        estadoSelect.addEventListener('change', function() {
            grupoConclusiones.style.display = this.value === 'realizada' ? 'block' : 'none';
        });
        
        const hoy = new Date().toISOString().split('T')[0];
        filtroFecha.value = hoy;
    }

    // Cargar datos iniciales desde GitHub
    async function cargarDatosIniciales() {
        try {
            const response = await fetch(GITHUB_URL + ARCHIVO_TXT);
            if (!response.ok) throw new Error('Error 404');
            const data = await response.text();
            reuniones = data ? JSON.parse(data) : [];
            datosCargados = true;
        } catch (error) {
            mostrarMensaje('No se encontró el archivo TXT. Usando datos vacíos.', true);
            reuniones = [];
            datosCargados = false;
        }
    }

    // Crear botones de gestión de archivos
    function crearBotonesArchivo() {
        const sidebar = document.querySelector('.sidebar');
        
        const contenedorBotones = document.createElement('div');
        contenedorBotones.className = 'botones-archivo';
        
        const btnExportar = document.createElement('button');
        btnExportar.className = 'btn-primario';
        btnExportar.innerHTML = '<i class="fas fa-file-export"></i> Exportar TXT';
        btnExportar.addEventListener('click', exportarDatos);
        
        const btnImportar = document.createElement('button');
        btnImportar.className = 'btn-primario';
        btnImportar.innerHTML = '<i class="fas fa-file-import"></i> Importar TXT';
        btnImportar.addEventListener('click', () => inputFile.click());
        
        contenedorBotones.appendChild(btnImportar);
        contenedorBotones.appendChild(btnExportar);
        sidebar.insertBefore(contenedorBotones, sidebar.querySelector('.filtros'));
        document.body.appendChild(inputFile);
    }

    // Configurar eventos
    function configurarEventos() {
        inputFile.addEventListener('change', importarDatos);
        btnNuevaReunion.addEventListener('click', mostrarModalNuevaReunion);
        formReunion.addEventListener('submit', guardarReunion);
        
        document.querySelectorAll('.cerrar-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                cerrarModal(modal);
            });
        });
        
        filtroEstado.addEventListener('change', aplicarFiltros);
        filtroFecha.addEventListener('change', aplicarFiltros);
        filtroArea.addEventListener('change', aplicarFiltros);
        btnBuscar.addEventListener('click', aplicarFiltros);
        buscarReunion.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') aplicarFiltros();
        });
    }

    // Exportar datos a TXT
    function exportarDatos() {
        try {
            const blob = new Blob([JSON.stringify(reuniones, null, 2)], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = ARCHIVO_TXT;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
            
            mostrarMensaje('Archivo exportado. Sube este TXT a tu repositorio GitHub');
        } catch (error) {
            mostrarMensaje('Error al exportar datos', true);
        }
    }

    // Importar datos desde TXT
    async function importarDatos(event) {
        const archivo = event.target.files[0];
        if (!archivo) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                reuniones = JSON.parse(e.target.result);
                cargarReuniones();
                actualizarContadores();
                mostrarMensaje('Datos importados correctamente');
            } catch (error) {
                mostrarMensaje('Formato de archivo inválido', true);
            }
        };
        reader.readAsText(archivo);
    }

    // Mostrar modal nueva reunión
    function mostrarModalNuevaReunion() {
        reunionEditando = null;
        document.getElementById('modalTitulo').textContent = 'Nueva Videoconferencia';
        formReunion.reset();
        grupoConclusiones.style.display = 'none';
        estadoSelect.value = 'pendiente';
        
        const ahora = new Date();
        document.getElementById('fecha').value = ahora.toISOString().split('T')[0];
        document.getElementById('horaInicio').value = ahora.toTimeString().substring(0, 5);
        
        modalReunion.style.display = 'block';
    }

    // Guardar reunión
    async function guardarReunion(e) {
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
        
        cargarReuniones();
        actualizarContadores();
        cerrarModal(modalReunion);
        mostrarMensaje('Cambios guardados (exporta el TXT para persistencia)');
    }

    // Cargar reuniones en lista
    function cargarReuniones(filtros = {}) {
        listaReuniones.innerHTML = '';
        
        let reunionesFiltradas = aplicarFiltros(reuniones, filtros);
        
        if (reunionesFiltradas.length === 0) {
            listaReuniones.innerHTML = '<p class="no-reuniones">No hay videoconferencias</p>';
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
            listaReuniones.appendChild(elemento);
        });
    }

    // Aplicar filtros
    function aplicarFiltros(datos, filtros = {
        estado: filtroEstado.value,
        fecha: filtroFecha.value,
        area: filtroArea.value,
        busqueda: buscarReunion.value.trim()
    }) {
        return datos.filter(reunion => {
            const coincideEstado = filtros.estado === 'todas' || reunion.estado === filtros.estado;
            const coincideFecha = !filtros.fecha || new Date(reunion.fecha).toISOString().split('T')[0] === filtros.fecha;
            const coincideArea = filtros.area === 'todas' || reunion.area === filtros.area;
            const coincideBusqueda = !filtros.busqueda || 
                reunion.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                reunion.area.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                reunion.participantes.toLowerCase().includes(filtros.busqueda.toLowerCase());
            
            return coincideEstado && coincideFecha && coincideArea && coincideBusqueda;
        }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // Mostrar detalles reunión
    function mostrarDetalles(id) {
        const reunion = reuniones.find(r => r.id === id);
        if (!reunion) return;
        
        document.getElementById('detalleTitulo').textContent = reunion.titulo;
        document.getElementById('detalleFecha').textContent = formatearFecha(reunion.fecha);
        document.getElementById('detalleHorario').textContent = `${reunion.horaInicio} - ${reunion.horaTerminacion}`;
        document.getElementById('detalleArea').textContent = reunion.area;
        document.getElementById('detalleLugar').textContent = reunion.lugar;
        
        const detalleLiga = document.getElementById('detalleLiga');
        detalleLiga.href = reunion.liga?.startsWith('http') ? reunion.liga : `https://${reunion.liga}`;
        detalleLiga.style.display = reunion.liga ? 'inline' : 'none';
        
        document.getElementById('detalleParticipantes').textContent = reunion.participantes;
        document.getElementById('detalleEstado').textContent = formatearEstado(reunion.estado);
        
        const conclusiones = document.getElementById('detalleConclusiones');
        conclusiones.textContent = reunion.conclusiones || 'Sin conclusiones';
        document.getElementById('seccionConclusiones').style.display = 
            reunion.estado === 'realizada' ? 'block' : 'none';
        
        document.getElementById('btnEditar').onclick = () => editarReunion(id);
        document.getElementById('btnEliminar').onclick = () => eliminarReunion(id);
        
        modalDetalles.style.display = 'block';
    }

    // Editar reunión
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
        document.getElementById('conclusiones').value = reunion.conclusiones;
        
        grupoConclusiones.style.display = reunion.estado === 'realizada' ? 'block' : 'none';
        cerrarModal(modalDetalles);
        modalReunion.style.display = 'block';
    }

    // Eliminar reunión
    async function eliminarReunion(id) {
        if (!confirm('¿Eliminar esta videoconferencia?')) return;
        
        reuniones = reuniones.filter(r => r.id !== id);
        cargarReuniones();
        actualizarContadores();
        cerrarModal(modalDetalles);
        mostrarMensaje('Reunión eliminada (exporta TXT para guardar cambios)');
    }

    // Actualizar contadores
    function actualizarContadores() {
        const contadores = {
            pendiente: 0,
            realizada: 0,
            cancelada: 0
        };
        
        reuniones.forEach(r => contadores[r.estado]++);
        
        document.getElementById('contadorPendientes').textContent = contadores.pendiente;
        document.getElementById('contadorRealizadas').textContent = contadores.realizada;
        document.getElementById('contadorCanceladas').textContent = contadores.cancelada;
    }

    // Formateadores
    function formatearFecha(fechaString) {
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-ES', opciones);
    }

    function formatearEstado(estado) {
        return {
            pendiente: 'Pendiente',
            realizada: 'Realizada',
            cancelada: 'Cancelada'
        }[estado] || estado;
    }

    // Utilidades
    function cerrarModal(modal) {
        modal.style.display = 'none';
    }

    function mostrarMensaje(texto, esError = false) {
        syncMessage.textContent = texto;
        syncMessage.style.backgroundColor = esError ? '#dc3545' : '#28a745';
        syncMessage.style.display = 'block';
        setTimeout(() => syncMessage.style.display = 'none', 3000);
    }

    // Iniciar aplicación
    init();
});