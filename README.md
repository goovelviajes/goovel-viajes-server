<p align="center">
 <a href="https://imgbb.com/"><img src="https://i.ibb.co/W4V2MVr5/Captura-de-pantalla-2025-08-18-152822.png" alt="Captura-de-pantalla-2025-08-18-152822" border="0" /></a>
</p>

<h2 align="center"><strong>Goovel</strong></h1>
  
<p align="center"><strong>Tecnologias Utilizadas:</strong></p>

<div align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/NestJS-red?style=for-the-badge&logo=nestjs&logoColor=D62828&labelColor=white&color=D62828" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/MySQL-white?style=for-the-badge&logo=mysql&logoColor=blue&labelColor=white&color=blue" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/TypeORM-red?style=for-the-badge&logo=typeorm&logoColor=F86624&labelColor=white&color=D62828" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/Swagger-red?style=for-the-badge&logo=swagger&logoColor=0AD3FF&labelColor=white&color=0AD3FF" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/Jest-black?style=for-the-badge&logo=jest&logoColor=DE1A1A&labelColor=white&color=DE1A1A" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/Typescript-black?style=for-the-badge&logo=typescript&logoColor=2B50AA&labelColor=white&color=2B50AA" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/JWT-green?style=for-the-badge&logo=jsonwebtokens&logoColor=FF8C42&labelColor=white&color=FF8C42" alt="NPM Version" /></a>

</p></div>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

  <br>

## Descripción general

Goovel es una aplicacion movil de viajes compartidos que permite a los usuarios:
 - **Ser conductor**: Ofrecer asientos disponibles en sus vehiculos.
 - **Ser pasajero**: Encontrar viajes publicados a un destino en especifico y compartir gastos.
 - **Enviar paqueteria**: Coordinar envios de paquetes utilizando viajes existentes

La plataforma busca:
 - Reducir costos de transporte.
 - Aprovechar viajes ya planificados para transportar personas o paquetes.
 - Ofrecer seguridad mediante calificaciones y perfiles verificados.

<br>

## Instalación

```bash
git clone https://github.com/tomascardenas96/Goovel-backend
cd Goovel-backend
npm install
```

<br>

## Variables de Entorno

```env
DB_HOST=your-database-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
DB_SYNCHRONIZE=false
PORT=3000
SECRET_KEY=supersecret
```

<br>

## Ejecución en Desarrollo

```bash
npm run start:dev
```

<br>

## Probar API con Swagger

Una vez corras el servidor, ingresá a:
```bash
http://localhost:3010/api
```

<br>

· Hacé click en "Authorize" e ingresá tu token JWT.

· Podés probar todas las rutas directamente desde Swagger UI.

<br>

## Integración con el Frontend

· El frontend debe enviar el token JWT en cada request protegido usando el header:

```makefile
Authorization: Bearer <token>
```

<br>

## Estructura del Proyecto

```pgsql
src/
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   └── guards/
│
├── user/
│   ├── user.entity.ts
│   ├── user.service.ts
│   └── user.controller.ts
│ 
├── common/
│
├── main.ts
└── app.module.ts
```

## Autor

Tomás Cárdenas 
<br>
<br>
🔗[Tomascardenas.me](https://tomascardenas.me)
<br>
🔗[Linkedin](https://www.linkedin.com/in/tomascardenas96/)
