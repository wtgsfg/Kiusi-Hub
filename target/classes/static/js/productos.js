// 🔐 PROTECCIÓN
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) window.location.href="login.html";

if (usuario.rol !== "ADMIN") {
    alert("No tienes acceso");
    window.location.href="home.html";
}

// 💰 Variables para la conversión de moneda
let productosOriginales = [];
let monedaActual = "COP";
let tasaCambio = 0.00025; // Tasa de ejemplo (se actualizará con la API)

// 🔄 CARGAR PRODUCTOS
function cargarProductos(){
    fetch("/api/productos")
    .then(res => res.json())
    .then(data => {
        productosOriginales = data;
        renderizarProductos();
    });
}

// 📊 Renderizar productos con la moneda actual
function renderizarProductos() {
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    productosOriginales.forEach(p => {
        let precioMostrar;
        let simboloMoneda;

        if (monedaActual === "USD") {
            precioMostrar = (p.precio * tasaCambio).toFixed(2);
            simboloMoneda = "US$";
        } else {
            precioMostrar = p.precio;
            simboloMoneda = "$";
        }

        lista.innerHTML += `
        <div class="card">
            <img src="${p.imagenUrl || 'https://via.placeholder.com/200'}">
            <h3>${p.nombre}</h3>
            <p><b>Ref:</b> ${p.referencia || 'N/A'}</p>
            <p>${p.descripcion}</p>
            <p><b>Categoría:</b> ${p.categoria || "Sin categoría"}</p>
            <p><b>Stock:</b> ${p.stock}</p>
            <p><b>Precio:</b> ${simboloMoneda}${precioMostrar}</p>
            <div class="card-buttons">
                <button class="btn-warning" onclick="editar(${p.id},'${p.referencia || ''}','${p.nombre}','${p.descripcion}',${p.precio},${p.stock},'${p.imagenUrl || ''}','${p.categoria}')">Editar</button>
                <button class="btn-danger" onclick="eliminar(${p.id})">Eliminar</button>
            </div>
        </div>
        `;
    });
}

// 🔄 Alternar entre COP y USD
async function toggleCurrency() {
    const btn = document.getElementById("btnConvertir");
    const span = document.getElementById("currentCurrency");

    // Obtener la tasa de cambio real de la API
    if (monedaActual === "COP") {
        try {
            const res = await fetch("/api/currency/rate?from=COP&to=USD");
            tasaCambio = await res.json();
        } catch (e) {
            console.error("Error al obtener la tasa:", e);
        }
        monedaActual = "USD";
        btn.textContent = "Mostrar precios en COP";
    } else {
        monedaActual = "COP";
        btn.textContent = "Mostrar precios en USD";
    }

    span.textContent = `Moneda actual: ${monedaActual}`;
    renderizarProductos();
}

// 💾 GUARDAR / ACTUALIZAR
function guardar(){
    const referencia = document.getElementById("referencia").value;
    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const precio = document.getElementById("precio").value;
    const stock = document.getElementById("stock").value;
    const categoria = document.getElementById("categoria").value;

    if (!nombre) {
        alert("Por favor ingresa el nombre del producto");
        return;
    }
    if (!categoria) {
        alert("Por favor selecciona una categoría");
        return;
    }
    if (!precio || parseFloat(precio) <= 0) {
        alert("Por favor ingresa un precio válido");
        return;
    }
    if (!stock || parseInt(stock) < 0) {
        alert("Por favor ingresa un stock válido");
        return;
    }

    const id = document.getElementById("id").value;
    const formData = new FormData();

    formData.append("referencia", referencia);
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("categoria", categoria);

    const imagenInput = document.getElementById("imagen");
    if (imagenInput.files.length > 0) {
        formData.append("imagen", imagenInput.files[0]);
    }

    const url = id ? `/api/productos/${id}` : "/api/productos";
    const method = id ? "PUT" : "POST";

    fetch(url, {
        method: method,
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(err => {
                alert("Error: " + err);
                throw new Error("Error en la validación");
            });
        }
        return res.json();
    })
    .then(() => {
        limpiar();
        cargarProductos();
    })
    .catch(err => console.error(err));
}

// ✏️ EDITAR
function editar(id,ref,n,d,p,s,i,c){
    document.getElementById("id").value = id;
    document.getElementById("referencia").value = ref;
    document.getElementById("nombre").value = n;
    document.getElementById("descripcion").value = d;
    document.getElementById("precio").value = p;
    document.getElementById("stock").value = s;
    document.getElementById("categoria").value = c || "";
    
    // Show image preview if exists
    if (i) {
        const previewContainer = document.getElementById("imagen-preview-container");
        const preview = document.getElementById("imagen-preview");
        preview.src = i;
        previewContainer.style.display = "block";
    }
}

// 🗑️ ELIMINAR
function eliminar(id){
    uiConfirm("¿Estás seguro de eliminar este producto?").then(ok => {
        if (!ok) return;
        fetch(`/api/productos/${id}`,{
            method:"DELETE"
        })
        .then(() => cargarProductos());
    });
}

// 🖼️ LIMPIAR IMAGEN
function limpiarImagen(){
    document.getElementById("imagen").value = "";
    document.getElementById("imagen-preview-container").style.display = "none";
    document.getElementById("imagen-preview").src = "";
}

// 🧹 LIMPIAR
function limpiar(){
    document.getElementById("id").value = "";
    document.getElementById("referencia").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("categoria").value = "";
    limpiarImagen();
}

// 👁️ IMAGE PREVIEW
document.addEventListener("DOMContentLoaded", () => {
    const imagenInput = document.getElementById("imagen");
    imagenInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const previewContainer = document.getElementById("imagen-preview-container");
                const preview = document.getElementById("imagen-preview");
                preview.src = event.target.result;
                previewContainer.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });
});

// Carga inicial
cargarProductos();
