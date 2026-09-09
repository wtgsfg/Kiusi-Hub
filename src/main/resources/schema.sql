-- =======================================
-- KiusiHub schema.sql (safe, idempotente)
-- Todo CREATE usa IF NOT EXISTS.
-- Migraciones dinámicas (ALTER TABLE / RENAME COLUMN) se ejecutan via
-- DatabaseMigrationRunner.java @PostConstruct con try/catch por cada paso.
-- =======================================

-- TABLA notas_credito. Se usa fecha_creacion, NO 'fecha' (palabra reservada MySQL).
CREATE TABLE IF NOT EXISTS notas_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    motivo VARCHAR(255),
    fecha_creacion DATE,
    anulada BOOLEAN DEFAULT FALSE,
    fecha_anulacion DATE
);

CREATE TABLE IF NOT EXISTS items_nota_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nota_credito_id BIGINT NOT NULL,
    item_pedido_id BIGINT NOT NULL,
    producto_id BIGINT,
    nombre_producto VARCHAR(255),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);
