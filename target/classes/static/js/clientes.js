// 🔐 PROTECCIÓN DE ADMIN
const usuarioSesion = JSON.parse(localStorage.getItem("usuario"));
if (!usuarioSesion || usuarioSesion.rol !== "ADMIN") {
    alert("Acceso denegado: Se requieren permisos de administrador.");
    window.location.href = "home.html";
}

// 🔄 CARGAR CLIENTES
function cargarClientes() {
    fetch("/api/clientes")
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById("lista");
            lista.innerHTML = "";
            data.forEach(c => {
                lista.innerHTML += `
                <div class="card">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
                    <h3>${c.nombre}</h3>
                    <p><strong>NIT:</strong> ${c.nit || '—'}</p>
                    <p><strong>Ciudad:</strong> ${c.ciudad || '—'}</p>
                    <p><strong>Dirección:</strong> ${c.direccion || '—'}</p>
                    <p><strong>Tel:</strong> ${c.numero || '—'}</p>
                    <p><strong>Vendedor:</strong> <span class="badge recibido">${c.vendedor || 'Sin asignar'}</span></p>
                    <div class="card-buttons">
                        <button class="btn-warning" onclick="editar(${c.id}, '${c.nombre || ''}', '${c.ciudad || ''}', '${c.direccion || ''}', '${c.nit || ''}', '${c.vendedor || ''}', '${c.numero || ''}')">Editar</button>
                        <button class="btn-danger" onclick="eliminar(${c.id})">Eliminar</button>
                    </div>
                </div>
                `;
            });
        });
}

// 💾 GUARDAR / ACTUALIZAR
function guardar() {
    const id = document.getElementById("id").value;
    const nombre = document.getElementById("nombre").value;
    const ciudad = document.getElementById("ciudad").value;
    const direccion = document.getElementById("direccion").value;
    const nit = document.getElementById("nit").value;
    const vendedor = document.getElementById("vendedor").value;
    const numero = document.getElementById("numero").value;

    if (!nombre) {
        alert("Por favor completa el nombre del cliente.");
        return;
    }

    const cliente = { nombre, ciudad, direccion, nit, vendedor, numero };

    const url = id ? `/api/clientes/${id}` : "/api/clientes";
    const method = id ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente)
    })
    .then(res => {
        if (res.ok) {
            alert("✅ Cliente guardado correctamente");
            limpiar();
            cargarClientes();
        } else {
            alert("❌ Error al guardar el cliente");
        }
    });
}

// ✏️ EDITAR
function editar(id, nombre, ciudad, direccion, nit, vendedor, numero) {
    document.getElementById("id").value = id;
    document.getElementById("nombre").value = nombre;
    document.getElementById("ciudad").value = ciudad;
    document.getElementById("direccion").value = direccion;
    document.getElementById("nit").value = nit;
    document.getElementById("vendedor").value = vendedor;
    document.getElementById("numero").value = numero;
}

// 🗑️ ELIMINAR
function eliminar(id) {
    uiConfirm("¿Estás seguro de eliminar este cliente?").then(ok => {
        if (!ok) return;
        fetch(`/api/clientes/${id}`, { method: "DELETE" })
            .then(res => {
                if (res.ok) {
                    cargarClientes();
                } else {
                    alert("No se pudo eliminar el cliente");
                }
            });
    });
}

// 🧹 LIMPIAR
function limpiar() {
    document.getElementById("id").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("ciudad").value = "";
    document.getElementById("direccion").value = "";
    document.getElementById("nit").value = "";
    document.getElementById("vendedor").value = "";
    document.getElementById("numero").value = "";
}

// Inicio
cargarClientes();
