
package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.ItemNotaCredito;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.model.NotaCredito;
import com.kiusi.kiusihub.repository.FacturaRepository;
import com.kiusi.kiusihub.repository.ItemPedidoRepository;
import com.kiusi.kiusihub.repository.NotaCreditoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotaCreditoService {

    private final NotaCreditoRepository notaCreditoRepository;
    private final FacturaRepository facturaRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final ProductoService productoService;

    public NotaCreditoService(NotaCreditoRepository notaCreditoRepository, FacturaRepository facturaRepository, ItemPedidoRepository itemPedidoRepository, ProductoService productoService) {
        this.notaCreditoRepository = notaCreditoRepository;
        this.facturaRepository = facturaRepository;
        this.itemPedidoRepository = itemPedidoRepository;
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

    public NotaCredito create(NotaCredito notaCredito) {
        // 🔒 REGLA 1: Validar que la factura exista y no esté ya pagada completamente
        Factura factura = facturaRepository.findById(notaCredito.getFacturaId())
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        if (factura.getSaldo() <= 0) {
            throw new IllegalStateException("No se puede generar una nota de crédito para una factura pagada completamente");
        }

        // 🔒 REGLA 2: Calcular y validar el monto total
        if (notaCredito.getItems() == null || notaCredito.getItems().isEmpty()) {
            throw new IllegalStateException("La nota de crédito debe tener al menos un item");
        }

        double totalNota = 0;
        for (ItemNotaCredito itemNota : notaCredito.getItems()) {
            // 🔒 REGLA 3: Validar que el item del pedido exista
            ItemPedido itemPedido = itemPedidoRepository.findById(itemNota.getItemPedidoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item de pedido no encontrado"));

            // 🔒 REGLA 4: No devolver más de lo facturado
            if (itemNota.getCantidad() > itemPedido.getCantidad()) {
                throw new IllegalStateException(String.format(
                        "No se puede devolver más de lo facturado para el producto '%s'. Facturado: %d, Solicitado: %d",
                        itemNota.getNombreProducto(), itemPedido.getCantidad(), itemNota.getCantidad()
                ));
            }

            // 🔒 REGLA 5: Asegurar que el precio unitario sea correcto
            if (itemNota.getPrecioUnitario() <= 0) {
                itemNota.setPrecioUnitario(itemPedido.getPrecioUnitario());
            }

            // 🔒 REGLA 6: Calcular subtotal correctamente
            double subtotal = itemNota.getCantidad() * itemNota.getPrecioUnitario();
            itemNota.setSubtotal(subtotal);
            totalNota += subtotal;
        }

        // 🔒 REGLA 7: La nota de crédito no puede ser mayor que el saldo pendiente
        if (totalNota > factura.getSaldo()) {
            throw new IllegalStateException(String.format(
                    "El monto de la nota de crédito ($%.2f) no puede ser mayor que el saldo pendiente ($%.2f)",
                    totalNota, factura.getSaldo()
            ));
        }

        notaCredito.setMonto(totalNota);

        // 1. Guardar la nota de crédito
        NotaCredito savedNota = notaCreditoRepository.save(notaCredito);

        // 2. Actualizar stock de productos
        for (ItemNotaCredito itemNota : notaCredito.getItems()) {
            ItemPedido itemPedido = itemPedidoRepository.findById(itemNota.getItemPedidoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item de pedido no encontrado"));
            // Devolver stock al producto
            var producto = productoService.findById(itemPedido.getProductoId());
            producto.setStock(producto.getStock() + itemNota.getCantidad());
            productoService.save(producto);
        }

        // 3. Actualizar el estado de la factura
        double nuevoPagado = factura.getPagado() + totalNota;
        factura.setPagado(nuevoPagado);
        facturaRepository.save(factura);

        return savedNota;
    }

    public void delete(Long id) {
        notaCreditoRepository.deleteById(id);
    }
}
