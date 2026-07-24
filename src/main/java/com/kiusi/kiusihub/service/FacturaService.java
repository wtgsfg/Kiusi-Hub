package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.Pedido;
import com.kiusi.kiusihub.repository.FacturaRepository;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;

    public FacturaService(FacturaRepository facturaRepository) {
        this.facturaRepository = facturaRepository;
    }

    public List<Factura> findAll() {
        return facturaRepository.findAll();
    }

    public Factura findById(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));
    }

    public Factura createFromPedido(Pedido pedido, double total) {
        Factura factura = new Factura();
        factura.setPedidoId(pedido.getId());
        factura.setNombreCliente(pedido.getCliente());
        factura.setTotal(total);
        factura.setPagado(0);
        factura.setEstado("PENDIENTE");
        factura.setFecha(new Date(System.currentTimeMillis()));
        return facturaRepository.save(factura);
    }

    public Factura update(Long id, Factura facturaDetails) {
        Factura factura = findById(id);
        factura.setNombreCliente(facturaDetails.getNombreCliente());
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
