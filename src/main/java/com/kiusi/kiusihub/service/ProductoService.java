package com.kiusi.kiusihub.service;

import com.kiusi.kiusihub.exception.ResourceNotFoundException;
import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> findAll() {
        return productoRepository.findAll();
    }

    public Producto findById(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
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
        return productoRepository.save(existingProducto);
    }

    public void delete(Long id) {
        productoRepository.deleteById(id);
    }

    public List<Producto> findCatalogo() {
        return productoRepository.findByStockGreaterThan(0);
    }

    public List<Producto> findByCategoria(String categoria) {
        return productoRepository.findByCategoria(categoria);
    }

    public List<String> findAllCategorias() {
        return productoRepository.findAllCategorias();
    }
}