package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.dto.PedidoDTO;
import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.*;
import com.kiusi.kiusihub.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final ProductoRepository productoRepository;
    private final FacturaService facturaService;

    public PedidoService(
            PedidoRepository pedidoRepository,
            ItemPedidoRepository itemPedidoRepository,
            ProductoRepository productoRepository,
            FacturaService facturaService
    ) {
        this.pedidoRepository = pedidoRepository;
        this.itemPedidoRepository = itemPedidoRepository;
        this.productoRepository = productoRepository;
        this.facturaService = facturaService;
    }

    public List<Pedido> findAll() {
        return pedidoRepository.findAll();
    }

    public Pedido findById(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));
    }

    @Transactional
    public Pedido create(PedidoDTO dto) {
        if (dto.getCliente() == null || dto.getCliente().isBlank()) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }
        if (dto.getVendedor() == null || dto.getVendedor().isBlank()) {
            throw new IllegalArgumentException("El vendedor es obligatorio");
        }
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un producto");
        }

        Pedido pedido = new Pedido();
        pedido.setCliente(dto.getCliente().trim());
        pedido.setVendedor(dto.getVendedor().trim());
        pedido.setEstado(EstadoPedido.RECIBIDO);
        pedido.setFecha(new Date(System.currentTimeMillis()));

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        List<ItemPedido> itemsGuardados = new ArrayList<>();
        Map<Long, Integer> cantidadesPorProducto = new LinkedHashMap<>();
        double total = 0;

        for (PedidoDTO.ItemDTO itemDto : dto.getItems()) {
            if (itemDto == null || itemDto.getProductoId() == null) {
                throw new IllegalArgumentException("productoId es obligatorio");
            }
            if (itemDto.getCantidad() <= 0) {
                throw new IllegalArgumentException("La cantidad debe ser mayor a 0");
            }
            cantidadesPorProducto.merge(itemDto.getProductoId(), itemDto.getCantidad(), Integer::sum);
        }

        for (Map.Entry<Long, Integer> entry : cantidadesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            int cantidad = entry.getValue();

            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

            if (producto.getStock() < cantidad) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - cantidad);
            productoRepository.save(producto);

            ItemPedido item = new ItemPedido();
            item.setPedidoId(pedidoGuardado.getId());
            item.setProductoId(producto.getId());
            item.setNombreProducto(producto.getNombre());
            item.setCantidad(cantidad);
            item.setPrecioUnitario(producto.getPrecio());

            itemsGuardados.add(itemPedidoRepository.save(item));
            total += producto.getPrecio() * cantidad;
        }

        pedidoGuardado.setTotal(total);
        pedidoGuardado.setItems(itemsGuardados);
        pedidoRepository.save(pedidoGuardado);
        return pedidoGuardado;
    }

    @Transactional
    public Pedido updateEstado(Long pedidoId, EstadoPedido nuevoEstado) {
        Pedido pedido = findById(pedidoId);

        if (nuevoEstado == EstadoPedido.DESPACHADO) {
            double total = calculateTotal(pedidoId);
            facturaService.createFromPedido(pedido, total);
        }

        pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }

    public double calculateTotal(Long pedidoId) {
        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedidoId);
        return items.stream()
                .mapToDouble(ItemPedido::getSubtotal)
                .sum();
    }

    @Transactional
    public Pedido updateObservaciones(Long id, String observaciones) {
        Pedido pedido = findById(id);
        pedido.setObservaciones(observaciones);
        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Pedido updateSacado(Long id, Boolean sacado) {
        Pedido pedido = findById(id);
        pedido.setSacado(sacado);
        return pedidoRepository.save(pedido);
    }
}
