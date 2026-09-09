(function () {
'use strict';

const POLLING_STOCK_MS = 10_000;
let productos = [];
let stockPorProducto = {};

let monedaActualCatalogo = "COP";
let tasaCambioCatalogo = 0.00025;
let pollingTimer = null;
let reservasCargadas = false;

const usuarioSesion = JSON.parse(localStorage.getItem("usuario") || "null");
const clientePedido = (localStorage.getItem("pedidoCliente") || "").trim();
const vendedorPedido = (localStorage.getItem("pedidoVendedor") || "").trim();
const usernameReservas = (usuarioSesion && usuarioSesion.username) ? usuarioSesion.username : null;

const $ = (id) => document.getElementById(id);

// ====================== UTILS ======================
function puedeArmarPedido() {
    if (!usuarioSesion) return false;
    return usuarioSesion.rol === "ADMIN" || usuarioSesion.rol === "VENDEDOR";
}
function tieneClienteSeleccionado() {
    return clientePedido.length > 0;
}
function stockDisponible(productoId) {
    const pid = String(productoId);
    if (Object.prototype.hasOwnProperty.call(stockPorProducto, pid)) {
        const v = stockPorProducto[pid];
        if (v === null || v === undefined || Number.isNaN(v)) return null;
        return v;
    }
    return null;
}
function stockFisico(productoId) {
    const p = (Array.isArray(productos) ? productos : []).find(x => String(x.id) === String(productoId));
    if (p && typeof p.stock === "number") return p.stock;
    return null;
}

function reconstruirStockMap() {
    const map = {};
    (Array.isArray(productos) ? productos : []).forEach(p => {
        if (!p || typeof p.id === "undefined") return;
        let valor;
        if (typeof p.stockDisponible === "number") valor = p.stockDisponible;
        else if (typeof p.stock === "number") valor = p.stock;
        else valor = null;
        map[String(p.id)] = valor;
    });
    stockPorProducto = map;
}

// ====================== RESERVAS (BACKEND) ======================
async function apiAjustarReserva({productoId, delta, cantidadFinal}) {
    if (!usernameReservas) return { ok:false, error:"Sin sesión de vendedor" };
    const url = "/api/productos/stock/reservas/ajustar";
    const body = { productoId, vendedorUsername: usernameReservas };
    if (typeof cantidadFinal === "number") body.cantidadFinal = Math.max(0, cantidadFinal);
    else if (typeof delta === "number") body.delta = delta;
    try {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!r.ok) {
            let t; try { t = await r.text(); } catch(_){}
            return { ok:false, error: t || ("HTTP "+r.status) };
        }
        const json = await r.json();
        if (json && typeof json.stockDisponibleRestante === "number" && productoId != null) {
            stockPorProducto[String(productoId)] = Math.max(0, json.stockDisponibleRestante);
        }
        return json;
    } catch (e) {
        return { ok:false, error: (e && e.message) || "Error de red al ajustar reserva" };
    }
}
async function apiLiberarProducto(productoId) {
    if (!usernameReservas) return { ok:false };
    try {
        const r = await fetch(`/api/productos/stock/reservas/liberar/${encodeURIComponent(usernameReservas)}/${encodeURIComponent(productoId)}`, { method:"DELETE" });
        const j = await r.json().catch(() => ({}));
        return j || {};
    } catch(e){ return { ok:false }; }
}
async function apiLiberarTodo() {
    if (!usernameReservas) return { ok:false };
    try {
        const r = await fetch(`/api/productos/stock/reservas/liberar-vendedor/${encodeURIComponent(usernameReservas)}`, { method:"DELETE" });
        const j = await r.json().catch(() => ({}));
        return j || {};
    } catch(e){ return { ok:false }; }
}
async function apiMisReservas() {
    if (!usernameReservas) return {};
    try {
        const r = await fetch(`/api/productos/stock/reservas/mis-reservas/${encodeURIComponent(usernameReservas)}`);
        if (!r.ok) return {};
        return await r.json();
    } catch(e){ return {}; }
}

/**
 * Reconciliación: al entrar, si el backend tenía reservas viejas (por cierre de pestaña) pero
 * el localStorage del carrito no coincide → liberamos lo que no esté en carrito.
 */
async function reconciliarReservasAlInicio() {
    if (!puedeArmarPedido() || !usernameReservas) return;
    reservasCargadas = true;
    try {
        const misReservas = await apiMisReservas();
        if (!misReservas || Object.keys(misReservas).length === 0) return;
        const enCarrito = {};
        leerCarrito().forEach(it => {
            if (!it || it.productoId == null) return;
            const q = Number(it.cantidad) || 0;
            enCarrito[String(it.productoId)] = q;
        });
        for (const k of Object.keys(misReservas)) {
            const reservadoEnBD = Number(misReservas[k]) || 0;
            const enCarritoAhora = Number(enCarrito[k]) || 0;
            const pid = Number(k);
            if (Number.isNaN(pid)) continue;
            if (reservadoEnBD !== enCarritoAhora) {
                await apiAjustarReserva({ productoId: pid, cantidadFinal: enCarritoAhora });
            }
        }
    } catch (e) {
        console.warn("Reconciliación de reservas saltada:", e);
    }
}

// ====================== CARRITO ======================
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
function cantidadEnCarritoDe(productoId) {
    const it = leerCarrito().find(i => String(i.productoId) === String(productoId));
    return it ? (Number(it.cantidad) || 0) : 0;
}

// ============ UI: Barra + modal ============
function asegurarUIBarraPedido() {
    const main = document.querySelector("main.container");
    if (!main) return;

    if (!$("pedido-bar")) {
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
            </div>`;
        const firstSection = main.querySelector("section");
        if (firstSection) main.insertBefore(bar, firstSection);
        else main.prepend(bar);
    }

    if (!$("carrito-modal")) {
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
            </div>`;
        document.body.appendChild(modal);
    }

    $("btn-ver-carrito")?.addEventListener("click", abrirCarrito);
    $("btn-cerrar-carrito")?.addEventListener("click", cerrarCarrito);
    $("btn-vaciar-carrito")?.addEventListener("click", vaciarCarrito);
    $("btn-finalizar")?.addEventListener("click", finalizarPedido);
    $("btn-finalizar-modal")?.addEventListener("click", finalizarPedido);

    actualizarUIBarraPedido();
}

function actualizarUIBarraPedido() {
    const badge = $("pedido-badge");
    const sub = $("pedido-sub");
    const countEl = $("carrito-count");
    const btnFinalizar = $("btn-finalizar");
    const btnCarrito = $("btn-ver-carrito");
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
    $("carrito-modal")?.classList.remove("oculto");
}
function cerrarCarrito() {
    $("carrito-modal")?.classList.add("oculto");
}

async function vaciarCarrito() {
    const ok = await uiConfirm("¿Vaciar el carrito? Esto libera todo el stock apartado para ti.");
    if (!ok) return;
    if (puedeArmarPedido() && usernameReservas) await apiLiberarTodo();
    guardarCarrito([]);
    actualizarStockUI();
    renderCarrito();
}

function renderCarrito() {
    const cont = $("carrito-items");
    const totalEl = $("carrito-total");
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
        const fisico = stockFisico(it.productoId);
        let stockTexto = "";
        if (stock !== null && fisico !== null) {
            const apartado = Math.max(0, fisico - stock);
            stockTexto = apartado > 0
                ? ` · Disponible para ti: ${stock} (apartado por otros: ${apartado})`
                : ` · Disponible: ${stock}`;
        } else if (stock !== null) {
            stockTexto = ` · Disponible: ${stock}`;
        }
        const cantActual = Number(it.cantidad) || 0;
        const plusDisabled = stock !== null && cantActual >= stock;
        return `
            <div class="carrito-item">
                <div class="carrito-item-main">
                    <div class="carrito-item-title">${esc(it.nombre || "")}</div>
                    <div class="carrito-item-sub">Cant: ${it.cantidad}${stockTexto} · ${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(it.precio)}</div>
                </div>
                <div class="carrito-item-actions">
                    <button class="btn-secondary" type="button" data-cant="${it.productoId}:-1">-</button>
                    <button class="btn-secondary" type="button" ${plusDisabled ? "disabled" : ""} data-cant="${it.productoId}:1">+</button>
                    <button class="btn-danger" type="button" data-quitar="${it.productoId}">Quitar</button>
                </div>
            </div>`;
    }).join("");

    // Bind delegado
    cont.querySelectorAll("button[data-cant]").forEach(b => {
        b.addEventListener("click", () => {
            const parts = String(b.getAttribute("data-cant")).split(":");
            const pid = Number(parts[0]);
            const delta = Number(parts[1]) || 0;
            cambiarCantidadCarrito(pid, delta);
        });
    });
    cont.querySelectorAll("button[data-quitar]").forEach(b => {
        b.addEventListener("click", () => {
            const pid = Number(b.getAttribute("data-quitar"));
            eliminarDelCarrito(pid);
        });
    });

    totalEl.textContent = `Total: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(total)}`;
}

async function cambiarCantidadCarrito(productoId, delta) {
    const items = leerCarrito();
    const idx = items.findIndex(i => Number(i.productoId) === Number(productoId));
    if (idx === -1) return;
    const actual = Number(items[idx].cantidad) || 0;
    const nuevo = actual + delta;

    // Paso 1: pedir permiso al backend (ajuste de reserva)
    const resp = await apiAjustarReserva({ productoId, cantidadFinal: Math.max(0, nuevo) });
    if (!resp || !resp.ok) {
        const msg = (resp && resp.error) ? resp.error : "No se pudo ajustar el stock apartado";
        alert(msg);
        renderCarrito();
        return;
    }

    if (nuevo <= 0) items.splice(idx, 1);
    else items[idx].cantidad = nuevo;

    guardarCarrito(items);
    actualizarStockUI();
    renderCarrito();
}

async function eliminarDelCarrito(productoId) {
    const resp = await apiAjustarReserva({ productoId, cantidadFinal: 0 });
    if (!resp || !resp.ok) {
        const msg = (resp && resp.error) ? resp.error : "No se pudo liberar el stock";
        alert(msg);
        renderCarrito();
        return;
    }
    const items = leerCarrito().filter(i => Number(i.productoId) !== Number(productoId));
    guardarCarrito(items);
    actualizarStockUI();
    renderCarrito();
}

async function agregarAlCarrito(productoId, cantidad) {
    if (!puedeArmarPedido() || !tieneClienteSeleccionado()) {
        alert("Primero selecciona un cliente en Pedidos para poder armar el carrito.");
        location.href = "pedidos.html";
        return;
    }
    const producto = productos.find(p => Number(p.id) === Number(productoId));
    if (!producto) { alert("Producto no encontrado"); return; }
    const cant = Math.floor(Number(cantidad) || 0);
    if (cant <= 0) { alert("Cantidad inválida"); return; }

    const stockDisp = stockDisponible(productoId);
    if (stockDisp !== null && stockDisp <= 0) {
        alert("Este producto no tiene stock disponible");
        return;
    }
    const yaEnCarrito = cantidadEnCarritoDe(productoId);
    const totalDeseado = yaEnCarrito + cant;
    if (stockDisp !== null && totalDeseado > stockDisp) {
        const maxAgregar = Math.max(0, stockDisp - yaEnCarrito);
        if (maxAgregar <= 0) {
            alert(`No puedes agregar más. Disponible: ${stockDisp}`);
            return;
        }
        const ok = await uiConfirm(`Stock disponible: ${stockDisp}. Ya tienes ${yaEnCarrito} en tu carrito.\n¿Agregar solo las ${maxAgregar} unidades posibles?`);
        if (!ok) return;
        // Intentar reservar con maxAgregar extra
        const resp = await apiAjustarReserva({ productoId, cantidadFinal: yaEnCarrito + maxAgregar });
        if (!resp || !resp.ok) {
            alert((resp && resp.error) ? resp.error : "No se pudo apartar el stock");
            return;
        }
        const items = leerCarrito();
        const idx = items.findIndex(i => Number(i.productoId) === Number(productoId));
        if (idx === -1) {
            items.push({
                productoId: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagenUrl: producto.imagenUrl,
                cantidad: maxAgregar
            });
        } else items[idx].cantidad = stockDisp;
        guardarCarrito(items);
        actualizarStockUI();
        renderCarrito();
        alert(`Solo se agregaron ${maxAgregar} unidades. Stock disponible: ${stockDisp}`);
        return;
    }

    // Reserva OK en backend → luego guardar local
    const resp = await apiAjustarReserva({ productoId, cantidadFinal: totalDeseado });
    if (!resp || !resp.ok) {
        alert((resp && resp.error) ? resp.error : "No se pudo apartar el stock");
        return;
    }
    const items = leerCarrito();
    const idx = items.findIndex(i => Number(i.productoId) === Number(productoId));
    if (idx === -1) {
        items.push({
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenUrl: producto.imagenUrl,
            cantidad: cant
        });
    } else {
        items[idx].cantidad = totalDeseado;
    }
    guardarCarrito(items);
    actualizarStockUI();
    alert("✅ Agregado al carrito");
}

async function finalizarPedido() {
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
    if (items.length === 0) { alert("El carrito está vacío"); return; }

    const payload = {
        cliente: clientePedido,
        vendedor: vendedorPedido || usuarioSesion.username,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
    };

    try {
        const res = await fetch("/api/pedidos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Error registrando pedido");
        }
        const pedidoCreado = await res.json();

        // Local cleanup (backend ya borró las reservas de este pedido al confirmar)
        localStorage.removeItem("carritoPedido");
        localStorage.removeItem("pedidoCliente");
        localStorage.removeItem("pedidoVendedor");
        cerrarCarrito();
        alert(`✅ Pedido #${pedidoCreado.id} registrado`);
        // Recargar catálogo para reflejar nuevo stock físico
        await cargarCatalogo();
        setTimeout(() => { location.href = "pedidos.html"; }, 400);
    } catch (err) {
        alert(`❌ No se pudo registrar el pedido: ${err.message}`);
    }
}

// ====================== CATÁLOGO ======================
function cargarCategorias(lista) {
    const select = $("categoria-select");
    if (!select) return;
    select.innerHTML = `<option value="">Todas las categorías</option>`;
    const cats = [...new Set(lista.map(p => p.categoria))].filter(Boolean);
    cats.forEach(cat => {
        const o = document.createElement("option");
        o.value = cat;
        o.textContent = cat;
        select.appendChild(o);
    });
}

function esc(str){
    if (str == null) return "";
    return String(str)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function actualizarStockUI() {
    // Actualizar los chips y los max de inputs en cada card
    document.querySelectorAll("article.product-card-premium").forEach(card => {
        const pid = card.getAttribute("data-id");
        if (!pid) return;
        const prod = productos.find(p => String(p.id) === String(pid));
        if (!prod) return;
        const stock = stockDisponible(pid);
        const fisico = typeof prod.stock === "number" ? prod.stock : null;
        const chipIn = card.querySelector(".chip.chip-in");
        const chipOut = card.querySelector(".chip.chip-out");
        const input = card.querySelector("input.pedido-cantidad");
        const btnAgregar = card.querySelector("button[data-agregar]");
        if (stock === null) return;
        if (stock <= 0) {
            if (chipIn) chipIn.style.display = "none";
            if (chipOut) {
                chipOut.style.display = "inline-flex";
                chipOut.textContent = "Sin stock";
            }
            if (input) { input.disabled = true; input.value = 1; }
            if (btnAgregar) { btnAgregar.disabled = true; btnAgregar.textContent = "Sin stock"; }
        } else {
            let label = `Stock ${stock}`;
            if (fisico !== null && fisico > stock) {
                label += ` (${fisico - stock} apartado)`;
            }
            if (chipIn) { chipIn.style.display = "inline-flex"; chipIn.textContent = label; }
            if (chipOut) chipOut.style.display = "none";
            if (input) { input.disabled = false; input.max = String(stock); if (Number(input.value) > stock) input.value = String(stock); else if (!input.value) input.value = "1"; }
            if (btnAgregar) {
                const tieneCliente = tieneClienteSeleccionado();
                btnAgregar.disabled = !tieneCliente;
                btnAgregar.textContent = tieneCliente ? "Agregar" : "Elegir cliente";
            }
        }
    });
}

function mostrarProductos(lista) {
    const contenedor = $("catalogo-grid");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <p style="font-size: 1.2rem; color: #666;">No encontramos productos que coincidan con tu búsqueda.</p>
                <button class="btn-secondary" onclick="window.resetFiltros && window.resetFiltros()" style="margin-top: 1rem;">Ver todo el catálogo</button>
            </div>`;
        return;
    }
    const productosPorCategoria = {};
    lista.forEach(producto => {
        const categoria = producto.categoria || 'General';
        if (!productosPorCategoria[categoria]) productosPorCategoria[categoria] = [];
        productosPorCategoria[categoria].push(producto);
    });
    const puedePedido = puedeArmarPedido();
    const tieneCliente = tieneClienteSeleccionado();

    Object.keys(productosPorCategoria).sort().forEach(categoria => {
        const section = document.createElement("section");
        section.className = "category-section";
        const titulo = document.createElement("h2");
        titulo.className = "category-title";
        titulo.textContent = categoria;
        section.appendChild(titulo);
        const gridProductos = document.createElement("div");
        gridProductos.className = "products-grid";

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
                    style: 'currency', currency: 'COP', maximumFractionDigits: 0
                  }).format(precioMostrar);

            const stock = stockDisponible(p.id);
            const fisico = typeof p.stock === "number" ? p.stock : null;
            const sinStock = stock !== null && stock <= 0;
            const descripcion = (p.descripcion || "").trim();
            let stockLabel = `Stock ${stock ?? (fisico ?? "—")}`;
            if (stock !== null && fisico !== null && fisico > stock) {
                stockLabel += ` (${fisico - stock} apartado)`;
            }
            const chips = `
                <div class="product-chips">
                    ${usuarioSesion && (stock !== null || fisico !== null)
                        ? (sinStock
                            ? `<span class="chip chip-out">Sin stock</span>`
                            : `<span class="chip chip-in">${stockLabel}</span>`)
                        : ``}
                    <span class="chip chip-ship">Envío nacional</span>
                    <span class="chip chip-safe">Pago seguro</span>
                </div>`;
            const puedeAgregar = puedePedido && tieneCliente && !sinStock;
            const accionesPedido = puedePedido ? `
                <div class="pedido-actions-card ${!tieneCliente ? "disabled" : ""}">
                    <input class="pedido-cantidad" type="number" min="1" ${stock !== null ? `max="${stock}"` : ""} value="1" id="qty-${p.id}" ${!tieneCliente || sinStock ? "disabled" : ""}>
                    <button class="${tieneCliente && !sinStock ? "btn-success" : "btn-secondary"}" type="button" ${!tieneCliente || sinStock ? "disabled" : ""} data-agregar="${p.id}">
                        ${sinStock ? "Sin stock" : (tieneCliente ? "Agregar" : "Elegir cliente")}
                    </button>
                </div>
                ${!tieneCliente ? `<div class="pedido-hint">Primero elige un cliente en Pedidos para habilitar el carrito.</div>` : ``}
            ` : ``;

            const card = document.createElement("article");
            card.className = "product-card-premium";
            card.setAttribute("data-id", String(p.id));
            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${p.imagenUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                         alt="${esc(p.nombre)}" class="product-img-premium">
                    <span class="category-tag-premium">${esc(p.categoria || 'General')}</span>
                </div>
                <div class="product-content-premium">
                    ${p.referencia ? `<p style="font-size: 12px; color: #6c757d; margin: 0;">Ref: ${esc(p.referencia)}</p>` : ''}
                    <h3 class="product-title-premium">${esc(p.nombre)}</h3>
                    ${descripcion ? `<p class="product-desc-premium">${esc(descripcion)}</p>` : ``}
                    <p class="product-price-premium">${formattedPrice}</p>
                    ${chips}
                    ${puedeArmarPedido() ? `
                        <div class="product-actions-footer">${accionesPedido}</div>
                    ` : `<div class="product-actions-footer"></div>`}
                </div>`;
            gridProductos.appendChild(card);
        });

        section.appendChild(gridProductos);
        contenedor.appendChild(section);
    });

    // Bind eventos agregar
    contenedor.querySelectorAll("button[data-agregar]").forEach(btn => {
        btn.addEventListener("click", () => {
            const pid = Number(btn.getAttribute("data-agregar"));
            const qtyEl = document.getElementById("qty-" + pid);
            const qty = qtyEl ? qtyEl.value : 1;
            agregarAlCarrito(pid, qty);
        });
    });

    actualizarStockUI();
}

async function cargarCatalogo() {
    try {
        const res = await fetch("/api/productos/catalogo");
        const data = await res.json();
        productos = Array.isArray(data) ? data : [];
        reconstruirStockMap();
        asegurarUIBarraPedido();
        cargarCategorias(productos);
        mostrarProductos(productos);
    } catch(err) {
        console.error("Error cargando catálogo:", err);
    }
}

async function toggleCurrencyCatalogo() {
    const btn = $("btn-convertir-catalogo");
    const span = $("moneda-actual-catalogo");
    if (monedaActualCatalogo === "COP") {
        try {
            const res = await fetch("/api/currency/rate?from=COP&to=USD");
            tasaCambioCatalogo = await res.json();
        } catch (e) { console.error("Error al obtener la tasa:", e); }
        monedaActualCatalogo = "USD";
        if (btn) btn.textContent = "Mostrar precios en COP";
    } else {
        monedaActualCatalogo = "COP";
        if (btn) btn.textContent = "Mostrar precios en USD";
    }
    if (span) span.textContent = `Moneda: ${monedaActualCatalogo}`;
    mostrarProductos(productos);
}

function filtrar() {
    const buscar = $("buscar-input");
    const catSel = $("categoria-select");
    const texto = (buscar ? buscar.value : "").toLowerCase();
    const categoria = catSel ? catSel.value : "";
    const filtrados = productos.filter(p => {
        const coincideNombre = (p.nombre || "").toLowerCase().includes(texto);
        const coincideReferencia = p.referencia && (String(p.referencia)).toLowerCase().includes(texto);
        const coincideCategoria = !categoria || p.categoria === categoria;
        return (coincideNombre || coincideReferencia) && coincideCategoria;
    });
    mostrarProductos(filtrados);
}

function resetFiltros() {
    const b = $("buscar-input"); if (b) b.value = "";
    const c = $("categoria-select"); if (c) c.value = "";
    mostrarProductos(productos);
}
window.resetFiltros = resetFiltros;
window.toggleCurrencyCatalogo = toggleCurrencyCatalogo;
window.filtrar = filtrar;

function uiConfirm(msg) {
    if (window.uiConfirm && window.uiConfirm !== uiConfirm) {
        try { return Promise.resolve(window.uiConfirm(msg)); }
        catch(e){}
    }
    return Promise.resolve(confirm(msg));
}

// Polling de stock
function iniciarPollingStock() {
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(async () => {
        try {
            const res = await fetch("/api/productos/catalogo");
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data)) return;
            const idToDisp = {};
            data.forEach(p => {
                if (!p || p.id == null) return;
                let disp = typeof p.stockDisponible === "number" ? p.stockDisponible :
                           (typeof p.stock === "number" ? p.stock : null);
                idToDisp[String(p.id)] = { stock: typeof p.stock === "number" ? p.stock : null, disp };
            });
            // Mergear a productos locales (mantener filtros actuales — solo actualiza arrays)
            let cambios = false;
            productos.forEach((p, idx) => {
                const d = idToDisp[String(p.id)];
                if (!d) return;
                if (d.stock !== null) { productos[idx].stock = d.stock; cambios = true; }
                if (d.disp !== null) { productos[idx].stockDisponible = d.disp; cambios = true; }
            });
            if (cambios) {
                reconstruirStockMap();
                actualizarStockUI();
                if (!$("carrito-modal")?.classList.contains("oculto")) renderCarrito();
            }
        } catch(e){}
    }, POLLING_STOCK_MS);
}

// Binds de entrada
document.addEventListener("DOMContentLoaded", async () => {
    $("buscar-input")?.addEventListener("input", filtrar);
    $("categoria-select")?.addEventListener("change", filtrar);
    $("btn-convertir-catalogo")?.addEventListener("click", toggleCurrencyCatalogo);

    await cargarCatalogo();
    if (puedeArmarPedido()) {
        await reconciliarReservasAlInicio();
        // Luego de reconciliar, refrescamos carrito visual
        if (cantidadCarrito() > 0) actualizarStockUI();
        iniciarPollingStock();
    }
});

// Al cerrar pestaña intentar liberar todo (mejor esfuerzo)
window.addEventListener("beforeunload", () => {
    if (!puedeArmarPedido() || !usernameReservas) return;
    const items = leerCarrito();
    // Si el carrito está vacío, liberar todo directo (mejor esfuerzo, sin await)
    if (!items || items.length === 0) {
        try {
            navigator.sendBeacon && navigator.sendBeacon(
                `/api/productos/stock/reservas/liberar-vendedor/${encodeURIComponent(usernameReservas)}`,
                new Blob([""], {type:"text/plain"})
            );
        } catch(_) {}
    }
});

})();
