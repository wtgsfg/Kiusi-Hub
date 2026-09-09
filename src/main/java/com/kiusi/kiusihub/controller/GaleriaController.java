package com.kiusi.kiusihub.controller;

import com.kiusi.kiusihub.model.Galeria;
import com.kiusi.kiusihub.service.AdminAuthorizationService;
import com.kiusi.kiusihub.service.GaleriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;


import java.util.List;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/galeria")
@CrossOrigin(origins = "*")
public class GaleriaController {

    private final GaleriaService galeriaService;
    private final AdminAuthorizationService adminAuthorizationService;

    public GaleriaController(
            GaleriaService galeriaService,
            AdminAuthorizationService adminAuthorizationService) {

        this.galeriaService = galeriaService;
        this.adminAuthorizationService = adminAuthorizationService;
    }

    // =====================================================
    // OBTENER TODAS LAS FOTOGRAFÍAS
    // GET /api/galeria
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Galeria>> obtenerTodas() {

        return ResponseEntity.ok(
                galeriaService.findAll()
        );
    }


    // =====================================================
    // OBTENER UNA FOTOGRAFÍA POR ID
    // GET /api/galeria/{id}
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<Galeria> obtenerPorId(
            @PathVariable Long id) {

        return galeriaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    // =====================================================
    // OBTENER FOTOGRAFÍAS POR AÑO
    // GET /api/galeria/anio/{anio}
    // =====================================================

    @GetMapping("/anio/{anio}")
    public ResponseEntity<List<Galeria>> obtenerPorAnio(
            @PathVariable Integer anio) {

        return ResponseEntity.ok(
                galeriaService.findByAnio(anio)
        );
    }


    // =====================================================
    // OBTENER FOTOGRAFÍAS POR EVENTO
    // GET /api/galeria/evento/{evento}
    // =====================================================

    @GetMapping("/evento/{evento}")
    public ResponseEntity<List<Galeria>> obtenerPorEvento(
            @PathVariable String evento) {

        return ResponseEntity.ok(
                galeriaService.findByEvento(evento)
        );
    }


    // =====================================================
    // CREAR UNA FOTOGRAFÍA
    // POST /api/galeria
    //
    // SOLO ADMINISTRADORES
    // =====================================================

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> subirGaleria(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("anio") Integer anio,
            @RequestParam("evento") String evento,
            @RequestParam("imagen") MultipartFile imagen,
            @RequestHeader("X-Usuario-Id") Long usuarioId) {

        // Verificar administrador
        if (!adminAuthorizationService.esAdministrador(usuarioId)) {

            return ResponseEntity
                    .status(403)
                    .body("No tienes permisos para modificar la galería.");
        }

        // Verificar que exista una imagen
        if (imagen == null || imagen.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("Debes seleccionar una imagen.");
        }

        // Verificar que sea una imagen
        String contentType = imagen.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {

            return ResponseEntity
                    .badRequest()
                    .body("El archivo seleccionado no es una imagen válida.");
        }

        try {

            // Crear carpeta si no existe
            Path directorio = Paths.get("uploads/galeria");

            Files.createDirectories(directorio);

            // Obtener extensión
            String nombreOriginal = imagen.getOriginalFilename();

            String extension = "";

            if (nombreOriginal != null &&
                    nombreOriginal.contains(".")) {

                extension = nombreOriginal.substring(
                        nombreOriginal.lastIndexOf(".")
                );
            }

            // Crear nombre único
            String nombreArchivo =
                    UUID.randomUUID() + extension;

            // Ruta final
            Path rutaArchivo =
                    directorio.resolve(nombreArchivo);

            // Guardar archivo
            Files.write(
                    rutaArchivo,
                    imagen.getBytes()
            );

            // Crear objeto Galeria
            Galeria galeria = new Galeria();

            galeria.setTitulo(titulo);
            galeria.setDescripcion(descripcion);
            galeria.setImagenUrl(
                    "/uploads/galeria/" + nombreArchivo
            );
            galeria.setAnio(anio);
            galeria.setEvento(evento);
            galeria.setActivo(true);

            // Guardar información en MySQL
            Galeria nuevaGaleria =
                    galeriaService.save(galeria);

            return ResponseEntity
                    .status(201)
                    .body(nuevaGaleria);

        } catch (IOException e) {

            return ResponseEntity
                    .internalServerError()
                    .body("No fue posible guardar la imagen.");
        }
    }
}