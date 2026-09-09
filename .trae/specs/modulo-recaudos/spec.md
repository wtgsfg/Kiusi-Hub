# Módulo de Recaudos - Especificación de Requisitos

## Overview
- **Summary**: Crear un apartado dedicado de "Recaudos" accesible por ADMIN y CARTERA que permita visualizar y filtrar todos los pagos/recaudos asociados a facturas, con datos enriquecidos (cliente, factura, fecha, monto) y tarjetas de resumen para mejor visibilidad financiera.
- **Purpose**: Actualmente los recaudos solo se registran desde el formulario de facturas, pero no hay forma de visualizar el historial completo, filtrarlo por fecha/cliente, ni ver estadísticas. El módulo de recaudos centraliza la visibilidad de los ingresos.
- **Target Users**: Administradores (ADMIN) y personal de Cartera (CARTERA).

## Goals
- Centralizar todos los recaudos en una sola pantalla con datos enriquecidos.
- Permitir filtros combinados para buscar recaudos por rango de fechas, cliente, factura y método de pago.
- Mostrar tarjetas de resumen (total recaudado, cantidad, promedio, etc.).
- Integrar el módulo en la navegación existente, accesible solo por ADMIN y CARTERA.
- Mantener el estilo visual del proyecto (glassmorphism, bordes redondeados, diseño iOS-like).

## Non-Goals
- No modificar el proceso de registro de pagos (ya funciona en facturas.html).
- No crear nuevos roles de usuario.
- No implementar edición o eliminación de recaudos en esta iteración.
- No exportar reportes PDF/Excel en esta iteración.

## Background & Context
- El proyecto usa Spring Boot + JDBC Template (sin JPA) con MySQL 8.0.x.
- Frontend es Vanilla JS con SweetAlert2 y estilos glassmorphism.
- Ya existe la entidad `Recaudo`, su repositorio, servicio y controlador (`/api/recaudos`), pero el controlador no soporta filtros ni JOINs con facturas/clientes.
- La tabla `recaudos` ya existe con columnas: `id`, `factura_id`, `fecha`, `monto`, `metodo_pago`.
- La navegación (`ui.js`) ya detecta roles ADMIN y CARTERA en `buildNavLinks()`.
- Convenciones: evitar palabra reservada `fecha`; migraciones automáticas vía `DatabaseMigrationRunner`; JDBC parametrizado.

## Functional Requirements

### FR-1: Endpoint de Recaudos con Filtros y Datos Enriquecidos
- **FR-1.1**: El endpoint `GET /api/recaudos` debe aceptar parámetros opcionales de consulta: `fechaDesde`, `fechaHasta`, `facturaId`, `cliente` (nombre parcial), `metodoPago`.
- **FR-1.2**: Cada recaudo devuelto debe incluir datos enriquecidos de la factura asociada: nombre del cliente, número de factura, total factura, estado factura.
- **FR-1.3**: Debe existir un endpoint separado o parámetro para obtener las estadísticas/resumen de los recaudos filtrados (total recaudado, cantidad de pagos, promedio por pago).
- **FR-1.4**: Las consultas deben ser JDBC parametrizadas y compatibles con MySQL (JOIN entre `recaudos` y `facturas`).

### FR-2: Página Frontend de Recaudos
- **FR-2.1**: Crear `recaudos.html` como nueva página de la aplicación con la estructura estándar (navbar, container, footer).
- **FR-2.2**: Crear `js/recaudos.js` con la lógica de carga, filtrado y renderizado.
- **FR-2.3**: La página debe mostrar tarjetas (KPIs) en la parte superior con: Total Recaudado (filtrado), Cantidad de Pagos, Promedio por Pago.
- **FR-2.4**: La página debe mostrar una lista/tarjetas de cada recaudo con: ID Recaudo, Fecha, Factura #, Cliente, Monto, Método de Pago, Estado Factura.
- **FR-2.5**: Barra de filtros con: Fecha Desde, Fecha Hasta, Búsqueda por Cliente, Factura ID (opcional), Método de Pago (select), botón Limpiar filtros.
- **FR-2.6**: Los filtros se aplican en tiempo real o mediante botón "Aplicar Filtros" y actualizan tanto los KPIs como la lista.

### FR-3: Integración en Navegación
- **FR-3.1**: Agregar el enlace "Recaudos" (icono 💰) en la navegación para usuarios con rol ADMIN.
- **FR-3.2**: Agregar el enlace "Recaudos" (icono 💰) en la navegación para usuarios con rol CARTERA.
- **FR-3.3**: El enlace NO debe aparecer para VENDEDOR, BODEGUERO ni usuarios sin sesión.
- **FR-3.4**: La página `recaudos.html` debe verificar permisos al cargar (solo ADMIN y CARTERA).

### FR-4: Método de Pago
- **FR-4.1**: Al registrar un recaudo (POST /api/recaudos), debe ser posible incluir un `metodoPago` opcional.
- **FR-4.2**: El método de pago se guarda en la columna `metodo_pago` de la tabla `recaudos`.
- **FR-4.3**: Los métodos de pago disponibles en el frontend serán: EFECTIVO, TRANSFERENCIA, TARJETA, NEQUI, DAVIPLATA, BOTÓN, OTRO (select).

## Non-Functional Requirements
- **NFR-1**: Consistencia visual: estilos glassmorphism, bordes redondeados (16px+), paleta existente, shadow suave.
- **NFR-2**: Respuesta < 2s con hasta 1000 recaudos; el query debe ser eficiente (JOIN simple entre 2 tablas).
- **NFR-3**: Todos los nombres de columna deben ser compatibles con JDBC MySQL y evitar conflictos (columna `fecha` existe pero el repo ya tiene manejo dual con try/catch según convención del proyecto).
- **NFR-4**: Seguridad: el frontend y el backend no deben exponer datos sensibles; verificación de roles en la página (frontend) como capa 1.
- **NFR-5**: Reutilizar `SweetAlert2` y la infraestructura de `ui.js` (toasts, modales).

## Constraints
- **Technical**: Spring Boot JDBC Template sin JPA; MySQL 8.0.x; Vanilla JS sin frameworks frontend; archivos estáticos servidos por Spring Boot.
- **Business**: Solo ADMIN y CARTERA interactúan con recaudos; VENDEDOR/BODEGUERO no deben ver el módulo.
- **Dependencies**: Reutiliza endpoints existentes de `/api/recaudos`; requiere añadir lógica de JOINs y filtros.
- **Convenciones**: Seguir el patrón Repository → Service → Controller; usar SQL parametrizado; evitar palabras reservadas de MySQL sin alias cuando sea necesario.

## Assumptions
- La tabla `recaudos` puede tener la columna `fecha` (palabra reservada) y el repositorio debe manejarlo con try/catch dual, igual que `RecaudoRepository` actual.
- El nombre del cliente viene de la tabla `facturas` (columna `cliente` o `nombre_cliente`, usar el patrón dual del `FacturaRepository`).
- La columna `metodo_pago` podría no existir en todos los entornos; se usará el patrón de migración automática `DatabaseMigrationRunner` para agregarla si falta.

## Acceptance Criteria

### AC-1: Navegación muestra Recaudos solo a ADMIN y CARTERA
- **Type**: `rule`
- **Given**: Usuario inicia sesión con rol ADMIN o CARTERA
- **When**: Se carga la navegación (sidebar o dropdown)
- **Then**: El enlace "💰 Recaudos" aparece en el menú
- **Pass Condition**: Para ADMIN y CARTERA: enlace visible. Para VENDEDOR, BODEGUERO y sin sesión: enlace NO visible.
- **Evidence**: Captura de pantalla o inspección del DOM en `ui.js` al invocar `buildNavLinks()`.

### AC-2: Página de Recaudos protege acceso no autorizado
- **Type**: `rule`
- **Given**: Usuario sin rol válido (no ADMIN ni CARTERA) intenta abrir recaudos.html
- **When**: El DOMContentLoaded dispara la validación de permisos
- **Then**: Muestra SweetAlert de "Acceso denegado" y redirige a `home.html`
- **Pass Condition**: No se muestra el contenido de la página; se dispara la alerta y redirección.
- **Evidence**: Inspección de `recaudos.js` + prueba manual de acceso con rol VENDEDOR.

### AC-3: Endpoint GET /api/recaudos devuelve datos enriquecidos
- **Type**: `rule`
- **Given**: Existen recaudos en la base de datos con facturas asociadas
- **When**: Se hace GET a `/api/recaudos`
- **Then**: Cada elemento del array incluye: id, facturaId, fecha, monto, metodoPago, cliente (nombre), facturaEstado
- **Pass Condition**: Respuesta JSON contiene los campos enriquecidos y no hay errores SQL
- **Evidence**: Respuesta HTTP 200 JSON via curl / Postman o fetch.

### AC-4: Endpoint acepta filtros combinados
- **Type**: `rule`
- **Given**: Datos de recaudos de prueba con fechas y clientes variados
- **When**: GET `/api/recaudos?fechaDesde=2026-01-01&fechaHasta=2026-12-31&cliente=Samuel`
- **Then**: Retorna solo recaudos que cumplan TODOS los filtros aplicados
- **Pass Condition**: Conteo de registros coincide con los que cumplen el criterio en SQL manual
- **Evidence**: curl / fetch con parámetros + conteo vs query manual.

### AC-5: KPIs reflejan correctamente los filtros
- **Type**: `rule`
- **Given**: Lista de recaudos filtrada
- **When**: Se renderizan las tarjetas KPI
- **Then**: Total Recaudado = SUM(monto) filtrado; Cantidad = COUNT; Promedio = SUM/COUNT
- **Pass Condition**: Valores mostrados = cálculo manual sobre la misma respuesta del endpoint
- **Evidence**: Screenshot vs suma calculada a mano.

### AC-6: Lista de recaudos se renderiza con toda la información
- **Type**: `rubric`
- **Dimension**: Completitud de la información por tarjeta de recaudo
- **Scale**: 1-5
- **Anchors**: 1 = Falta info clave (cliente/fecha/monto); 3 = Muestra datos básicos pero falta metodoPago o estado factura; 5 = Todo visible y organizado
- **Pass Threshold**: >= 4
- **Evidence**: Screenshot del listado.

### AC-7: Estética visual consistente con el proyecto
- **Type**: `rubric`
- **Dimension**: Fidelidad visual (glassmorphism, bordes redondeados, paleta, shadows)
- **Scale**: 1-5
- **Anchors**: 1 = Estilos rotos / sin aplicar; 3 = Funcional pero no sigue paleta; 5 = Vidrio, radios 16px+, sombras suaves, consistente con home/bodeguero
- **Pass Threshold**: >= 4
- **Evidence**: Screenshot de la página completa.

### AC-8: Filtro limpia correctamente
- **Type**: `rule`
- **Given**: Filtros aplicados mostrando resultados parciales
- **When**: Se pulsa "Limpiar filtros"
- **Then**: Los campos se vacían y la lista vuelve a mostrar todos los recaudos sin filtro
- **Pass Condition**: Valores del formulario = default; lista = findAll() del endpoint sin params
- **Evidence**: Inspección del DOM y fetch antes/después de limpiar.

## Open Questions
- [ ] ¿Se necesita editar o anular un recaudo ya registrado? (Fuera de scope por ahora, pero marcar para futuro)
- [ ] ¿Quieres un buscador "en vivo" (keypress) o solo con botón "Aplicar Filtros"? (Asumo ambos: aplicar manual + buscar por cliente en vivo)
- [ ] ¿Agrupar recaudos por día/semana/mes en gráfico simple o solo KPIs numéricos? (Inicio solo KPIs)
