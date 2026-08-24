
package com.kiusi.kiusihub.model;

import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

public class NotaCredito {
    private Long id;
    private Long facturaId;
    private Date fecha;
    private double monto;
    private String motivo;
    private List<ItemNotaCredito> items;

    public NotaCredito() {
        this.items = new ArrayList<>();
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

    public Date getFecha() {
        return fecha;
    }

    public void setFecha(Date fecha) {
        this.fecha = fecha;
    }

    public double getMonto() {
        return monto;
    }

    public void setMonto(double monto) {
        this.monto = monto;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public List<ItemNotaCredito> getItems() {
        return items;
    }

    public void setItems(List<ItemNotaCredito> items) {
        this.items = items;
    }
}
