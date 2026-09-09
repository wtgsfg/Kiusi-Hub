package com.kiusi.kiusihub.dto;

public class RecaudoDetalle {
    private Long id;
    private Long facturaId;
    private java.sql.Date fecha;
    private double monto;
    private String metodoPago;
    private String cliente;
    private String facturaEstado;
    private double facturaTotal;

    public RecaudoDetalle() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFacturaId() {
        return facturaId;
    }

    public void setFacturaId(Long facturaId) {
        this.facturaId = facturaId;
    }

    public java.sql.Date getFecha() {
        return fecha;
    }

    public void setFecha(java.sql.Date fecha) {
        this.fecha = fecha;
    }

    public double getMonto() {
        return monto;
    }

    public void setMonto(double monto) {
        this.monto = monto;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getCliente() {
        return cliente;
    }

    public void setCliente(String cliente) {
        this.cliente = cliente;
    }

    public String getFacturaEstado() {
        return facturaEstado;
    }

    public void setFacturaEstado(String facturaEstado) {
        this.facturaEstado = facturaEstado;
    }

    public double getFacturaTotal() {
        return facturaTotal;
    }

    public void setFacturaTotal(double facturaTotal) {
        this.facturaTotal = facturaTotal;
    }
}
