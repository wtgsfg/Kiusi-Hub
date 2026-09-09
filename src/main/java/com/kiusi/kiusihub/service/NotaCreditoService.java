
package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.ItemNotaCredito;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.model.NotaCredito;
import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.repository.FacturaRepository;
import com.kiusi.kiusihub.repository.ItemNotaCreditoRepository;
import com.kiusi.kiusihub.repository.ItemPedidoRepository;
import com.kiusi.kiusihub.repository.NotaCreditoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Service
public class NotaCreditoService {

    private final NotaCreditoRepository notaCreditoRepository;
    private final FacturaRepository facturaRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final ItemNotaCreditoRepository itemNotaCreditoRepository;
    private final ProductoService productoService;

    public NotaCreditoService(NotaCreditoRepository notaCreditoRepository,
                              FacturaRepository facturaRepository,
                              ItemPedidoRepository itemPedidoRepository,
                              ItemNotaCreditoRepository itemNotaCreditoRepository,
                              ProductoService productoService) {
        this.notaCreditoRepository = notaCreditoRepository;
        this.facturaRepository = facturaRepository;
        this.itemPedidoRepository = itemPedidoRepository;
        this.itemNotaCreditoRepository = itemNotaCreditoRepository;
        this.productoService = productoService;
    }

    public List<NotaCredito> findAll() {
        return notaCreditoRepository.findAll();
    }

    public NotaCredito findById(Long id) {
        return notaCreditoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));
    }

    public List<NotaCredito> findByFacturaId(Long facturaId) {
        return notaCreditoRepository.findByFacturaId(facturaId);
    }

    @Transactional
    public NotaCredito create(NotaCredito notaCredito) {
        Factura factura = facturaRepository.findById(notaCredito.getFacturaId())
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        if (notaCredito.getItems() == null || notaCredito.getItems().isEmpty()) {
            throw new IllegalStateException("La nota de crédito debe tener al menos un producto");
        }

        double montoNotasActivasExistentes = notaCreditoRepository
                .findMontoTotalActivoByFacturaId(notaCredito.getFacturaId());

        double totalFacturaOriginal = factura.getTotal() + montoNotasActivasExistentes;
        double totalNota = 0;

        for (ItemNotaCredito itemNota : notaCredito.getItems()) {
            if (itemNota.getItemPedidoId() == null) {
                throw new IllegalStateException(
                        "Falta identificar el item del pedido para el producto '"
                                + (itemNota.getNombreProducto() != null ? itemNota.getNombreProducto() : "sin nombre")
                                + "'");
            }
            ItemPedido itemPedido = itemPedidoRepository.findById(itemNota.getItemPedidoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Item de pedido no encontrado: " + itemNota.getItemPedidoId()));

            if (factura.getPedidoId() == null
                    || !itemPedido.getPedidoId().equals(factura.getPedidoId())) {
                throw new IllegalStateException(
                        "El item '" + itemNota.getNombreProducto() + "' no pertenece al pedido de esta factura");
            }

            int cantidadFacturada = itemPedido.getCantidad();
            int cantidadYaDevuelta = itemNotaCreditoRepository
                    .findCantidadDevueltaByItemPedidoId(itemNota.getItemPedidoId());
            int cantidadDisponibleParaDevolver = cantidadFacturada - cantidadYaDevuelta;

            if (itemNota.getCantidad() <= 0) {
                throw new IllegalStateException(String.format(
                        "La cantidad a devolver para '%s' debe ser mayor a cero",
                        itemNota.getNombreProducto() != null ? itemNota.getNombreProducto() : "el producto"));
            }

            if (itemNota.getCantidad() > cantidadDisponibleParaDevolver) {
                throw new IllegalStateException(String.format(
                        "No se puede devolver más de lo disponible para '%s'. " +
                        "Facturado: %d, Ya devuelto en notas activas: %d, Disponible: %d, Solicitado: %d",
                        itemNota.getNombreProducto(), cantidadFacturada, cantidadYaDevuelta,
                        cantidadDisponibleParaDevolver, itemNota.getCantidad()));
            }

            if (itemNota.getPrecioUnitario() <= 0) {
                itemNota.setPrecioUnitario(itemPedido.getPrecioUnitario());
            }

            itemNota.setProductoId(itemPedido.getProductoId());
            if (itemNota.getNombreProducto() == null || itemNota.getNombreProducto().trim().isEmpty()) {
                itemNota.setNombreProducto(itemPedido.getNombreProducto());
            }

            double subtotal = itemNota.getCantidad() * itemNota.getPrecioUnitario();
            itemNota.setSubtotal(subtotal);
            totalNota += subtotal;
        }

        if (totalNota <= 0) {
            throw new IllegalStateException("El total de la nota de crédito debe ser mayor a cero");
        }

        double montoTotalConNuevaNota = montoNotasActivasExistentes + totalNota;
        if (montoTotalConNuevaNota > totalFacturaOriginal + 0.001) {
            double maximoNuevaNota = totalFacturaOriginal - montoNotasActivasExistentes;
            if (maximoNuevaNota < 0) maximoNuevaNota = 0;
            throw new IllegalStateException(String.format(
                    "El monto total de notas de crédito activas ($%.2f) más la nueva nota ($%.2f) = $%.2f " +
                    "no puede superar el total original de la factura ($%.2f). " +
                    "Máximo permitido para esta nueva nota: $%.2f",
                    montoNotasActivasExistentes, totalNota, montoTotalConNuevaNota,
                    totalFacturaOriginal, maximoNuevaNota));
        }

        notaCredito.setMonto(totalNota);
        notaCredito.setAnulada(false);
        notaCredito.setFecha(Date.valueOf(LocalDate.now()));
        NotaCredito savedNota = notaCreditoRepository.save(notaCredito);

        for (ItemNotaCredito itemNota : savedNota.getItems()) {
            Long productoId = itemNota.getProductoId();
            if (productoId == null) {
                ItemPedido itemPedido = itemPedidoRepository.findById(itemNota.getItemPedidoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Item de pedido no encontrado"));
                productoId = itemPedido.getProductoId();
            }
            Producto producto = productoService.findById(productoId);
            producto.setStock(producto.getStock() + itemNota.getCantidad());
            productoService.save(producto);
        }

        double nuevoTotal = factura.getTotal() - totalNota;
        if (nuevoTotal < 0) nuevoTotal = 0;
        factura.setTotal(nuevoTotal);

        double saldoActual = factura.getSaldo();
        if (saldoActual <= 0.001 && nuevoTotal <= 0.001) {
            factura.setEstado("PAGADO");
        } else if (saldoActual <= 0.001) {
            factura.setEstado("PAGADO");
        } else {
            factura.setEstado("PENDIENTE");
        }
        facturaRepository.save(factura);

        return savedNota;
    }

    @Transactional
    public NotaCredito anular(Long id) {
        NotaCredito notaCredito = notaCreditoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nota de crédito no encontrada"));

        if (notaCredito.isAnulada()) {
            throw new IllegalStateException("La nota de crédito #" + id + " ya se encuentra anulada");
        }

        Factura factura = facturaRepository.findById(notaCredito.getFacturaId())
                .orElseThrow(() -> new ResourceNotFoundException("Factura asociada no encontrada"));

        for (ItemNotaCredito itemNota : notaCredito.getItems()) {
            Long productoId = itemNota.getProductoId();
            if (productoId == null) {
                ItemPedido itemPedido = itemPedidoRepository.findById(itemNota.getItemPedidoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Item de pedido no encontrado"));
                productoId = itemPedido.getProductoId();
            }
            Producto producto = productoService.findById(productoId);
            int nuevoStock = producto.getStock() - itemNota.getCantidad();
            if (nuevoStock < 0) {
                throw new IllegalStateException(String.format(
                        "Stock insuficiente para reversar la devolución del producto '%s'. " +
                        "Stock actual: %d, Cantidad a reversar: %d. " +
                        "Asegúrate de que el producto esté en bodega antes de anular.",
                        producto.getNombre(), producto.getStock(), itemNota.getCantidad()));
            }
            producto.setStock(nuevoStock);
            productoService.save(producto);
        }

        double nuevoTotal = factura.getTotal() + notaCredito.getMonto();
        factura.setTotal(nuevoTotal);
        double saldoActual = factura.getSaldo();
        if (saldoActual <= 0.001 && nuevoTotal <= 0.001) {
            factura.setEstado("PAGADO");
        } else if (saldoActual <= 0.001) {
            factura.setEstado("PAGADO");
        } else {
            factura.setEstado("PENDIENTE");
        }
        facturaRepository.save(factura);

        notaCredito.setAnulada(true);
        notaCredito.setFechaAnulacion(Date.valueOf(LocalDate.now()));
        notaCreditoRepository.save(notaCredito);

        return notaCredito;
    }

    public void delete(Long id) {
        notaCreditoRepository.deleteById(id);
    }
}
