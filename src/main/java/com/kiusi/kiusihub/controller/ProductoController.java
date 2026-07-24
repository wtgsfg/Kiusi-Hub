package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.Producto;
import com.kiusi.kiusihub.service.ProductoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;
    private final Path uploadPath;

    public ProductoController(ProductoService productoService, @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.productoService = productoService;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping
    public ResponseEntity<List<Producto>> getAll() {
        return ResponseEntity.ok(productoService.findAll());
    }

    @GetMapping("/catalogo")
    public ResponseEntity<List<Producto>> getCatalogo() {
        return ResponseEntity.ok(productoService.findCatalogo());
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<Producto>> getByCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(productoService.findByCategoria(categoria));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Producto> create(
            @RequestParam(value = "referencia", required = false) String referencia,
            @RequestParam("nombre") String nombre,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("precio") double precio,
            @RequestParam("stock") int stock,
            @RequestParam("categoria") String categoria,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {
        Producto producto = new Producto();
        producto.setReferencia(referencia);
        producto.setNombre(nombre);
        producto.setDescripcion(descripcion);
        producto.setPrecio(precio);
        producto.setStock(stock);
        producto.setCategoria(categoria);
        producto.setActivo(true);

        if (imagen != null && !imagen.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + imagen.getOriginalFilename();
            Path path = uploadPath.resolve(filename);
            Files.createDirectories(path.getParent());
            Files.write(path, imagen.getBytes());
            producto.setImagenUrl("/uploads/" + filename);
        }

        return new ResponseEntity<>(productoService.save(producto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> update(
            @PathVariable Long id,
            @RequestParam(value = "referencia", required = false) String referencia,
            @RequestParam("nombre") String nombre,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("precio") double precio,
            @RequestParam("stock") int stock,
            @RequestParam("categoria") String categoria,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen
    ) throws IOException {
        Producto producto = productoService.findById(id);
        producto.setReferencia(referencia);
        producto.setNombre(nombre);
        producto.setDescripcion(descripcion);
        producto.setPrecio(precio);
        producto.setStock(stock);
        producto.setCategoria(categoria);

        if (imagen != null && !imagen.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + imagen.getOriginalFilename();
            Path path = uploadPath.resolve(filename);
            Files.createDirectories(path.getParent());
            Files.write(path, imagen.getBytes());
            producto.setImagenUrl("/uploads/" + filename);
        }

        return ResponseEntity.ok(productoService.save(producto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}