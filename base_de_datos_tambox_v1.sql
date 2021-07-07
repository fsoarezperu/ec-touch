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

-- La exportación de datos fue deseleccionada.

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

-- La exportación de datos fue deseleccionada.

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

-- La exportación de datos fue deseleccionada.

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

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla tambox.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- La exportación de datos fue deseleccionada.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
