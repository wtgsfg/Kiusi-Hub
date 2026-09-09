# Módulo de Recaudos - Plan de Implementación

## Task 1: Backend - Mejorar RecaudoRepository (JOINs y filtros)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Ampliar `RecaudoRepository` con un método `findAllFiltered(...)` que acepte filtros (fechaDesde, fechaHasta, facturaId, cliente, metodoPago).
  - Query con JOIN a `facturas` para traer: nombre cliente, estado factura, total factura.
  - Manejar nombres duales de columnas (`cliente` vs `nombre_cliente`, `fecha` con alias) por compatibilidad.
  - Añadir método `calculateSummary(...)` para KPIs (SUM monto, COUNT, AVG monto).
  - Todo SQL parametrizado JDBC; manejar errores try/catch por columnas opcionales.
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `rule` TR-1.1: `findAllFiltered()` retorna lista con campos enriquecidos (cliente, facturaEstado) sin lanzar excepción. Evidence: salida de `mvn test` o log de SQL exitoso.
  - `rule` TR-1.2: Con parámetros fechaDesde + cliente, retorna solo registros que cumplen ambos filtros. Evidence: ejecución SELECT manual vs resultado del método.
  - `rule` TR-1.3: `calculateSummary()` retorna {total, cantidad, promedio} numéricamente iguales a la agregación SQL manual.
- **Notes**: Reutilizar el patrón try/catch dual del RecaudoRepository existente para columnas con nombres variables.

## Task 2: Backend - DTO RecaudoDetalle y RecaudoResumen
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (paralelo con Task 1)
- **Description**:
  - Crear DTO `RecaudoDetalle` extendiendo Recaudo o con campos extra: cliente, facturaEstado, facturaTotal.
  - Crear DTO `RecaudoResumen` con: totalRecaudado, cantidadPagos, promedioPago.
  - Campos con setters/getters estilo JavaBean (igual que `Recaudo.java`).
- **Acceptance Criteria Addressed**: AC-3, AC-5
- **Test Requirements**:
  - `rule` TR-2.1: DTOs compilan y tienen getters/setters para todos los campos. Evidence: `mvn compile` exitoso.

## Task 3: Backend - Actualizar RecaudoService y RecaudoController
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2
- **Description**:
  - Actualizar `RecaudoService` con métodos: `findAllFiltered(params)` y `getSummary(params)`.
  - Actualizar `RecaudoController`:
    - `GET /api/recaudos` → aceptar query params opcionales: `fechaDesde`, `fechaHasta`, `facturaId`, `cliente`, `metodoPago`.
    - Nuevo `GET /api/recaudos/resumen` → mismo set de params, retorna el objeto Resumen.
    - Actualizar `POST /api/recaudos` para aceptar `metodoPago` opcional y guardarlo.
- **Acceptance Criteria Addressed**: AC-3, AC-4, FR-1, FR-4.1
- **Test Requirements**:
  - `rule` TR-3.1: `GET /api/recaudos` sin params retorna 200 OK con array de RecaudoDetalle enriquecido. Evidence: curl localhost:port/api/recaudos.
  - `rule` TR-3.2: `GET /api/recaudos/resumen` retorna {totalRecaudado, cantidadPagos, promedioPago} como números válidos. Evidence: curl response JSON.
  - `rule` TR-3.3: `POST /api/recaudos?facturaId=X&monto=Y&metodoPago=EFECTIVO` persiste metodo_pago correctamente. Evidence: SELECT a la tabla tras el POST.

## Task 4: Backend - Asegurar columna metodo_pago (DatabaseMigrationRunner)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Actualizar `DatabaseMigrationRunner.java` o schema.sql para asegurar que la columna `metodo_pago` exista en `recaudos`.
  - Usar ALTER TABLE ... ADD COLUMN IF NOT EXISTS o try/catch JDBC.
- **Acceptance Criteria Addressed**: NFR-3, FR-4.2
- **Test Requirements**:
  - `rule` TR-4.1: Iniciar app sin la columna metodo_pago no causa excepciones y la columna se crea automáticamente. Evidence: logs + DESCRIBE recaudos.

## Task 5: Frontend - Crear recaudos.html (estructura y estilos)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Crear `recaudos.html` siguiendo el patrón de `bodeguero.html` y `facturas.html`: header navbar, main.container, footer.
  - Incluir CSS inline + reutilizar `css/global.css` y `css/admin.css`.
  - Secciones: Título "💰 Recaudos", barra de filtros (fecha-desde, fecha-hasta, input cliente, select metodoPago, botones Aplicar y Limpiar), tarjetas KPI (3 cards glass), lista/grid de tarjetas de recaudos.
  - Estilo: glassmorphism (backdrop-filter), border-radius 16px+, sombras suaves, paleta de colores existente.
- **Acceptance Criteria Addressed**: FR-2.1, AC-6, AC-7
- **Test Requirements**:
  - `rubric` TR-5.1: Fidelidad visual; scale 1-5; anchors 1=roto 3=basico 5=glass perfecto; threshold >= 4. Evidence: screenshot de la página vacía.
  - `rule` TR-5.2: Todos los elementos del layout existen en el DOM (filtros, 3 KPIs, contenedor lista). Evidence: inspección DevTools.

## Task 6: Frontend - Crear recaudos.js (lógica)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3, Task 5
- **Description**:
  - Verificación de permiso al cargar: ADMIN o CARTERA → sino alert + redirect.
  - Función `cargarResumen(filtros)` → GET `/api/recaudos/resumen?params` y actualizar KPIs con formato moneda COP.
  - Función `cargarRecaudos(filtros)` → GET `/api/recaudos?params` y renderizar tarjetas con: ID recaudo, fecha, factura #, cliente, monto, método pago, badge de estado factura.
  - Controladores de filtros: bind eventos a inputs, `aplicarFiltros()`, `limpiarFiltros()`.
  - Reutilizar SweetAlert2 para notificaciones y `window.ui` / toast de ui.js para errores.
- **Acceptance Criteria Addressed**: AC-2, AC-5, AC-6, AC-8
- **Test Requirements**:
  - `rule` TR-6.1: Al abrir como VENDEDOR → SweetAlert + redirect home. Evidence: prueba navegación directa.
  - `rule` TR-6.2: KPI Total Recaudado formatea moneda con decimales y coincide con resumen. Evidence: valor vs JSON response.
  - `rule` TR-6.3: Limpiar filtros borra inputs y re-carga findAll. Evidence: DOM inputs vacíos + fetch sin params.

## Task 7: Frontend - Integrar navegación (ui.js)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - En `buildNavLinks()` de `ui.js`: agregar `add("recaudos.html", "Recaudos", "💰")` dentro de los bloques `esAdmin` y `esCartera`.
  - Asegurarse de que NO aparezca para esVendedor, esBodeguero ni usuario null.
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-7.1: `buildNavLinks()` con usuario rol=ADMIN incluye Recaudos. Evidence: console.log del array links.
  - `rule` TR-7.2: `buildNavLinks()` con usuario rol=BODEGUERO NO incluye Recaudos. Evidence: console.log.

## Task 8: Frontend - Actualizar registro de pago (facturas.html/facturas.js opcional)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3
- **Description**:
  - En el formulario "Registrar Nuevo Recaudo" de `facturas.html`, agregar un `<select>` de Método de Pago (EFECTIVO, TRANSFERENCIA, TARJETA, NEQUI, DAVIPLATA, BOTÓN, OTRO).
  - Actualizar la función `pagar()` para enviar el `metodoPago` al POST.
- **Acceptance Criteria Addressed**: FR-4.1, FR-4.3
- **Test Requirements**:
  - `rule` TR-8.1: Al pagar con método seleccionado, el POST incluye el param metodoPago. Evidence: Network tab.
