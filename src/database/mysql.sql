--//mysql

-- //creaate user and asing it to the list of users on mysql
create user fsoarez@localhost identified by 'Automation2121@1';
create user user1@% identified by 'pass1';

grant all privileges on tambox.* to fsoarez@localhost;


GRANT ALL PRIVILEGES ON *.* TO fsoarez@localhost IDENTIFIED BY 'Autoamtion2121@1';
GRANT ALL PRIVILEGES ON *.* TO user1@localhost IDENTIFIED BY 'pass1';


--Create the database
CREATE DATABASE tambox;

--select desired db
use tambox;
-- CREATE THE USERS table
CREATE TABLE users(
id INT (11) NOT NULL,
username VARCHAR(16) NOT NULL,
password VARCHAR(60) NOT NULL,
fullname VARCHAR(100) NOT NULL

);

CREATE TABLE remesa_hermes(
id INT (11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
monto INT(16) NOT NULL,
tebs_barcode INT(20) NOT NULL,
machine_sn INT(20) NOT NULL,
status VARCHAR(20) NOT NULL DEFAULT 'iniciada'
);

ALTER TABLE users
ADD PRIMARY KEY(id);

ALTER TABLE users
MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 2;

--Create the table
CREATE TABLE links(
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(40) NOT NULL,
    url VARCHAR(70) NOT NULL,
    description TEXT,
    user_id INT(11),
    created_at timestamp NOT NULL DEFAULT current_timestamp,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
ALTER TABLE links
ADD PRIMARY KEY (id);

ALTER TABLE links
MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 2;

ALTER TABLE remesas MODIFY status VARCHAR(25);

--
--Create the table
CREATE TABLE remesas(
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tienda_id INT(10) NOT NULL,
    no_caja INT(10) NOT NULL,
    codigo_empleado INT(10) NOT NULL,
    no_remesa INT(10) NOT NULL,
    fecha timestamp NOT NULL DEFAULT current_timestamp,
    hora TIME ,
    monto INT(11) NOT NULL,
    moneda VARCHAR(10),
    status VARCHAR(10),
    rms_status VARCHAR(10)
    );

ALTER TABLE remesas ALTER COLUMN status SET DEFAULT 'iniciada';
ALTER TABLE remesas ALTER COLUMN rms_status SET DEFAULT 'pendiente';

ALTER TABLE remesas ALTER COLUMN status_hermes SET DEFAULT 'en_tambox';

TRUNCATE TABLE remesas;

SELECT * FROM remesas;

UPDATE remesas SET rms_status=finalizada WHERE no_remesa=003;
ALTER TABLE remesas ADD UNIQUE (status);

CREATE TABLE creditos(
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    no_remesa INT(10) NOT NULL,
    monto INT(10) NOT NULL,
    status VARCHAR(10)
    );

ALTER TABLE remesas DROP INDEX rms_status;

ALTER TABLE remesas ADD status_hermes VARCHAR(20);
ALTER TABLE remesas ADD tebs_barcode VARCHAR(20);
ALTER TABLE remesas ADD machine_sn VARCHAR(20);
ALTER TABLE creditos ADD moneda VARCHAR(3);
ALTER TABLE remesa_hermes ADD moneda VARCHAR(3);


ALTER TABLE remesas ADD tipo VARCHAR(20);
/////////////////////////////////////////////////////////////////////////
CREATE TABLE parameters(
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tbm_ip varchar(20) NOT NULL,
    tbm_port varchar(10) NOT NULL
    );

ALTER TABLE remesas ADD status_tbm VARCHAR(20)  DEFAULT 'not_synched';
