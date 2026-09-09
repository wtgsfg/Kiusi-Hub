package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.Pedido;
import com.kiusi.kiusihub.repository.FacturaRepository;
import com.kiusi.kiusihub.repository.PedidoRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final PedidoRepository pedidoRepository;
    private final JdbcTemplate jdbcTemplate;

    public FacturaService(FacturaRepository facturaRepository,
                          PedidoRepository pedidoRepository,
                          JdbcTemplate jdbcTemplate) {
        this.facturaRepository = facturaRepository;
        this.pedidoRepository = pedidoRepository;
        this.jdbcTemplate = jdbcTemplate;
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
        Long pedidoId = pedido.getId();
        String cliente = pedido.getCliente();
        String vendedor = pedido.getVendedor();

        // 1er fallback: si vendedor o cliente vienen nulos, recargar pedido completo desde BD
        if ((vendedor == null || vendedor.isBlank() || cliente == null || cliente.isBlank()) && pedidoId != null) {
            try {
                Optional<Pedido> optPedido = pedidoRepository.findById(pedidoId);
                if (optPedido.isPresent()) {
                    Pedido p = optPedido.get();
                    if (cliente == null || cliente.isBlank()) cliente = p.getCliente();
                    if (vendedor == null || vendedor.isBlank()) vendedor = p.getVendedor();
                }
            } catch (Exception ignored) {}
        }

        // 2do fallback: si aún así vendedor/cliente vienen nulos, consultar directamente la fila de pedidos
        if (pedidoId != null && (vendedor == null || vendedor.isBlank() || cliente == null || cliente.isBlank())) {
            try {
                Map<String, Object> row = jdbcTemplate.queryForMap(
                        "SELECT cliente, vendedor FROM pedidos WHERE id = ? LIMIT 1", pedidoId);
                if (row != null) {
                    Object c = row.get("cliente");
                    Object v = row.get("vendedor");
                    if ((cliente == null || cliente.isBlank()) && c != null) cliente = String.valueOf(c);
                    if ((vendedor == null || vendedor.isBlank()) && v != null) vendedor = String.valueOf(v);
                }
            } catch (Exception ignored) {}
        }

        // Si después de todo aún es nulo, mostrar en log para debug
        if (vendedor == null || vendedor.isBlank()) {
            System.err.println("[FacturaService] ⚠️ VENDEDOR NULL al crear factura para pedido_id=" + pedidoId);
        }

        Factura factura = new Factura();
        factura.setPedidoId(pedidoId);
        factura.setNombreCliente(cliente != null ? cliente : "");
        factura.setVendedor(vendedor != null ? vendedor : "");
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
