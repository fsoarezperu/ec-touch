-- --------------------------------------------------------
-- Host:                         192.168.1.18
-- Versión del servidor:         10.1.45-MariaDB-0+deb9u1 - Raspbian 9.11
-- SO del servidor:              debian-linux-gnueabihf
-- HeidiSQL Versión:             11.2.0.6250
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para tambox
CREATE DATABASE IF NOT EXISTS `tambox` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `tambox`;

-- Volcando estructura para tabla tambox.creditos
CREATE TABLE IF NOT EXISTS `creditos` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `no_remesa` varchar(41) DEFAULT NULL,
  `monto` int(10) NOT NULL,
  `status` varchar(10) DEFAULT NULL,
  `moneda` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla tambox.creditos: ~41 rows (aproximadamente)
/*!40000 ALTER TABLE `creditos` DISABLE KEYS */;
INSERT INTO `creditos` (`id`, `no_remesa`, `monto`, `status`, `moneda`) VALUES
	(1, '8323', 20, 'processed', 'PEN'),
	(2, '7585', 20, 'processed', 'PEN'),
	(3, '2619', 100, 'processed', 'PEN'),
	(4, '2640', 50, 'processed', 'PEN'),
	(5, '3608', 100, 'processed', 'PEN'),
	(6, '3608', 50, 'processed', 'PEN'),
	(7, '3608', 20, 'processed', 'PEN'),
	(8, '3608', 20, 'processed', 'PEN'),
	(9, '7309', 20, 'processed', 'PEN'),
	(10, '7309', 20, 'processed', 'PEN'),
	(11, '7309', 100, 'processed', 'PEN'),
	(12, '7309', 50, 'processed', 'PEN'),
	(13, '6543', 20, 'processed', 'PEN'),
	(14, '6543', 50, 'processed', 'PEN'),
	(15, '6543', 20, 'processed', 'PEN'),
	(16, '6543', 100, 'processed', 'PEN'),
	(17, '6543', 100, 'processed', 'PEN'),
	(18, '6513', 20, 'processed', 'PEN'),
	(19, '6525', 20, 'processed', 'PEN'),
	(20, '7009', 20, 'processed', 'PEN'),
	(21, '6793', 100, 'processed', 'PEN'),
	(22, '9846', 50, 'processed', 'PEN'),
	(23, '552', 20, 'processed', 'PEN'),
	(24, '2507', 20, 'processed', 'PEN'),
	(25, '50', 50, 'processed', 'PEN'),
	(26, '6762', 20, 'processed', 'PEN'),
	(27, '8060', 20, 'processed', 'PEN'),
	(28, '9858', 20, 'processed', 'PEN'),
	(29, '9858', 50, 'processed', 'PEN'),
	(30, '8050', 50, 'processed', 'PEN'),
	(31, '8305', 100, 'processed', 'PEN'),
	(32, '7547', 100, 'processed', 'PEN'),
	(33, '9135', 100, 'processed', 'PEN'),
	(34, '9301', 20, 'processed', 'PEN'),
	(35, '9301', 20, 'processed', 'PEN'),
	(36, '9301', 100, 'processed', 'PEN'),
	(37, '9301', 100, 'processed', 'PEN'),
	(38, '9301', 100, 'processed', 'PEN'),
	(39, '9301', 50, 'processed', 'PEN'),
	(40, '9301', 50, 'processed', 'PEN'),
	(41, '9301', 20, 'processed', 'PEN');
/*!40000 ALTER TABLE `creditos` ENABLE KEYS */;

-- Volcando estructura para tabla tambox.machine
CREATE TABLE IF NOT EXISTS `machine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tienda_id` varchar(45) DEFAULT '9999',
  `machine_sn` varchar(45) DEFAULT '12345',
  `machine_ip` varchar(45) DEFAULT '0.0.0.0',
  `machine_port` varchar(45) DEFAULT '4000',
  `is_registered` tinyint(4) DEFAULT '0',
  `machine_name` varchar(45) DEFAULT 'Needs Adoption',
  `public_machine_ip` varchar(45) DEFAULT '0.0.0.0',
  `limite_maximo_de_retiro` varchar(45) DEFAULT '0',
  `passcode` varchar(45) DEFAULT '1234',
  `monto_en_reciclador` varchar(45) DEFAULT '0',
  `billetes_de_10` varchar(45) DEFAULT '0',
  `billetes_de_20` varchar(45) DEFAULT '0',
  `billetes_de_50` varchar(45) DEFAULT '0',
  `billetes_de_100` varchar(45) DEFAULT '0',
  `billetes_de_200` varchar(45) DEFAULT '0',
  `no_billetes_reci` varchar(45) DEFAULT '0',
  `no_billetes_bolsa` varchar(45) DEFAULT '0',
  `tipo` varchar(45) DEFAULT NULL,
  `latitude` varchar(45) DEFAULT NULL,
  `longitude` varchar(45) DEFAULT NULL,
  `is_locked` varchar(45) DEFAULT '0',
  `monto_actual` varchar(45) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla tambox.machine: ~1 rows (aproximadamente)
/*!40000 ALTER TABLE `machine` DISABLE KEYS */;
INSERT INTO `machine` (`id`, `tienda_id`, `machine_sn`, `machine_ip`, `machine_port`, `is_registered`, `machine_name`, `public_machine_ip`, `limite_maximo_de_retiro`, `passcode`, `monto_en_reciclador`, `billetes_de_10`, `billetes_de_20`, `billetes_de_50`, `billetes_de_100`, `billetes_de_200`, `no_billetes_reci`, `no_billetes_bolsa`, `tipo`, `latitude`, `longitude`, `is_locked`, `monto_actual`) VALUES
	(1, '0103', '4824549', '192.168.1.18', '4000', 0, 'PRO_0103', '190.234.172.101', '0', '1234', '0', '0', '0', '0', '0', '0', '0', '0', 'TEBS+Payout', NULL, NULL, '1', '0');
/*!40000 ALTER TABLE `machine` ENABLE KEYS */;

-- Volcando estructura para tabla tambox.remesas
CREATE TABLE IF NOT EXISTS `remesas` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `tienda_id` varchar(4) NOT NULL,
  `no_caja` varchar(5) NOT NULL,
  `codigo_empleado` varchar(10) NOT NULL,
  `no_remesa` varchar(41) NOT NULL,
  `fecha` varchar(10) DEFAULT NULL,
  `hora` varchar(8) DEFAULT NULL,
  `monto` int(11) NOT NULL DEFAULT '0',
  `moneda` varchar(10) DEFAULT 'soles',
  `status` varchar(25) DEFAULT 'iniciada',
  `rms_status` varchar(10) DEFAULT 'pendiente',
  `tebs_barcode` int(20) DEFAULT NULL,
  `machine_sn` int(20) DEFAULT NULL,
  `tipo` varchar(20) DEFAULT NULL,
  `status_hermes` varchar(20) DEFAULT 'en_tambox',
  `no_billetes` int(11) DEFAULT '0',
  `ts` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla tambox.remesas: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `remesas` DISABLE KEYS */;
/*!40000 ALTER TABLE `remesas` ENABLE KEYS */;

-- Volcando estructura para tabla tambox.remesa_hermes
CREATE TABLE IF NOT EXISTS `remesa_hermes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `monto` int(16) NOT NULL,
  `tebs_barcode` int(20) NOT NULL,
  `machine_sn` int(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'iniciada',
  `moneda` varchar(3) DEFAULT NULL,
  `fecha` varchar(45) DEFAULT NULL,
  `hora` varchar(45) DEFAULT NULL,
  `no_billetes` int(10) DEFAULT NULL,
  `tienda_id` varchar(45) DEFAULT NULL,
  `fecha_fin` varchar(45) DEFAULT NULL,
  `hora_fin` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla tambox.remesa_hermes: ~1 rows (aproximadamente)
/*!40000 ALTER TABLE `remesa_hermes` DISABLE KEYS */;
INSERT INTO `remesa_hermes` (`id`, `monto`, `tebs_barcode`, `machine_sn`, `status`, `moneda`, `fecha`, `hora`, `no_billetes`, `tienda_id`, `fecha_fin`, `hora_fin`) VALUES
	(2, 0, 1144369, 4824549, 'iniciada', 'PEN', '2021-3-15', '9:29:56', 0, '9999', NULL, NULL);
/*!40000 ALTER TABLE `remesa_hermes` ENABLE KEYS */;

-- Volcando estructura para tabla tambox.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Volcando datos para la tabla tambox.sessions: ~0 rows (aproximadamente)
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
