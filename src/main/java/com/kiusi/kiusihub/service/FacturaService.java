package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.Pedido;
import com.kiusi.kiusihub.repository.FacturaRepository;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;

    public FacturaService(FacturaRepository facturaRepository) {
        this.facturaRepository = facturaRepository;
    }

    public List<Factura> findAll() {
        return facturaRepository.findAll();
    }

    public List<Factura> findAllFiltered(LocalDate fechaDesde, LocalDate fechaHasta,
                                         String cliente, String vendedor, String estado,
                                         Double minTotal, Double maxTotal, Long nroFactura) {
        return facturaRepository.findAllFiltered(fechaDesde, fechaHasta, cliente, vendedor, estado, minTotal, maxTotal, nroFactura);
    }

    public Map<String, Object> resumenFiltrado(LocalDate fechaDesde, LocalDate fechaHasta,
                                               String cliente, String vendedor, String estado,
                                               Double minTotal, Double maxTotal, Long nroFactura) {
        return facturaRepository.resumenFiltrado(fechaDesde, fechaHasta, cliente, vendedor, estado, minTotal, maxTotal, nroFactura);
    }

    public List<String> findAllClientesExistentes() {
        return facturaRepository.findAllClientesExistentes();
    }

    public List<String> findAllVendedoresExistentes() {
        return facturaRepository.findAllVendedoresExistentes();
    }

    public Factura findById(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));
    }

    public Factura createFromPedido(Pedido pedido, double total) {
        Factura factura = new Factura();
        factura.setPedidoId(pedido.getId());
        factura.setNombreCliente(pedido.getCliente());
        factura.setVendedor(pedido.getVendedor());
        factura.setTotal(total);
        factura.setPagado(0);
        factura.setEstado("PENDIENTE");
        factura.setFecha(new Date(System.currentTimeMillis()));
        return facturaRepository.save(factura);
    }

    public Factura update(Long id, Factura facturaDetails) {
        Factura factura = findById(id);
        factura.setNombreCliente(facturaDetails.getNombreCliente());
        if (facturaDetails.getVendedor() != null && !facturaDetails.getVendedor().isBlank()) {
            factura.setVendedor(facturaDetails.getVendedor());
        }
        factura.setTotal(facturaDetails.getTotal());
        factura.setPagado(facturaDetails.getPagado());
        factura.setEstado(facturaDetails.getEstado());
        return facturaRepository.save(factura);
    }

    public void delete(Long id) {
        Factura factura = findById(id);
        facturaRepository.delete(factura);
    }
}
