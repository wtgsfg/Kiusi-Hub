-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 01-07-2026 a las 16:42:11
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `kiusi_hub_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` bigint(20) NOT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `nit` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `numero` varchar(255) DEFAULT NULL,
  `vendedor` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `ciudad`, `direccion`, `nit`, `nombre`, `numero`, `vendedor`) VALUES
(1, 'Medellin', 'Calle 123', '123456', 'Empresa ABC', '3001234567', 'Juan'),
(2, 'Medellin', 'Calle 47#67856', '32435353', 'Gallon', '3242579768', 'vendedor'),
(3, 'Bogota', 'sdfsdf', '3434', 'Samuel', '3435466', 'vendedor'),
(4, 'Barrancabermeja', 'los patos', '1234', 'Teo', '32343242', 'admin'),
(5, 'Barranquilla', 'dfdf', '3434', 'Paula', '343434', 'vendedor'),
(6, 'Medellin', 'dfdf', '34124234', 'Hector', '332434', 'Samuel'),
(7, 'medellín', 'dfdgfdg', '33434', 'potroi', '343434', 'Samuel');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` bigint(20) NOT NULL,
  `cliente` varchar(255) DEFAULT NULL,
  `fecha` datetime(6) DEFAULT NULL,
  `pedido_id` bigint(20) DEFAULT NULL,
  `total` double NOT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `pagado` double NOT NULL,
  `saldo` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id`, `cliente`, `fecha`, `pedido_id`, `total`, `estado`, `pagado`, `saldo`) VALUES
(23, 'Samuel', '2026-05-26 23:18:38.000000', 18, 40000, 'PAGADO', 40000, 0),
(24, 'potroi', '2026-06-05 07:32:50.000000', 20, 410000, 'PENDIENTE', 210000, 200000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items_nota_credito`
--

CREATE TABLE `items_nota_credito` (
  `id` bigint(20) NOT NULL,
  `nota_credito_id` bigint(20) NOT NULL,
  `item_pedido_id` bigint(20) NOT NULL,
  `nombre_producto` varchar(255) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `items_nota_credito`
--

INSERT INTO `items_nota_credito` (`id`, `nota_credito_id`, `item_pedido_id`, `nombre_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 28, 'Bolso', 2, 100000.00, 200000.00),
(2, 2, 29, 'Llavero ', 1, 10000.00, 10000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `items_pedido`
--

CREATE TABLE `items_pedido` (
  `id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `nombre_producto` varchar(255) DEFAULT NULL,
  `precio` double NOT NULL,
  `producto_id` bigint(20) DEFAULT NULL,
  `subtotal` double NOT NULL,
  `pedido_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `items_pedido`
--

INSERT INTO `items_pedido` (`id`, `cantidad`, `nombre_producto`, `precio`, `producto_id`, `subtotal`, `pedido_id`) VALUES
(25, 4, 'Llavero ', 10000, 20, 40000, 18),
(26, 5, 'Bolso', 100000, 21, 500000, 19),
(27, 1, 'Llavero ', 10000, 20, 10000, 19),
(28, 4, 'Bolso', 100000, 21, 400000, 20),
(29, 1, 'Llavero ', 10000, 20, 10000, 20);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas_credito`
--

CREATE TABLE `notas_credito` (
  `id` bigint(20) NOT NULL,
  `factura_id` bigint(20) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `fecha` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notas_credito`
--

INSERT INTO `notas_credito` (`id`, `factura_id`, `monto`, `motivo`, `fecha`) VALUES
(1, 24, 200000.00, 'dfdfs', '2026-07-01'),
(2, 24, 10000.00, 'cfggfgf', '2026-07-01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` bigint(20) NOT NULL,
  `cliente` varchar(255) DEFAULT NULL,
  `estado` enum('DESPACHADO','EMPACADO','RECIBIDO','REVISADO','SACADO') DEFAULT NULL,
  `fecha` datetime(6) DEFAULT NULL,
  `vendedor` varchar(255) DEFAULT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `sacado` bit(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `cliente`, `estado`, `fecha`, `vendedor`, `observaciones`, `sacado`) VALUES
(18, 'Samuel', 'DESPACHADO', '2026-05-26 23:17:34.000000', 'admin', NULL, NULL),
(19, 'Hector', 'RECIBIDO', '2026-06-05 06:49:44.000000', 'Samuel', NULL, NULL),
(20, 'potroi', 'DESPACHADO', '2026-06-05 07:29:37.000000', 'Samuel', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` bigint(20) NOT NULL,
  `activo` bit(1) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  `precio` double NOT NULL,
  `stock` int(11) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `categoria` varchar(255) DEFAULT NULL,
  `referencia` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `activo`, `descripcion`, `nombre`, `precio`, `stock`, `imagen_url`, `categoria`, `referencia`) VALUES
(20, b'1', 'Lo mejor ', 'Llavero ', 10000, 2, '/uploads/c8f238f0-6940-4ec5-9e88-92772c76e3ba_images.jpeg', 'LLAVEROS', 'QC-315'),
(21, b'1', 'fdfd', 'Bolso', 100000, 5, '/uploads/42cd7811-4f4d-4153-bcbb-49fbc9ef5372_amir-bolso-negro-799-748981_000799-1.jpg.webp', 'BOLSOS', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recaudos`
--

CREATE TABLE `recaudos` (
  `id` bigint(20) NOT NULL,
  `factura_id` bigint(20) DEFAULT NULL,
  `fecha` datetime(6) DEFAULT NULL,
  `monto` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recaudos`
--

INSERT INTO `recaudos` (`id`, `factura_id`, `fecha`, `monto`) VALUES
(17, 23, '2026-06-03 06:43:19.000000', 20000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `password`, `rol`, `username`) VALUES
(1, '1234', 'ADMIN', 'admin'),
(3, '1234', 'BODEGUERO', 'bodeguero'),
(4, '1234', 'CARTERA', 'cartera'),
(5, '1234', 'VENDEDOR', 'Samuel'),
(6, '1234', 'BODEGUERO', 'Alvaro');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `items_nota_credito`
--
ALTER TABLE `items_nota_credito`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nota_credito_id` (`nota_credito_id`),
  ADD KEY `item_pedido_id` (`item_pedido_id`);

--
-- Indices de la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKhshdf36fo6kflmxhom10pbn39` (`pedido_id`);

--
-- Indices de la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_id` (`factura_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `recaudos`
--
ALTER TABLE `recaudos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `items_nota_credito`
--
ALTER TABLE `items_nota_credito`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `recaudos`
--
ALTER TABLE `recaudos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `items_nota_credito`
--
ALTER TABLE `items_nota_credito`
  ADD CONSTRAINT `items_nota_credito_ibfk_1` FOREIGN KEY (`nota_credito_id`) REFERENCES `notas_credito` (`id`),
  ADD CONSTRAINT `items_nota_credito_ibfk_2` FOREIGN KEY (`item_pedido_id`) REFERENCES `items_pedido` (`id`);

--
-- Filtros para la tabla `items_pedido`
--
ALTER TABLE `items_pedido`
  ADD CONSTRAINT `FKhshdf36fo6kflmxhom10pbn39` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`);

--
-- Filtros para la tabla `notas_credito`
--
ALTER TABLE `notas_credito`
  ADD CONSTRAINT `notas_credito_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
