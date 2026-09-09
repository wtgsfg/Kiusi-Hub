package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.model.Pedido;
import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.repository.ItemPedidoRepository;
import com.kiusi.kiusihub.repository.PedidoRepository;
import com.kiusi.kiusihub.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ItemPedidoService {

    private final ItemPedidoRepository itemPedidoRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public ItemPedidoService(
            ItemPedidoRepository itemPedidoRepository,
            PedidoRepository pedidoRepository,
            ProductoRepository productoRepository
    ) {
        this.itemPedidoRepository = itemPedidoRepository;
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    public List<ItemPedido> findByPedidoId(Long pedidoId) {
        return itemPedidoRepository.findByPedidoId(pedidoId);
    }

    public ItemPedido findById(Long id) {
        return itemPedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemPedido no encontrado"));
    }

    @Transactional
    public ItemPedido addItem(Long pedidoId, Long productoId, int cantidad) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        if (producto.getStock() < cantidad) {
            throw new RuntimeException("No hay suficiente stock para el producto: " + producto.getNombre());
        }

        producto.setStock(producto.getStock() - cantidad);
        productoRepository.save(producto);

        ItemPedido item = new ItemPedido();
        item.setPedido(pedido);
        item.setProductoId(producto.getId());
        item.setNombreProducto(producto.getNombre());
        item.setCantidad(cantidad);
        item.setPrecio(producto.getPrecio());
        item.setSubtotal(producto.getPrecio() * cantidad);

        return itemPedidoRepository.save(item);
    }

    @Transactional
    public ItemPedido addItemWithPrice(Long pedidoId, Long productoId, int cantidad, double precio) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        if (producto.getStock() < cantidad) {
            throw new RuntimeException("No hay suficiente stock para el producto: " + producto.getNombre());
        }

        producto.setStock(producto.getStock() - cantidad);
        productoRepository.save(producto);

        ItemPedido item = new ItemPedido();
        item.setPedido(pedido);
        item.setProductoId(producto.getId());
        item.setNombreProducto(producto.getNombre());
        item.setCantidad(cantidad);
        item.setPrecio(precio);
        item.setSubtotal(precio * cantidad);

        return itemPedidoRepository.save(item);
    }

    @Transactional
    public ItemPedido update(Long id, int cantidad) {
        ItemPedido item = findById(id);
        Producto producto = productoRepository.findById(item.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        int diferencia = cantidad - item.getCantidad();
        if (diferencia > 0 && producto.getStock() < diferencia) {
            throw new RuntimeException("No hay suficiente stock para el producto: " + producto.getNombre());
        }

        if (diferencia > 0) {
            producto.setStock(producto.getStock() - diferencia);
        } else if (diferencia < 0) {
            producto.setStock(producto.getStock() + Math.abs(diferencia));
        }
        productoRepository.save(producto);

        item.setCantidad(cantidad);
        item.setSubtotal(item.getPrecio() * cantidad);
        return itemPedidoRepository.save(item);
    }

    @Transactional
    public ItemPedido updateWithPrice(Long id, int cantidad, double precio) {
        ItemPedido item = findById(id);
        Producto producto = productoRepository.findById(item.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        int diferencia = cantidad - item.getCantidad();
        if (diferencia > 0 && producto.getStock() < diferencia) {
            throw new RuntimeException("No hay suficiente stock para el producto: " + producto.getNombre());
        }

        if (diferencia > 0) {
            producto.setStock(producto.getStock() - diferencia);
        } else if (diferencia < 0) {
            producto.setStock(producto.getStock() + Math.abs(diferencia));
        }
        productoRepository.save(producto);

        item.setCantidad(cantidad);
        item.setPrecio(precio);
        item.setSubtotal(precio * cantidad);
        return itemPedidoRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        ItemPedido item = findById(id);
        Producto producto = productoRepository.findById(item.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        producto.setStock(producto.getStock() + item.getCantidad());
        productoRepository.save(producto);

        itemPedidoRepository.delete(item);
    }
}