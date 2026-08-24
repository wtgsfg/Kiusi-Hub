// 🔐 PROTECCIÓN
const user = JSON.parse(localStorage.getItem('usuario') || 'null');
if (!user || (user.rol !== 'ADMIN' && user.rol !== 'BODEGUERO')) {
    alert('No tienes permisos para acceder a esta sección.');
    location.href = 'login.html';
}

let pedidosCache = [];
let filtroEstado = "";

// Cargar pedidos
function cargarPedidos() {
    fetch("/api/pedidos")
    .then(res => res.json())
    .then(pedidos => {
        pedidosCache = Array.isArray(pedidos) ? pedidos : [];
        render();
    })
    .catch(err => {
        console.error("Error cargando pedidos:", err);
        document.getElementById('pedidos-container').innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #dc3545;">
                Error al cargar los pedidos. Intenta de nuevo.
            </div>
        `;
    });
}

function render() {
    const lista = filtroEstado
        ? pedidosCache.filter(p => p.estado === filtroEstado)
        : pedidosCache;
    mostrarPedidos(lista);
}

function mostrarPedidos(lista) {
    const contenedor = document.getElementById('pedidos-container');
    
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #666;">
                No hay pedidos para este filtro.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = "";

    lista.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        
        const itemsHTML = pedido.items ? pedido.items.map(item => `
            <li>
                <span class="item-nombre">${item.nombreProducto || 'Producto'}</span>
                <span class="item-cantidad">x${item.cantidad}</span>
            </li>
        `).join('') : '<li><span class="item-nombre">Sin items</span></li>';

        card.innerHTML = `
            <div class="pedido-header">
                <div class="pedido-info">
                    <h3>Pedido #${pedido.id}</h3>
                    <p>Cliente: ${pedido.cliente || 'Sin cliente'}</p>
                    <p>Fecha: ${new Date(pedido.fecha || Date.now()).toLocaleString('es-CO')}</p>
                </div>
                <div class="estado-actual ${pedido.estado}">${pedido.estado}</div>
            </div>
            
            <div class="pedido-items">
                <h4>📦 Productos:</h4>
                <ul class="item-list">${itemsHTML}</ul>
            </div>
            
            <div class="pedido-actions">
                <button onclick="descargarOrdenVentaPdf(${pedido.id})" class="btn-primary" style="margin-right: auto;">
                    📄 Descargar PDF
                </button>
                ${generarBotonesEstado(pedido.estado, pedido.id)}
            </div>
        `;
        
        contenedor.appendChild(card);
    });
}

function descargarOrdenVentaPdf(id) {
    console.log("Descargando orden de venta PDF:", id);
    fetch(`/api/pedidos/${id}/pdf`)
    .then(res => {
        if (!res.ok) throw new Error('Error al descargar el PDF');
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Orden-Venta-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert('✅ Orden de Venta descargada correctamente');
    })
    .catch(err => {
        console.error("Error:", err);
        alert('❌ Error al descargar la Orden de Venta');
    });
}

function generarBotonesEstado(estadoActual, pedidoId) {
    const estados = ['RECIBIDO', 'SACADO', 'REVISADO', 'EMPACADO', 'DESPACHADO'];
    const indexActual = estados.indexOf(estadoActual);
    
    let botones = '';
    
    estados.forEach((estado, index) => {
        const isActivo = index === indexActual;
        const isCompletado = index < indexActual;
        const isSiguiente = index === indexActual + 1;
        const disabled = index !== indexActual + 1;
        
        let clase = 'status-btn pendiente';
        if (isCompletado) clase = 'status-btn completado';
        if (isActivo) clase = 'status-btn activo';
        
        botones += `
            <button 
                class="${clase}" 
                ${disabled ? 'disabled' : ''}
                onclick="${isSiguiente ? `cambiarEstado(${pedidoId}, '${estado}')` : ''}">
                ${isCompletado ? '✓ ' : ''}${estado}
            </button>
        `;
    });
    
    return botones;
}

function cambiarEstado(pedidoId, nuevoEstado) {
    fetch(`/api/pedidos/${pedidoId}/estado?nuevoEstado=${nuevoEstado}`, {
        method: 'PATCH'
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => { throw new Error(text); });
        }
        return res.json();
    })
    .then(() => {
        alert(`Pedido cambiado a estado: ${nuevoEstado}`);
        cargarPedidos();
    })
    .catch(err => {
        console.error("Error cambiando estado:", err);
        alert(`Error: ${err.message}`);
    });
}

function bindFiltros() {
    const cont = document.getElementById("bodega-filtros");
    if (!cont) return;

    cont.querySelectorAll("button[data-estado]").forEach(btn => {
        btn.addEventListener("click", () => {
            filtroEstado = btn.dataset.estado || "";
            cont.querySelectorAll(".estado-filter").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            render();
        });
    });
}

window.descargarOrdenVentaPdf = descargarOrdenVentaPdf;

// Inicializar
bindFiltros();
cargarPedidos();
