<h1 align="center">📄 Documento de Alcance de Funcionalidades</h1>

<br>

## 1. Objetivo General

Desarrollar una aplicación móvil de viajes compartidos que permita a los usuarios coordinar traslados de manera sencilla, ya sea para transportar pasajeros o enviar paquetería.  
La plataforma debe permitir que cada usuario actúe como conductor, pasajero o remitente, con la opción de publicar o buscar viajes hacia un destino específico.  
El sistema establecerá el trayecto acordado y mostrará el recorrido mediante un mapa estático.

<br>

## 2. Problemas a Resolver

- Reducir costos del viaje.
- Posibilidad de disponer de viajes en rutas largas o zonas rurales donde no hay colectivos frecuentes.
- Ofrece compañia y mas seguridad en trayectos largos.
- Envíos urgentes o fuera de horario.
- Encomiendas a destinos donde no llegan servicios formales.
- Se aprovechan asientos libres y viajes que ya se realizan de todas formas.
- Dificultad para encontrar compañeros de viaje confiables (La app ofrece un sistema de calificacion por usuarios).

<br>

## 3. Caracteristicas Principales

### 3.1 Gestión de usuarios

- Registro mediante email y contraseña.
- Inicio de sesión seguro con token JWT.
- Edición de perfil.
- Recuperación de contraseña vía correo electrónico.

### 3.2 Gestión de vehículos

- Alta de nuevo vehículo.
- Cargar documentación requerida.

### 3.3 Gestión de viajes

- Publicación de un viaje: fecha, hora, origen, destino, asientos disponibles, tipo de viaje (pasajeros / encomienda).
- Búsqueda de viajes por origen, destino y fecha.
- Confimación y aceptación de pasajeros o encomiendas.
- Visualizacion del trayecto en un mapa estático.
- Cancelación de viaje por parte del conductor o el pasajero, con notificación correspondiente.

### 3.4 Gestión de reservas y encomiendas

- Solicitud de reserva de asientos o envio de encomienda.
- Confirmación de reservas por el conductor.
- Historial de viajes realizados y futuros por cada usuario.

### 3.5 Sistema de calificaciones y comentarios

- Calificación de conductores y pasajeros despues de cada viaje.
- Comentarios opcionales para mejorar la confiabilidad del sistema.
- Visualización de calificaciones promedio en los perfiles de usuarios.

### 3.6 Sistema de mensajeria

- Envio y recibimiento de mensajes entre conductores y pasajeros con un viaje anteriormente pactado.

### 3.7 Sistema de notificaciones

- Notificaciones push o vía correo sobre:

  - Confirmación de reservas.
  - Cancelaciones de viajes.
  - Mensajes entre conductor y pasajero / remitente.
  - Recordatorios de viajes próximos.

### 3.8 Panel administrativo

- Ver reportes de los usuarios.
- Eliminar / banear usuarios que muestren un comportamiento irregular.
- Eliminar viajes publicados que sean sospechosos.

### 3.9 Seguridad y privacidad

- Autenticación y autorizacion segura con token JWT.
- Almacenamiento seguro de datos personales y documentación de vehículos.
- Posibilidad de denunciar usuarios o viajes sospechosos.

<br>

## 4. Alcance del proyecto

- La aplicación permitirá coordinar viajes compartidos de pasajeros y encomiendas.
- No incluirá navegación en tiempo real ni seguimiento en vivo del viaje (solo mapa estático del recorrido).
- Se enfocará en viajes nacionales o locales, según la disponibilidad de usuarios y rutas cargadas.
- No se implementará pasarela de pagos.

<br>

## 5. Usuarios objetivo

- Personas que necesitan un dinero extra y quieren aprovechar los asientos libres en sus viajes.
- Personas que quieran enviar paquetes a distintas partes del país.
- Personas que necesiten viajes a zonas donde el transporte tradicional no llega.
