package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.repository.ProductoRepository;
import com.kiusi.kiusihub.repository.ReservaStockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ReservaStockRepository reservaStockRepository;

    public ProductoService(ProductoRepository productoRepository, ReservaStockRepository reservaStockRepository) {
        this.productoRepository = productoRepository;
        this.reservaStockRepository = reservaStockRepository;
    }

    private List<Producto> enriquecerConDisponible(List<Producto> lista) {
        if (lista == null || lista.isEmpty()) return lista == null ? new ArrayList<>() : lista;
        Map<Long, Integer> reservadoPorProducto = reservaStockRepository.sumReservasActivasTodosLosProductos();
        for (Producto p : lista) {
            Integer reservado = reservadoPorProducto.get(p.getId());
            int res = reservado == null ? 0 : reservado;
            int disponible = Math.max(0, p.getStock() - res);
            p.setStockDisponible(disponible);
        }
        return lista;
    }

    private Producto enriquecerConDisponible(Producto p) {
        if (p == null) return null;
        int reservado = reservaStockRepository.sumReservasActivasProducto(p.getId());
        int disponible = Math.max(0, p.getStock() - reservado);
        p.setStockDisponible(disponible);
        return p;
    }

    public List<Producto> findAll() {
        return enriquecerConDisponible(productoRepository.findAll());
    }

    public Producto findById(Long id) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        return enriquecerConDisponible(p);
    }

    public Producto save(Producto producto) {
        return productoRepository.save(producto);
    }

    public Producto update(Long id, Producto producto) {
        Producto existingProducto = findById(id);
        existingProducto.setNombre(producto.getNombre());
        existingProducto.setDescripcion(producto.getDescripcion());
        existingProducto.setPrecio(producto.getPrecio());
        existingProducto.setStock(producto.getStock());
        existingProducto.setCategoria(producto.getCategoria());
        existingProducto.setImagenUrl(producto.getImagenUrl());
        existingProducto.setActivo(producto.isActivo());
        if (producto.getReferencia() != null) {
            existingProducto.setReferencia(producto.getReferencia());
        }
        return productoRepository.save(existingProducto);
    }

    public void delete(Long id) {
        productoRepository.deleteById(id);
    }

    public List<Producto> findCatalogo() {
        return enriquecerConDisponible(productoRepository.findByStockGreaterThan(0));
    }

    public List<Producto> findByCategoria(String categoria) {
        return enriquecerConDisponible(productoRepository.findByCategoria(categoria));
    }

    public List<String> findAllCategorias() {
        List<String> r = productoRepository.findAllCategorias();
        return r == null ? Collections.emptyList() : r;
    }
}
