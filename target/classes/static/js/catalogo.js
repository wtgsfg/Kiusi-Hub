let productos = [];
let stockPorProducto = {};

// Variables para la conversión de moneda
let monedaActualCatalogo = "COP";
let tasaCambioCatalogo = 0.00025;

const usuarioSesion = JSON.parse(localStorage.getItem("usuario") || "null");
const clientePedido = (localStorage.getItem("pedidoCliente") || "").trim();
const vendedorPedido = (localStorage.getItem("pedidoVendedor") || "").trim();

function reconstruirStockMap() {
    const map = {};
    (Array.isArray(productos) ? productos : []).forEach(p => {
        if (p && typeof p.id !== "undefined" && typeof p.stock === "number") {
            map[String(p.id)] = p.stock;
        }
    });
    stockPorProducto = map;
}

function stockDisponible(productoId) {
    const v = stockPorProducto[String(productoId)];
    return typeof v === "number" ? v : null;
}

function reconciliarCarritoConStock() {
    const items = leerCarrito();
    if (items.length === 0) return;

    let cambio = false;
    const ajustados = [];

    items.forEach(it => {
        const stock = stockDisponible(it.productoId);
        if (stock === null) {
            ajustados.push(it);
            return;
        }
        if (stock <= 0) {
            cambio = true;
            return;
        }
        const cant = Number(it.cantidad) || 0;
        if (cant > stock) {
            cambio = true;
            ajustados.push({ ...it, cantidad: stock });
        } else {
            ajustados.push(it);
        }
    });

    if (cambio) {
        guardarCarrito(ajustados);
    }
}

function puedeArmarPedido() {
    if (!usuarioSesion) return false;
    return usuarioSesion.rol === "ADMIN" || usuarioSesion.rol === "VENDEDOR";
}

function tieneClienteSeleccionado() {
    return clientePedido.length > 0;
}

function leerCarrito() {
    try {
        const raw = localStorage.getItem("carritoPedido");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function guardarCarrito(items) {
    localStorage.setItem("carritoPedido", JSON.stringify(items));
    actualizarUIBarraPedido();
}

function cantidadCarrito() {
    return leerCarrito().reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
}

function asegurarUIBarraPedido() {
    const main = document.querySelector("main.container");
    if (!main) return;

    if (!document.getElementById("pedido-bar")) {
        const bar = document.createElement("div");
        bar.id = "pedido-bar";
        bar.className = "pedido-bar";
        bar.innerHTML = `
            <div class="pedido-bar-left">
                <div class="pedido-badge" id="pedido-badge"></div>
                <div class="pedido-sub" id="pedido-sub"></div>
            </div>
            <div class="pedido-bar-right">
                <button class="btn-secondary" id="btn-ver-carrito" type="button">Carrito (<span id="carrito-count">0</span>)</button>
                <button class="btn-success" id="btn-finalizar" type="button">Registrar Pedido</button>
            </div>
        `;

        const firstSection = main.querySelector("section");
        if (firstSection) {
            main.insertBefore(bar, firstSection);
        } else {
            main.prepend(bar);
        }
    }

    if (!document.getElementById("carrito-modal")) {
        const modal = document.createElement("div");
        modal.id = "carrito-modal";
        modal.className = "carrito-modal oculto";
        modal.innerHTML = `
            <div class="carrito-modal-content">
                <div class="carrito-modal-header">
                    <h3 style="margin: 0;">Carrito</h3>
                    <button class="btn-secondary" id="btn-cerrar-carrito" type="button">Cerrar</button>
                </div>
                <div id="carrito-items" class="carrito-items"></div>
                <div class="carrito-modal-footer">
                    <div class="carrito-total" id="carrito-total"></div>
                    <div class="carrito-actions">
                        <button class="btn-secondary" id="btn-vaciar-carrito" type="button">Vaciar</button>
                        <button class="btn-success" id="btn-finalizar-modal" type="button">Registrar Pedido</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById("btn-ver-carrito")?.addEventListener("click", abrirCarrito);
    document.getElementById("btn-cerrar-carrito")?.addEventListener("click", cerrarCarrito);
    document.getElementById("btn-vaciar-carrito")?.addEventListener("click", vaciarCarrito);
    document.getElementById("btn-finalizar")?.addEventListener("click", finalizarPedido);
    document.getElementById("btn-finalizar-modal")?.addEventListener("click", finalizarPedido);

    actualizarUIBarraPedido();
}

function actualizarUIBarraPedido() {
    const badge = document.getElementById("pedido-badge");
    const sub = document.getElementById("pedido-sub");
    const countEl = document.getElementById("carrito-count");
    const btnFinalizar = document.getElementById("btn-finalizar");
    const btnCarrito = document.getElementById("btn-ver-carrito");

    if (!badge || !sub || !countEl || !btnFinalizar || !btnCarrito) return;

    const n = cantidadCarrito();
    countEl.textContent = String(n);
    btnFinalizar.disabled = n === 0;
    btnCarrito.disabled = n === 0;

    if (!usuarioSesion) {
        badge.textContent = "Modo Catálogo";
        sub.innerHTML = `Inicia sesión como Vendedor para crear pedidos. <a href="login.html">Ir a login</a>`;
        btnFinalizar.disabled = true;
        btnCarrito.disabled = true;
        return;
    }

    if (!puedeArmarPedido()) {
        badge.textContent = "Modo Catálogo";
        sub.textContent = "Solo ADMIN o VENDEDOR pueden crear pedidos desde el catálogo.";
        btnFinalizar.disabled = true;
        btnCarrito.disabled = true;
        return;
    }

    if (!tieneClienteSeleccionado()) {
        badge.textContent = "Pedido sin cliente";
        sub.innerHTML = `Primero elige un cliente en <a href="pedidos.html">Pedidos</a> para habilitar el carrito.`;
        btnFinalizar.disabled = true;
        btnCarrito.disabled = true;
        return;
    }

    badge.textContent = `Cliente: ${clientePedido}`;
    sub.textContent = `Vendedor: ${vendedorPedido || usuarioSesion.username}`;
}

function abrirCarrito() {
    renderCarrito();
    document.getElementById("carrito-modal")?.classList.remove("oculto");
}

function cerrarCarrito() {
    document.getElementById("carrito-modal")?.classList.add("oculto");
}

function vaciarCarrito() {
    uiConfirm("¿Vaciar el carrito?").then(ok => {
        if (!ok) return;
        guardarCarrito([]);
        renderCarrito();
    });
}

function renderCarrito() {
    const cont = document.getElementById("carrito-items");
    const totalEl = document.getElementById("carrito-total");
    if (!cont || !totalEl) return;

    const items = leerCarrito();
    if (items.length === 0) {
        cont.innerHTML = `<div style="padding: 1rem; color: #666;">Tu carrito está vacío.</div>`;
        totalEl.textContent = "";
        return;
    }

    let total = 0;
    cont.innerHTML = items.map(it => {
        const subtotal = (Number(it.precio) || 0) * (Number(it.cantidad) || 0);
        total += subtotal;
        const stock = stockDisponible(it.productoId);
        const stockTexto = stock === null ? "" : ` · Stock: ${stock}`;
        const cantActual = Number(it.cantidad) || 0;
        const plusDisabled = stock !== null && cantActual >= stock;
        return `
            <div class="carrito-item">
                <div class="carrito-item-main">
                    <div class="carrito-item-title">${it.nombre}</div>
                    <div class="carrito-item-sub">Cant: ${it.cantidad}${stockTexto} · ${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(it.precio)}</div>
                </div>
                <div class="carrito-item-actions">
                    <button class="btn-secondary" type="button" onclick="cambiarCantidadCarrito(${it.productoId}, -1)">-</button>
                    <button class="btn-secondary" type="button" ${plusDisabled ? "disabled" : ""} onclick="cambiarCantidadCarrito(${it.productoId}, 1)">+</button>
                    <button class="btn-danger" type="button" onclick="eliminarDelCarrito(${it.productoId})">Quitar</button>
                </div>
            </div>
        `;
    }).join("");

    totalEl.textContent = `Total: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(total)}`;
}

function cambiarCantidadCarrito(productoId, delta) {
    const items = leerCarrito();
    const idx = items.findIndex(i => Number(i.productoId) === Number(productoId));
    if (idx === -1) return;

    const actual = Number(items[idx].cantidad) || 0;
    const nuevo = actual + delta;
    if (nuevo <= 0) {
        items.splice(idx, 1);
    } else {
        const stock = stockDisponible(productoId);
        if (stock !== null && nuevo > stock) {
            alert(`No puedes agregar más. Stock disponible: ${stock}`);
            return;
        }
        items[idx].cantidad = nuevo;
    }
    guardarCarrito(items);
    renderCarrito();
}

function eliminarDelCarrito(productoId) {
    const items = leerCarrito().filter(i => Number(i.productoId) !== Number(productoId));
    guardarCarrito(items);
    renderCarrito();
}

function agregarAlCarrito(productoId, cantidad) {
    if (!puedeArmarPedido() || !tieneClienteSeleccionado()) {
        alert("Primero selecciona un cliente en Pedidos para poder armar el carrito.");
        location.href = "pedidos.html";
        return;
    }

    const producto = productos.find(p => Number(p.id) === Number(productoId));
    if (!producto) {
        alert("Producto no encontrado");
        return;
    }

    const cant = Math.floor(Number(cantidad) || 0);
    if (cant <= 0) {
        alert("Cantidad inválida");
        return;
    }

    const stock = typeof producto.stock === "number" ? producto.stock : stockDisponible(productoId);
    if (stock !== null && stock <= 0) {
        alert("Este producto no tiene stock");
        return;
    }
    if (stock !== null && cant > stock) {
        alert(`Stock insuficiente. Disponible: ${stock}`);
        return;
    }

    const items = leerCarrito();
    const idx = items.findIndex(i => Number(i.productoId) === Number(producto.id));
    if (idx === -1) {
        items.push({
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenUrl: producto.imagenUrl,
            cantidad: cant
        });
    } else {
        const nuevaCantidad = (Number(items[idx].cantidad) || 0) + cant;
        if (stock !== null && nuevaCantidad > stock) {
            const disponibleParaAgregar = stock - (Number(items[idx].cantidad) || 0);
            if (disponibleParaAgregar <= 0) {
                alert(`No puedes agregar más. Stock disponible: ${stock}`);
                return;
            }
            items[idx].cantidad = stock;
            guardarCarrito(items);
            alert(`Solo se agregaron ${disponibleParaAgregar} unidades. Stock disponible: ${stock}`);
            return;
        }
        items[idx].cantidad = nuevaCantidad;
    }

    guardarCarrito(items);
    alert("✅ Agregado al carrito");
}

function finalizarPedido() {
    if (!puedeArmarPedido()) {
        alert("No tienes permisos para registrar pedidos");
        return;
    }
    if (!tieneClienteSeleccionado()) {
        alert("Primero selecciona el cliente en Pedidos");
        location.href = "pedidos.html";
        return;
    }

    const items = leerCarrito();
    if (items.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    const payload = {
        cliente: clientePedido,
        vendedor: vendedorPedido || usuarioSesion.username,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
    };

    fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Error registrando pedido");
            }
            return res.json();
        })
        .then(pedidoCreado => {
            localStorage.removeItem("carritoPedido");
            localStorage.removeItem("pedidoCliente");
            localStorage.removeItem("pedidoVendedor");
            cerrarCarrito();
            alert(`✅ Pedido #${pedidoCreado.id} registrado`);
            location.href = "pedidos.html";
        })
        .catch(err => {
            alert(`❌ No se pudo registrar el pedido: ${err.message}`);
        });
}

function cargarCatalogo() {
    fetch("/api/productos/catalogo")
    .then(res => res.json())
    .then(data => {
        productos = data;
        reconstruirStockMap();
        reconciliarCarritoConStock();
        asegurarUIBarraPedido();
        cargarCategorias(productos);
        mostrarProductos(productos);
    })
    .catch(err => console.error("Error cargando catálogo:", err));
}

function cargarCategorias(lista) {
    const select = document.getElementById("categoria-select");
    const categorias = [...new Set(lista.map(p => p.categoria))].filter(Boolean);
    
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function mostrarProductos(lista) {
    const contenedor = document.getElementById("catalogo-grid");
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <p style="font-size: 1.2rem; color: #666;">No encontramos productos que coincidan con tu búsqueda.</p>
                <button class="btn-secondary" onclick="resetFiltros()" style="margin-top: 1rem;">Ver todo el catálogo</button>
            </div>
        `;
        return;
    }

    // Agrupar productos por categoría
    const productosPorCategoria = {};
    lista.forEach(producto => {
        const categoria = producto.categoria || 'General';
        if (!productosPorCategoria[categoria]) {
            productosPorCategoria[categoria] = [];
        }
        productosPorCategoria[categoria].push(producto);
    });

    const puedePedido = puedeArmarPedido();
    const tieneCliente = tieneClienteSeleccionado();

    // Mostrar productos agrupados
    Object.keys(productosPorCategoria).sort().forEach(categoria => {
        // Crear sección de categoría
        const section = document.createElement("section");
        section.className = "category-section";

        // Título de categoría
        const titulo = document.createElement("h2");
        titulo.className = "category-title";
        titulo.textContent = categoria;
        section.appendChild(titulo);

        // Contenedor de productos de esta categoría (SOLO CSS, NO inline styles)
        const gridProductos = document.createElement("div");
        gridProductos.className = "products-grid";

        // Añadir cada producto a la categoría
        productosPorCategoria[categoria].forEach(p => {
            let precioMostrar;
            let simboloMoneda;
            if (monedaActualCatalogo === "USD") {
                precioMostrar = (p.precio * tasaCambioCatalogo).toFixed(2);
                simboloMoneda = "US$";
            } else {
                precioMostrar = p.precio;
                simboloMoneda = "$";
            }

            const formattedPrice = monedaActualCatalogo === "USD"
                ? `${simboloMoneda}${precioMostrar}`
                : new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                }).format(precioMostrar);

            const card = document.createElement("article");
            card.className = "product-card-premium";

            const stock = typeof p.stock === "number" ? p.stock : null;
            const sinStock = stock !== null && stock <= 0;
            const descripcion = (p.descripcion || "").trim();
            const chips = `
                <div class="product-chips">
                    ${usuarioSesion && typeof p.stock === "number"
                        ? (sinStock
                            ? `<span class="chip chip-out">Sin stock</span>`
                            : `<span class="chip chip-in">Stock ${p.stock}</span>`)
                        : ``}
                    <span class="chip chip-ship">Envío nacional</span>
                    <span class="chip chip-safe">Pago seguro</span>
                </div>
            `;

            const puedeAgregar = puedePedido && tieneCliente && !sinStock;
            const accionesPedido = puedePedido ? `
                <div class="pedido-actions-card ${!tieneCliente ? "disabled" : ""}">
                    <input class="pedido-cantidad" type="number" min="1" ${stock !== null ? `max="${stock}"` : ""} value="1" id="qty-${p.id}" ${!tieneCliente || sinStock ? "disabled" : ""}>
                    <button class="${tieneCliente ? "btn-success" : "btn-secondary"}" ${!tieneCliente || sinStock ? "disabled" : ""} onclick="${puedeAgregar ? `agregarAlCarrito(${p.id}, document.getElementById('qty-${p.id}').value)` : `location.href='pedidos.html'`}">
                        ${sinStock ? "Sin stock" : (tieneCliente ? "Agregar" : "Elegir cliente")}
                    </button>
                </div>
                ${!tieneCliente ? `<div class="pedido-hint">Primero elige un cliente en Pedidos para habilitar el carrito.</div>` : ``}
            ` : ``;

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${p.imagenUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                         alt="${p.nombre}" 
                         class="product-img-premium">
                    <span class="category-tag-premium">${p.categoria || 'General'}</span>
                </div>
                <div class="product-content-premium">
                    ${p.referencia ? `<p style="font-size: 12px; color: #6c757d; margin: 0;">Ref: ${p.referencia}</p>` : ''}
                    <h3 class="product-title-premium">${p.nombre}</h3>
                    ${descripcion ? `<p class="product-desc-premium">${descripcion}</p>` : ``}
                    <p class="product-price-premium">${formattedPrice}</p>
                    ${chips}
                    ${puedeArmarPedido() ? `
                        <div class="product-actions-footer">
                            ${accionesPedido}
                        </div>
                    ` : `
                        <div class="product-actions-footer"></div>
                    `}
                </div>
            `;

            gridProductos.appendChild(card);
        });

        section.appendChild(gridProductos);
        contenedor.appendChild(section);
    });
}

// Función para alternar moneda en el catálogo
async function toggleCurrencyCatalogo() {
    const btn = document.getElementById("btn-convertir-catalogo");
    const span = document.getElementById("moneda-actual-catalogo");

    // Obtener tasa de cambio en vivo
    if (monedaActualCatalogo === "COP") {
        try {
            const res = await fetch("/api/currency/rate?from=COP&to=USD");
            tasaCambioCatalogo = await res.json();
        } catch (e) {
            console.error("Error al obtener la tasa:", e);
        }
        monedaActualCatalogo = "USD";
        btn.textContent = "Mostrar precios en COP";
    } else {
        monedaActualCatalogo = "COP";
        btn.textContent = "Mostrar precios en USD";
    }

    span.textContent = `Moneda: ${monedaActualCatalogo}`;
    mostrarProductos(productos);
}

function filtrar() {
    const texto = document.getElementById("buscar-input").value.toLowerCase();
    const categoria = document.getElementById("categoria-select").value;

    const filtrados = productos.filter(p => {
        const coincideNombre = p.nombre.toLowerCase().includes(texto);
        const coincideReferencia = p.referencia && p.referencia.toLowerCase().includes(texto);
        const coincideCategoria = !categoria || p.categoria === categoria;
        return (coincideNombre || coincideReferencia) && coincideCategoria;
    });

    mostrarProductos(filtrados);
}

function resetFiltros() {
    document.getElementById("buscar-input").value = "";
    document.getElementById("categoria-select").value = "";
    mostrarProductos(productos);
}

document.getElementById("buscar-input").addEventListener("input", filtrar);
document.getElementById("categoria-select").addEventListener("change", filtrar);

// Inicializar
cargarCatalogo();
