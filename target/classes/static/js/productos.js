(function(){
'use strict';

// ===== PROTECCIÓN =====
try {
    const raw = localStorage.getItem("usuario");
    const usuario = raw ? JSON.parse(raw) : null;
    if (!usuario) { window.location.href = "login.html"; return; }
    const rol = String(usuario.rol || "").toUpperCase();
    if (rol !== "ADMIN" && rol !== "ADMINISTRADOR" && rol !== "SUPER_ADMIN" && rol !== "SUPERADMIN" && rol !== "ROOT") {
        alert("No tienes acceso");
        window.location.href = "home.html";
        return;
    }
} catch (e) {
    console.error(e);
}

// ===== VARIABLES GLOBALES =====
let productosOriginales = [];
let monedaActual = "COP";
let tasaCambio = 0.00025;
const CATEGORIAS_DEFAULT = ["LLAVEROS","PORTADOCUMENTOS","MEDIAS","BOLSOS","MANOS_LIBRES"];
const $ = (id) => document.getElementById(id);
const SwalOK = () => (typeof Swal !== "undefined");

// ===== AYUDA: ESCAPAR HTML =====
function esc(str){
    if (str == null) return "";
    return String(str)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function escSingle(str){
    if (str == null) return "";
    return String(str).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
}
function fmtMoneda(val, moneda){
    const n = Number(val) || 0;
    if (moneda === "USD") {
        return "US$" + n.toFixed(2);
    }
    try { return "$" + n.toLocaleString("es-CO", {minimumFractionDigits:2, maximumFractionDigits:2}); }
    catch(e){ return "$" + n.toFixed(2); }
}

// ===== TOAST =====
function toastOk(title, text){
    if (SwalOK()) {
        Swal.fire({icon:'success', title, text: text || "", timer:1300, showConfirmButton:false});
    } else if (text) { alert(title + "\n" + text); } else { alert(title); }
}
function toastWarn(title, text){
    if (SwalOK()) {
        Swal.fire({icon:'warning', title, text: text || ""});
    } else {
        alert(title + (text ? "\n" + text : ""));
    }
}
function toastErr(title, text){
    if (SwalOK()) {
        Swal.fire({icon:'error', title, text: text || ""});
    } else {
        alert(title + (text ? "\n" + text : ""));
    }
}
function confirmar(mensaje){
    if (window.uiConfirm) {
        try { return Promise.resolve(window.uiConfirm(mensaje)); } catch(e){}
    }
    if (SwalOK()) {
        return Swal.fire({
            title: '¿Estás seguro?',
            text: mensaje,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        }).then(r => r && r.isConfirmed ? true : false);
    }
    return Promise.resolve(confirm(mensaje));
}

// ===== CARGAR DATOS =====
function cargarProductos(){
    return fetch("/api/productos")
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            productosOriginales = Array.isArray(data) ? data : [];
            renderizarProductos();
        })
        .catch(err => {
            console.error("Error cargando productos:", err);
            const lista = $("lista");
            if (lista) {
                lista.innerHTML = `<div style="grid-column:1/-1;background:#fee2e2;border:1px solid #fecaca;border-radius:18px;padding:20px;color:#991b1b;">
                    <b>Error al cargar productos:</b> ${esc(err.message||"")}<br>
                    Revisa que la aplicación backend esté encendida.
                </div>`;
            }
        });
}

function cargarCategorias(){
    const select = $("categoria");
    if (!select) return;
    const currentValue = select.value || "";
    return fetch("/api/productos/categorias/lista")
        .then(r => r.ok ? r.json() : [])
        .then((lista = []) => {
            const merged = new Set();
            CATEGORIAS_DEFAULT.forEach(c => merged.add(c));
            lista.forEach(c => {
                if (c && String(c).trim()) merged.add(String(c).toUpperCase().trim());
            });
            select.innerHTML = '<option value="">Seleccionar categoría...</option>';
            merged.forEach(c => {
                const label = String(c).toLowerCase().replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase());
                const o = document.createElement("option");
                o.value = c;
                o.textContent = label;
                select.appendChild(o);
            });
            if (currentValue) {
                for (let opt of select.options) {
                    if (opt.value.toUpperCase() === currentValue.toUpperCase()) {
                        select.value = opt.value;
                        break;
                    }
                }
            }
        })
        .catch(err => console.warn("No se pudieron cargar categorías dinámicas:", err));
}

// ===== RENDER =====
function renderizarProductos(){
    const lista = $("lista");
    if (!lista) return;
    lista.innerHTML = "";
    if (!productosOriginales || productosOriginales.length === 0) {
        lista.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; background: rgba(255,255,255,0.7); border-radius: 20px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 56px;">📦</div>
                <h3 style="margin: 12px 0 6px 0; color:#334155;">Aún no hay productos</h3>
                <p style="color:#64748b;">Guarda tu primer producto en el formulario de arriba.</p>
            </div>`;
        return;
    }
    productosOriginales.forEach(p => {
        const refText = p.referencia
            ? `<p style="color:#2563eb;margin:6px 0;"><b>Ref:</b> ${esc(p.referencia)}</p>`
            : `<p style="color:#ef4444;margin:6px 0;"><b>Ref:</b> <span style="font-style:italic;">Sin referencia</span></p>`;
        const montoTxt = monedaActual === "USD"
            ? "US$" + ((Number(p.precio)||0) * tasaCambio).toFixed(2)
            : fmtMoneda(p.precio, "COP");

        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${esc(p.imagenUrl || 'https://via.placeholder.com/200')}" onerror="this.src='https://via.placeholder.com/200';" style="width:100%;height:200px;object-fit:cover;border-radius:16px;">
            <h3 style="margin:14px 0 6px 0;font-size:18px;color:#0f172a;">${esc(p.nombre)}</h3>
            ${refText}
            <p style="margin:4px 0;color:#475569;">${esc(p.descripcion || "")}</p>
            <p style="margin:4px 0;"><b>Categoría:</b> ${esc(p.categoria || "Sin categoría")}</p>
            <p style="margin:4px 0;"><b>Stock:</b> ${Number(p.stock)||0}</p>
            <p style="margin:8px 0 12px 0;font-weight:800;font-size:18px;color:#ff5a1f;">Precio: ${montoTxt}</p>
            <div class="card-buttons" style="display:flex;gap:10px;">
                <button type="button" class="btn-warning" data-accion="editar" data-id="${p.id}" style="flex:1;">Editar</button>
                <button type="button" class="btn-danger" data-accion="eliminar" data-id="${p.id}" style="flex:1;">Eliminar</button>
            </div>`;
        lista.appendChild(card);
    });
}

// ===== BOTÓN MONEDA =====
async function toggleCurrency(){
    const btn = $("btnConvertir");
    const span = $("currentCurrency");
    if (monedaActual === "COP") {
        try {
            const r = await fetch("/api/currency/rate?from=COP&to=USD");
            if (r.ok) tasaCambio = await r.json();
        } catch(e) {}
        monedaActual = "USD";
        if (btn) btn.textContent = "Mostrar precios en COP";
    } else {
        monedaActual = "COP";
        if (btn) btn.textContent = "Mostrar precios en USD";
    }
    if (span) span.textContent = "Moneda actual: " + monedaActual;
    renderizarProductos();
}

// ===== CATEGORÍA NUEVA =====
function nuevaCategoria(){
    if (!SwalOK()) {
        const nombre = prompt("Nombre de la categoría nueva:");
        agregarCategoria(nombre);
        return;
    }
    Swal.fire({
        title: 'Nueva categoría',
        input: 'text',
        inputLabel: 'Nombre de la categoría',
        inputPlaceholder: 'Ej: Gorras, Morrales, Pegatinas',
        showCancelButton: true,
        confirmButtonText: 'Crear y usar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5a1f',
        inputValidator: (v) => { if (!v || !String(v).trim()) return '¡Escribe un nombre!'; }
    }).then((res) => {
        if (res && res.isConfirmed) agregarCategoria(res.value);
    });
}
function agregarCategoria(raw){
    if (!raw || !String(raw).trim()) return;
    raw = String(raw).trim();
    const val = raw.toUpperCase().replace(/\s+/g,"_").replace(/[^A-Z0-9_Ñ]/g,"");
    if (!val) { toastWarn("Nombre inválido"); return; }
    const label = raw.toLowerCase().replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase());
    const select = $("categoria");
    if (!select) return;
    let existe = false;
    for (let i=0;i<select.options.length;i++){
        if (select.options[i].value && select.options[i].value.toUpperCase() === val) {
            existe = true;
            select.value = select.options[i].value;
            break;
        }
    }
    if (!existe) {
        const o = document.createElement("option");
        o.value = val;
        o.textContent = label + " ✨";
        select.insertBefore(o, select.firstChild.nextSibling ? select.firstChild.nextSibling : select.firstChild);
        select.value = val;
    }
    toastOk("Categoría lista", `Ahora puedes usar "${label}" en este y otros productos.`);
}

// ===== GUARDAR =====
function guardar(){
    const referencia = $("referencia") ? $("referencia").value : "";
    const nombre = $("nombre") ? $("nombre").value : "";
    const descripcion = $("descripcion") ? $("descripcion").value : "";
    const precio = $("precio") ? $("precio").value : "";
    const stock = $("stock") ? $("stock").value : "";
    const categoria = ($("categoria") ? $("categoria").value : "").trim();

    if (!nombre) { toastWarn("Falta el nombre", "Por favor ingresa el nombre del producto"); return; }
    if (!categoria) { toastWarn("Falta la categoría", "Selecciona una categoría o crea una nueva con el botón ➕"); return; }
    if (!precio || parseFloat(precio) <= 0) { toastWarn("Precio inválido", "Ingresa un precio mayor que 0"); return; }
    if (stock === "" || parseInt(stock) < 0) { toastWarn("Stock inválido", "Ingresa un stock válido (mayor o igual a 0)"); return; }

    const id = $("id") ? $("id").value : "";
    const url = id ? `/api/productos/${encodeURIComponent(id)}` : "/api/productos";
    const method = id ? "PUT" : "POST";

    const formData = new FormData();
    formData.append("referencia", referencia || "");
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("categoria", categoria);

    const img = $("imagen");
    if (img && img.files && img.files.length > 0) {
        formData.append("imagen", img.files[0]);
    }

    fetch(url, { method, body: formData })
        .then(r => {
            if (!r.ok) {
                return r.text().then(t => { throw new Error(t || "HTTP "+r.status); });
            }
            return r.json().catch(() => ({}));
        })
        .then(() => {
            toastOk(id ? "Producto actualizado ✅" : "Producto guardado ✅",
                referencia ? `Referencia ${referencia} lista.` : "Producto listo.");
            limpiar();
            cargarCategorias();
            cargarProductos();
        })
        .catch(err => {
            console.error(err);
            toastErr("No se pudo guardar", (err && err.message) ? err.message : "");
        });
}

// ===== EDITAR =====
function editarProducto(p){
    if ($("id")) $("id").value = p.id || "";
    if ($("referencia")) $("referencia").value = p.referencia || "";
    if ($("nombre")) $("nombre").value = p.nombre || "";
    if ($("descripcion")) $("descripcion").value = p.descripcion || "";
    if ($("precio")) $("precio").value = p.precio || "";
    if ($("stock")) $("stock").value = p.stock || "";

    const select = $("categoria");
    if (select && p.categoria) {
        const val = String(p.categoria).toUpperCase();
        let existe = false;
        for (let i=0;i<select.options.length;i++){
            if (select.options[i].value && select.options[i].value.toUpperCase() === val) {
                select.value = select.options[i].value;
                existe = true;
                break;
            }
        }
        if (!existe) {
            const label = String(p.categoria).toLowerCase().replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase());
            const o = document.createElement("option");
            o.value = val;
            o.textContent = label;
            select.appendChild(o);
            select.value = val;
        }
    } else if (select) {
        select.value = "";
    }

    if (p.imagenUrl) {
        const prevC = $("imagen-preview-container");
        const prev = $("imagen-preview");
        if (prevC && prev) {
            prev.src = p.imagenUrl;
            prevC.style.display = "block";
        }
    } else {
        limpiarImagen();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== ELIMINAR =====
function eliminarProducto(id){
    confirmar("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.").then(ok => {
        if (!ok) return;
        fetch(`/api/productos/${encodeURIComponent(id)}`, { method: "DELETE" })
            .then(r => {
                if (r.ok) {
                    toastOk("Producto eliminado");
                    cargarProductos();
                } else {
                    toastErr("No se pudo eliminar", "HTTP "+r.status);
                }
            })
            .catch(err => toastErr("No se pudo eliminar", (err && err.message) ? err.message : ""));
    });
}

// ===== LIMPIAR =====
function limpiarImagen(){
    const img = $("imagen");
    const prevC = $("imagen-preview-container");
    const prev = $("imagen-preview");
    if (img) img.value = "";
    if (prevC) prevC.style.display = "none";
    if (prev) prev.src = "";
}
function limpiar(){
    if ($("id")) $("id").value = "";
    if ($("referencia")) $("referencia").value = "";
    if ($("nombre")) $("nombre").value = "";
    if ($("descripcion")) $("descripcion").value = "";
    if ($("precio")) $("precio").value = "";
    if ($("stock")) $("stock").value = "";
    if ($("categoria")) $("categoria").value = "";
    limpiarImagen();
}

// ===== INICIALIZAR EVENTOS =====
function bind(){
    const btn = $("btnConvertir");
    if (btn) btn.addEventListener("click", toggleCurrency);

    const btnGuardar = document.querySelector('button[type="button"][onclick^="guardar("], #form-producto .btn-success');
    if (btnGuardar) { btnGuardar.onclick = null; btnGuardar.addEventListener("click", guardar); }

    const btnLimpiar = document.querySelector('#form-producto .btn-secondary');
    if (btnLimpiar) { btnLimpiar.onclick = null; btnLimpiar.addEventListener("click", limpiar); }

    // Delegación para editar/eliminar cards
    const lista = $("lista");
    if (lista) {
        lista.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;
            const accion = btn.getAttribute("data-accion");
            const id = btn.getAttribute("data-id");
            if (accion === "editar" && id) {
                const p = productosOriginales.find(x => String(x.id) === String(id));
                if (p) editarProducto(p);
            } else if (accion === "eliminar" && id) {
                eliminarProducto(id);
            }
        });
    }

    const imgInput = $("imagen");
    if (imgInput) {
        imgInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const prevC = $("imagen-preview-container");
                const prev = $("imagen-preview");
                if (prevC && prev) { prev.src = ev.target.result; prevC.style.display = "block"; }
            };
            reader.readAsDataURL(file);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try { bind(); } catch(e){ console.error(e); }
    Promise.all([cargarCategorias(), cargarProductos()]).catch(e => console.error(e));
});

// Exponer funciones por si el HTML las llama con onclick
window.toggleCurrency = toggleCurrency;
window.guardar = guardar;
window.limpiar = limpiar;
window.limpiarImagen = limpiarImagen;
window.nuevaCategoria = nuevaCategoria;

})();
