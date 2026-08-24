
package com.kiusi.kiusihub.model;

public class ItemNotaCredito {
    private Long id;
    private Long notaCreditoId;
    private Long itemPedidoId;
    private String nombreProducto;
    private int cantidad;
    private double precioUnitario;
    private double subtotal;

    public ItemNotaCredito() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNotaCreditoId() {
        return notaCreditoId;
    }

    public void setNotaCreditoId(Long notaCreditoId) {
        this.notaCreditoId = notaCreditoId;
    }

    public Long getItemPedidoId() {
        return itemPedidoId;
    }

    public void setItemPedidoId(Long itemPedidoId) {
        this.itemPedidoId = itemPedidoId;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
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

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }
}
