package com.kiusi.kiusihub.model;

import java.sql.Date;

public class Factura {
    private Long id;
    private Long pedidoId;
    private Date fecha;
    private double total;
    private double pagado;
    private String nombreCliente;
    private String estado;

    public Factura() {
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

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public double getPagado() {
        return pagado;
    }

    public void setPagado(double pagado) {
        this.pagado = pagado;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public double getSaldo() {
        return total - pagado;
    }

    public void setSaldo(double saldo) {
    }

    public String getEstado() {
        if (estado == null) {
            return (getSaldo() <= 0) ? "PAGADO" : "PENDIENTE";
        }
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCliente() {
        return nombreCliente;
    }

    public void setCliente(String cliente) {
        this.nombreCliente = cliente;
    }
}
