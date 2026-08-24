// =========================================
// VARIABLES
// =========================================

const API_GALERIA = "/api/galeria";

let todasLasFotos = [];

let anioSeleccionado = "todos";

let eventoSeleccionado = "todos";


// =========================================
// INICIALIZAR
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarGaleria();

        mostrarPanelAdministrador();

        configurarEventosFormulario();

        configurarFiltros();

    }
);


// =========================================
// CONFIGURAR FILTROS
// =========================================

function configurarFiltros() {

    const filtroEvento =
        document.getElementById("filtro-evento");


    if (filtroEvento) {

        filtroEvento.addEventListener(
            "change",
            () => {

                eventoSeleccionado =
                    filtroEvento.value;

                aplicarFiltros();

            }
        );

    }

}


// =========================================
// CARGAR GALERÍA
// =========================================

async function cargarGaleria() {

    const contenedor =
        document.getElementById(
            "galeria-imagenes"
        );


    contenedor.innerHTML = `
        <p class="mensaje-galeria">
            Cargando fotografías...
        </p>
    `;


    try {

        const respuesta =
            await fetch(API_GALERIA);


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener las fotografías."
            );

        }


        todasLasFotos =
            await respuesta.json();


        generarFiltrosAnio();

        generarFiltrosEvento();

        aplicarFiltros();


    } catch (error) {

        console.error(
            "Error cargando la galería:",
            error
        );


        contenedor.innerHTML = `
            <p class="mensaje-galeria error-galeria">
                No fue posible cargar las fotografías.
            </p>
        `;

    }

}


// =========================================
// GENERAR FILTROS DE AÑO
// =========================================

function generarFiltrosAnio() {

    const contenedor =
        document.getElementById(
            "filtros-anio"
        );


    const anios = [
        ...new Set(
            todasLasFotos
                .map(foto => foto.anio)
                .filter(anio => anio !== null)
        )
    ];


    anios.sort(
        (a, b) => b - a
    );


    contenedor.innerHTML = `
        <button
            class="filtro-anio ${
                anioSeleccionado === "todos"
                    ? "activo"
                    : ""
            }"
            data-anio="todos"
        >
            Todos
        </button>
    `;


    anios.forEach(
        anio => {

            contenedor.innerHTML += `
                <button
                    class="filtro-anio ${
                        String(anio) ===
                        String(anioSeleccionado)
                            ? "activo"
                            : ""
                    }"
                    data-anio="${anio}"
                >
                    ${anio}
                </button>
            `;

        }
    );


    const botones =
        document.querySelectorAll(
            ".filtro-anio"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    botones.forEach(
                        b => {
                            b.classList.remove(
                                "activo"
                            );
                        }
                    );


                    boton.classList.add(
                        "activo"
                    );


                    anioSeleccionado =
                        boton.dataset.anio;


                    aplicarFiltros();

                }
            );

        }
    );

}


// =========================================
// GENERAR FILTROS DE EVENTO
// =========================================

function generarFiltrosEvento() {

    const select =
        document.getElementById(
            "filtro-evento"
        );


    const eventos = [
        ...new Set(
            todasLasFotos
                .map(foto => foto.evento)
                .filter(evento => evento)
        )
    ];


    eventos.sort();


    select.innerHTML = `
        <option value="todos">
            Todos los eventos
        </option>
    `;


    eventos.forEach(
        evento => {

            select.innerHTML += `
                <option
                    value="${evento}"
                    ${
                        evento ===
                        eventoSeleccionado
                            ? "selected"
                            : ""
                    }
                >
                    ${evento}
                </option>
            `;

        }
    );

}


// =========================================
// APLICAR FILTROS
// =========================================

function aplicarFiltros() {

    let fotosFiltradas =
        [...todasLasFotos];


    // FILTRO AÑO

    if (
        anioSeleccionado !==
        "todos"
    ) {

        fotosFiltradas =
            fotosFiltradas.filter(
                foto =>
                    String(foto.anio) ===
                    String(anioSeleccionado)
            );

    }


    // FILTRO EVENTO

    if (
        eventoSeleccionado !==
        "todos"
    ) {

        fotosFiltradas =
            fotosFiltradas.filter(
                foto =>
                    foto.evento ===
                    eventoSeleccionado
            );

    }


    mostrarFotos(
        fotosFiltradas
    );

}


// =========================================
// MOSTRAR FOTOS
// =========================================

function mostrarFotos(fotos) {

    const contenedor =
        document.getElementById(
            "galeria-imagenes"
        );


    if (fotos.length === 0) {

        contenedor.innerHTML = `
            <p class="mensaje-galeria">
                No hay fotografías para los filtros seleccionados.
            </p>
        `;

        return;
    }


    contenedor.innerHTML =
        fotos.map(
            foto => {

                return `
                    <div class="imagen-card">

                        <img
                            src="${foto.imagenUrl}"
                            alt="${foto.titulo}"
                            loading="lazy"
                        >

                        <div class="imagen-info">

                            <h3>
                                ${foto.titulo}
                            </h3>


                            ${
                                foto.descripcion
                                    ? `
                                        <p>
                                            ${foto.descripcion}
                                        </p>
                                    `
                                    : ""
                            }


                            <div class="imagen-meta">

                                ${
                                    foto.anio
                                        ? `
                                            <span>
                                                📅 ${foto.anio}
                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    foto.evento
                                        ? `
                                            <span>
                                                🎉 ${foto.evento}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    </div>
                `;

            }
        ).join("");

}


// =========================================
// COMPROBAR ADMINISTRADOR
// =========================================

function esAdministrador() {

    const usuarioGuardado =
        localStorage.getItem(
            "usuario"
        );


    if (!usuarioGuardado) {

        return false;

    }


    try {

        const usuario =
            JSON.parse(
                usuarioGuardado
            );


        return (
            usuario.rol &&
            usuario.rol.toUpperCase() ===
            "ADMIN"
        );


    } catch (error) {

        console.error(
            "Error leyendo usuario:",
            error
        );

        return false;

    }

}


// =========================================
// MOSTRAR PANEL ADMIN
// =========================================

function mostrarPanelAdministrador() {

    const panel =
        document.getElementById(
            "panel-administrador"
        );


    if (!panel) {

        return;

    }


    if (esAdministrador()) {

        panel.style.display =
            "block";

    } else {

        panel.style.display =
            "none";

    }

}


// =========================================
// MODAL
// =========================================

function configurarEventosFormulario() {

    const modal =
        document.getElementById(
            "modal-fotografia"
        );

    const btnAgregar =
        document.getElementById(
            "btn-agregar-foto"
        );

    const btnCerrar =
        document.getElementById(
            "btn-cerrar-modal"
        );

    const btnCancelar =
        document.getElementById(
            "btn-cancelar"
        );

    const formulario =
        document.getElementById(
            "form-fotografia"
        );

    const inputImagen =
        document.getElementById(
            "imagen"
        );


    // =====================================
    // ABRIR
    // =====================================

    if (btnAgregar) {

        btnAgregar.addEventListener(
            "click",
            () => {

                if (!esAdministrador()) {

                    alert(
                        "No tienes permisos para realizar esta acción."
                    );

                    return;

                }


                modal.style.display =
                    "flex";

                document.body.style.overflow =
                    "hidden";

            }
        );

    }


    // =====================================
    // CERRAR
    // =====================================

    if (btnCerrar) {

        btnCerrar.addEventListener(
            "click",
            cerrarModalFotografia
        );

    }


    if (btnCancelar) {

        btnCancelar.addEventListener(
            "click",
            cerrarModalFotografia
        );

    }


    // =====================================
    // CLICK FUERA
    // =====================================

    if (modal) {

        modal.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    modal
                ) {

                    cerrarModalFotografia();

                }

            }
        );

    }


    // =====================================
    // ESCAPE
    // =====================================

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {

                if (
                    modal &&
                    modal.style.display ===
                    "flex"
                ) {

                    cerrarModalFotografia();

                }

            }

        }
    );


    // =====================================
    // SELECCIONAR IMAGEN
    // =====================================

    if (inputImagen) {

        inputImagen.addEventListener(
            "change",
            () => {

                const archivo =
                    inputImagen.files[0];


                const nombre =
                    document.getElementById(
                        "nombre-imagen"
                    );


                if (!archivo) {

                    nombre.textContent =
                        "";

                    return;

                }


                nombre.textContent =
                    `📎 ${archivo.name}`;

            }
        );

    }


    // =====================================
    // SUBMIT
    // =====================================

    if (formulario) {

        formulario.addEventListener(
            "submit",
            async evento => {

                evento.preventDefault();

                await guardarFotografia();

            }
        );

    }

}


// =========================================
// CERRAR MODAL
// =========================================

function cerrarModalFotografia() {

    const modal =
        document.getElementById(
            "modal-fotografia"
        );


    const formulario =
        document.getElementById(
            "form-fotografia"
        );


    const nombre =
        document.getElementById(
            "nombre-imagen"
        );


    modal.style.display =
        "none";


    document.body.style.overflow =
        "";


    formulario.reset();


    nombre.textContent =
        "";


    limpiarMensajeFormulario();

}


// =========================================
// GUARDAR FOTOGRAFÍA
// =========================================

async function guardarFotografia() {

    // =====================================
    // USUARIO
    // =====================================

    const usuarioGuardado =
        localStorage.getItem(
            "usuario"
        );


    if (!usuarioGuardado) {

        mostrarMensajeFormulario(
            "Debes iniciar sesión como administrador.",
            "error"
        );

        return;

    }


    let usuario;


    try {

        usuario =
            JSON.parse(
                usuarioGuardado
            );

    } catch (error) {

        mostrarMensajeFormulario(
            "No se pudo identificar al usuario.",
            "error"
        );

        return;

    }


    // =====================================
    // COMPROBAR ROL
    // =====================================

    if (
        !usuario.rol ||
        usuario.rol.toUpperCase() !==
        "ADMIN"
    ) {

        mostrarMensajeFormulario(
            "No tienes permisos para realizar esta acción.",
            "error"
        );

        return;

    }


    // =====================================
    // OBTENER DATOS
    // =====================================

    const titulo =
        document.getElementById(
            "titulo"
        ).value.trim();


    const descripcion =
        document.getElementById(
            "descripcion"
        ).value.trim();


    const anio =
        document.getElementById(
            "anio"
        ).value;


    const evento =
        document.getElementById(
            "evento"
        ).value.trim();


    const inputImagen =
        document.getElementById(
            "imagen"
        );


    const archivo =
        inputImagen.files[0];


    // =====================================
    // VALIDACIONES
    // =====================================

    if (!titulo) {

        mostrarMensajeFormulario(
            "El título es obligatorio.",
            "error"
        );

        return;

    }


    if (!descripcion) {

        mostrarMensajeFormulario(
            "La descripción es obligatoria.",
            "error"
        );

        return;

    }


    if (!anio) {

        mostrarMensajeFormulario(
            "El año es obligatorio.",
            "error"
        );

        return;

    }


    if (!evento) {

        mostrarMensajeFormulario(
            "El evento es obligatorio.",
            "error"
        );

        return;

    }


    if (!archivo) {

        mostrarMensajeFormulario(
            "Debes seleccionar una fotografía.",
            "error"
        );

        return;

    }


    // =====================================
    // VALIDAR TAMAÑO
    // =====================================

    if (
        archivo.size >
        5 * 1024 * 1024
    ) {

        mostrarMensajeFormulario(
            "La imagen no puede superar los 5 MB.",
            "error"
        );

        return;

    }


    // =====================================
    // VALIDAR FORMATO
    // =====================================

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !tiposPermitidos.includes(
            archivo.type
        )
    ) {

        mostrarMensajeFormulario(
            "Solo se permiten imágenes JPG, PNG o WEBP.",
            "error"
        );

        return;

    }


    // =====================================
    // BOTÓN
    // =====================================

    const btnGuardar =
        document.getElementById(
            "btn-guardar"
        );


    btnGuardar.disabled =
        true;


    btnGuardar.textContent =
        "Guardando...";


    // =====================================
    // FORM DATA
    // =====================================

    const formData =
        new FormData();


    formData.append(
        "titulo",
        titulo
    );


    formData.append(
        "descripcion",
        descripcion
    );


    formData.append(
        "anio",
        anio
    );


    formData.append(
        "evento",
        evento
    );


    formData.append(
        "imagen",
        archivo
    );


    // =====================================
    // ENVIAR AL BACKEND
    // =====================================

    try {

        const respuesta =
            await fetch(
                "/api/galeria/upload",
                {
                    method: "POST",

                    headers: {
                        "X-Usuario-Id":
                            String(
                                usuario.id
                            )
                    },

                    body: formData
                }
            );


        const texto =
            await respuesta.text();


        let resultado;


        try {

            resultado =
                JSON.parse(
                    texto
                );

        } catch {

            resultado =
                texto;

        }


        if (!respuesta.ok) {

            throw new Error(
                typeof resultado ===
                "string"
                    ? resultado
                    : (
                        resultado.message ||
                        "No fue posible guardar la fotografía."
                    )
            );

        }


        // =================================
        // ÉXITO
        // =================================

        mostrarMensajeFormulario(
            "Fotografía guardada correctamente.",
            "exito"
        );


        // Recargar galería
        await cargarGaleria();


        // Cerrar modal
        setTimeout(
            () => {

                cerrarModalFotografia();

            },
            1000
        );


    } catch (error) {

        console.error(
            "Error guardando fotografía:",
            error
        );


        mostrarMensajeFormulario(
            error.message ||
            "Ocurrió un error al guardar la fotografía.",
            "error"
        );


    } finally {

        btnGuardar.disabled =
            false;


        btnGuardar.textContent =
            "Guardar fotografía";

    }

}


// =========================================
// MENSAJE
// =========================================

function mostrarMensajeFormulario(
    mensaje,
    tipo
) {

    const contenedor =
        document.getElementById(
            "mensaje-formulario"
        );


    contenedor.textContent =
        mensaje;


    contenedor.className =
        `mensaje-formulario ${tipo}`;

}


// =========================================
// LIMPIAR MENSAJE
// =========================================

function limpiarMensajeFormulario() {

    const contenedor =
        document.getElementById(
            "mensaje-formulario"
        );


    contenedor.textContent =
        "";


    contenedor.className =
        "mensaje-formulario";

}


// =========================================
// VIDEOS DETRÁS DE CÁMARA
// =========================================

const videosDetrasCamara = [

    "https://www.youtube.com/embed/jfKfPfyJRdk",

    "https://www.youtube.com/embed/5qap5aO4i9A",

    "https://www.youtube.com/embed/aqz-KE-bpKQ",

    "https://www.youtube.com/embed/4XdINrZoXrE"

];


function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}


function renderDetrasCamara() {

    const container =
        document.getElementById(
            "detras-camara"
        );


    if (!container) {

        return;

    }


    const shuffled =
        shuffleArray(
            [...videosDetrasCamara]
        );


    container.innerHTML =
        shuffled
            .map(
                url => `

                    <div class="video-card">

                        <iframe
                            src="${url}"
                            allowfullscreen>
                        </iframe>

                    </div>

                `
            )
            .join("");

}


renderDetrasCamara();