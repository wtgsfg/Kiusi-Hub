package com.kiusi.kiusihub.dto;

public class RecaudoResumen {
    private double totalRecaudado;
    private int cantidadPagos;
    private double promedioPago;

    public RecaudoResumen() {
    }

    public RecaudoResumen(double totalRecaudado, int cantidadPagos, double promedioPago) {
        this.totalRecaudado = totalRecaudado;
        this.cantidadPagos = cantidadPagos;
        this.promedioPago = promedioPago;
    }

    public double getTotalRecaudado() {
        return totalRecaudado;
    }

    public void setTotalRecaudado(double totalRecaudado) {
        this.totalRecaudado = totalRecaudado;
    }

    public int getCantidadPagos() {
        return cantidadPagos;
    }

    public void setCantidadPagos(int cantidadPagos) {
        this.cantidadPagos = cantidadPagos;
    }

    public double getPromedioPago() {
        return promedioPago;
    }

    public void setPromedioPago(double promedioPago) {
        this.promedioPago = promedioPago;
    }
}
