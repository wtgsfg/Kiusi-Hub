
CREATE TABLE IF NOT EXISTS notas_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    motivo VARCHAR(255),
    fecha DATE,
    FOREIGN KEY (factura_id) REFERENCES facturas(id)
);

CREATE TABLE IF NOT EXISTS items_nota_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nota_credito_id BIGINT NOT NULL,
    item_pedido_id BIGINT NOT NULL,
    nombre_producto VARCHAR(255),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (nota_credito_id) REFERENCES notas_credito(id),
    FOREIGN KEY (item_pedido_id) REFERENCES items_pedido(id)
);
