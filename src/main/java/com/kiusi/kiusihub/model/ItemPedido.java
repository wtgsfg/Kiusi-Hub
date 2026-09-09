package com.kiusi.kiusihub.model;

public class ItemPedido {
    private Long id;
    private Long pedidoId;
    private Long productoId;
    private int cantidad;
    private double precioUnitario;
    private String nombreProducto;

    public ItemPedido() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(Long pedidoId) {
        this.pedidoId = pedidoId;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public double getPrecio() {
        return precioUnitario;
    }

    public void setPrecio(double precio) {
        this.precioUnitario = precio;
    }

    public double getSubtotal() {
        return cantidad * precioUnitario;
    }

    public void setSubtotal(double subtotal) {
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public Pedido getPedido() {
        return null;
    }

    public void setPedido(Pedido pedido) {
        if (pedido != null) {
            this.pedidoId = pedido.getId();
        }
    }
}
