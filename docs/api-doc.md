# 📄 Documentacion API Club Atletico Juarense

<br>
<br>

🗓️ Última actualización: 14/07/2025  
📍 Documentación viva: consultar Swagger en `/docs`

<br>
<br>

# Guia

1. [🔒 Auth](#-auth) - Registro, Inicio de sesion y obtener usuario activo.
2. [👤 User](#-user) - Actualización, búsqueda y eliminación de datos del usuario
3. [🫂 Group](#-group) - Creación, eliminación y búsqueda del grupo.
4. [👨‍👩‍👧‍👦 Family-member](#-family-member) - Asignar, eliminar y obtener miembros de familia.
5. [📃 Category](#-categoy) - Creación, eliminación y búsqueda de categorias.
6. [🏅 Discipline](#-discipline) - Creación, eliminación y búsqueda de disciplinas.
7. [🔒 User enrollment](#-user-enrollment) - Inscripción, eliminación y busqueda de inscripciones.
8. [🪙 Payment-method](#-payment-method) - Crear y obtener medios de pago.
9. [💰 Fee-payment](#-fee-payment) - Registrar pago de cuotas de membrecia y de disciplinas.
10. [💸 Payment-month](#-fee-payment) - Obtener historial de pagos mensuales del usuario activo.

<br>
<br>

## 🔒 Auth

### 1. **POST** `/auth/register`

- **Descripcion:** Registrar un nuevo usuario.

**Body (JSON):**

```json
{
  "name": "",
  "lastname": "",
  "email": "",
  "password": "",
  "birthdate": "",
  "dni": ""
}
```

**Response:**

```json
{
  "message": "Registration Successful"
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos inválidos (validación de campos).
  - El email ya está registrado.
- `500 Internal Server Error`:
  - Fallo inesperado al registrar el usuario.
  - Fallo inesperado al guardar el usuario.

<br>
<br>

### 2. **POST** `/auth/login`

- **Descripcion:** Inicio de sesion de un usuario existente.

**Body (JSON):**

```json
{
  "email": "",
  "password": ""
}
```

**Response:**

```json
{
  "access_token": ""
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos inválidos (validación de campos).
- `401 Unauthorized`:
  - Credenciales incorrectas.
  - Clave secreta no encontrada (JWT Token).
- `404 Not Found`:
  - Usuario no encontrado.
- `500 Internal Server Error`:

  - Fallo inesperado al loguear el usuario.
  - Fallo inesperado al obtener el usuario por Email.

  <br>
  <br>

### 3. **GET** `/auth`

- **Descripcion:** Obtener los datos del usuario autenticado.

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "id": "",
  "name": "",
  "lastname": "",
  "email": "",
  "phone": "",
  "birthdate": "",
  "createdAt": "",
  "updatedAt": "",
  "deletedAt": "",
  "isAdmin": "",
  "cuit": "",
  "cbu": ""
}
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.

<br>
<br>

## 👤 User

### 1. **PATCH** `/user`

- **Descripcion:** Actualizar los datos de usuario.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "name": "", //Opcional
  "lastname": "", //Opcional
  "birthdate": "", //Opcional
  "phone": "", //Opcional
  "dni": "", //Opcional
  "address": "", //Opcional
  "cuit": "", //Opcional
  "cbu": "", //Opcional
  "isAutoDebit": "" //Opcional
}
```

**Response:**

```json
{
  "id": "c7a66811-8b55-4798-a3f3-ac3a86e47c1f",
  "name": "Tomas",
  "lastname": "Cardenas",
  "email": "tomas@gmail.com",
  "phone": null,
  "birthdate": "2014-07-15",
  "createdAt": "2025-07-10T19:15:30.646Z",
  "updatedAt": "2025-07-12T22:17:18.000Z",
  "deletedAt": null,
  "isAdmin": false,
  "dni": "49433649",
  "address": null,
  "cuit": null,
  "cbu": null,
  "membershipNumber": null,
  "isAutoDebit": false
}
```

**Errores esperados:**

- `400 Bad Request`: Formato de datos invalido.
- `404 Not Found`: Usuario no encontrado.
- `500 Internal Server Error`: Error inesperado al actualizar el usuario.

<br>
<br>

### 2. **DELETE** `/user/me`

- **Descripcion:** Eliminar un usuario (soft delete).

**Headers:**

- `Authorization: Bearer <access_token>`

**Body:**

No requiere

**Response:**

Sin contenido

**Errores esperados**:

`404 Not Found`: Usuario no encontrado.<br>
`500 Internal Server Error`: Error inesperado al eliminar el usuario.

<br>
<br>

### 3. **GET** `/user/search`

- **Descripcion:** Buscar un usuario por cuit, dni o cbu.

**Headers:**

- `Authorization: Bearer <access_token>`

**Query:**

`value`: El cuit, dni o cbu del usuario.

**Responses:**

```json
[
  {
    "id": "user01",
    "name": "Tomas",
    "lastname": "Cardenas",
    "email": "tomas@gmail.com",
    "phone": null,
    "birthdate": "2014-07-15",
    "createdAt": "2025-07-10T19:15:30.646Z",
    "updatedAt": "2025-07-12T22:17:18.000Z",
    "deletedAt": null,
    "isAdmin": false,
    "dni": "49433649",
    "address": null,
    "cuit": null,
    "cbu": null,
    "membershipNumber": null,
    "isAutoDebit": false
  }
]
```

**Errores esperados**

- `500 Internal Server Error`: Error inesperado al buscar usuarios por filtro.

<br>
<br>

## 🫂 Group

### 1. **POST** `/group`

- **Descripcion:** Crear un nuevo grupo.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "groupName": "Grupo Familia Perez"
}
```

**Responses:**

```json
{
  "id": "group01",
  "groupName": "Grupo Familia Perez",
  "titular": "user01"
}
```

**Errores esperados:**

- `404 Not Found`: Usuario no encontrado.
- `409 Conflict`:
  - Nombre de grupo ya existente.
  - El usuario ya tiene un grupo.
- `500 Internal Server Error`:
  - Error inesperado al verificar si el usuario ya tiene grupo.
  - Error inesperado al crear un nuevo grupo.

<br>
<br>

### 2. **DELETE** `/group/:id`

- **Descripcion:** Eliminar grupo.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id del grupo.

**Response:**

```json
{
  "message": "Group deleted successfully",
  "id": "group01"
}
```

**Errores inesperados:**

- `401 Unauthorized`:
  - Token invalido o inexistente.
  - Debes ser titular para eliminar el grupo.
- `404 Not Found`: Grupo no encontrado.
- `500 Internal Server Error`: Error inesperado al eliminar un grupo.

<br>
<br>

### 3. **GET** `/group`

- **Descripcion:** Obtener todos los grupos disponibles.

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
[
  {
    "id": "group01",
    "groupName": "Grupo Familia Perez",
    "titular": "user01"
  }
]
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `500 Internal Server Error`: Error inesperado al obtener todos los grupos.

<br>
<br>

### 4. **GET** `/group/:id`

- **Descripcion:** Obtener grupo por id.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id del grupo.

**Response:**

```json
{
  "id": "group01",
  "groupName": "Grupo Familia Perez",
  "titular": "user01"
}
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Grupo no encontrado.
- `500 Internal Server Error`: Error inesperado al obtener todos los grupos.

<br>
<br>

## 👨‍👩‍👧‍👦 Family-member

### 1. **POST** `/family-member`

- **Descripcion:** Asignar miembro a grupo familiar.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "name": "Federico",
  "lastname": "Perez",
  "dni": "52004245",
  "birthdate": "2022-04-28"
}
```

**Response:**

```json
{
  "id": "fm01",
  "name": "Federico",
  "lastname": "Perez",
  "dni": "52004245",
  "birthdate": "2022-04-28",
  "joinedAt": "",
  "group": {
    "id": "group01",
    "groupName": "Grupo Familia Perez",
    "titular": "user01"
  }
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos inválidos (validación de campos).
  - El usuario no es titular de un grupo.
- `401 Unauthorized`: Token invalido o inexistente.
- `409 Conflict`: Usuario ya existente (dni repetido).
- `500 Internal Server Error`:
  - Error inesperado al agregar un miembro al grupo.
  - Error inesperado al verificando si el usuario ya esta asociado a otro grupo familiar.
  - Error inesperado al al obtener grupo por id del titular

<br>
<br>

### 2. **DELETE** `/family-member/:id`

- **Descripcion:** Eliminar un miembro familiar.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id del miembro familiar.

**Results:**

```json
{
  "message": "Member deleted successfully",
  "id": "fm01"
}
```

**Errores esperados:**

- `400 Bad Request`: Solo el titular puede eliminar un miembro familiar.
- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Miembro familiar no encontrado.
- `500 Internal Server Error`: Error inesperado al eliminar un miembro familiar.

<br>
<br>

### 3. **GET** `/family-member`

- **Descripcion:** Obtener todos los miembros familiares.

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
[
  {
    "id": "fm01",
    "name": "Federico",
    "lastname": "Perez",
    "dni": "52004245",
    "birthdate": "2022-04-28",
    "joinedAt": "",
    "group": {
      "id": "group01",
      "groupName": "Grupo Familia Perez",
      "titular": "user01"
    }
  }
]
```

**Errores esperados:**

- `400 Bad Request`: El usuario no es titular de un grupo.
- `401 Unauthorized`: Token invalido o inexistente.
- `500 Internal Server Error`: Error inesperado al obtener todos los miembros familiares del usuario titular.

<br>
<br>

## 📃 Category

### 1. **POST** `/category`

- **Descripcion:** Crear una nueva categoria.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "name": "Septima"
}
```

**Response:**

```json
{
  "id": "cat01",
  "name": "Septima"
}
```

**Errores esperados:**

- `400 Bad Request`: Nombre de grupo ya existente.
- `500 Internal Server Error`: Error inesperado al crear una nueva categoria.

<br>
<br>

### 2. **GET** `/category`

- **Descripcion:** Obtener todas las categorias.

**Response:**

```json
[
  {
    "id": "cat01",
    "name": "Septima"
  }
]
```

`500 Internal Server Error`: Error inesperado al obtener todas las categorias.

<br>
<br>

### 3. **DELETE** `/category/:id`

- **Descripcion:** Eliminar una categoria.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id de la categoria.

**Response:**

```json
{
  "message": "category deleted successfully",
  "id": "cat01"
}
```

**Errores esperados:**

- `404 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Categoria no encontrada.
- `500 Internal Server Error`: Error inesperado al eliminar una categoria.

<br>
<br>

## 🏅 Discipline

### 1. **POST** `/discipline`

- **Descripcion:** Crear una nueva disciplina.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "name": "Futbol"
}
```

**Response:**

```json
{
  "id": "dis01",
  "name": "Futbol"
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos inválidos (validación de campos).
  - Nombre de disciplina existente.
- `401 Unauthorized`: Token invalido o inexistente.
- `500 Internal Server Error`: Error inesperado al crear una nueva disciplina.

<br>
<br>

### 2. **GET** `/discipline`

- **Descripcion:** Obtener todas las disciplinas.

**Response:**

```json
[
  {
    "id": "dis01",
    "name": "Futbol"
  }
]
```

**Errores esperados:**

- `500 Internal Server Error`: Error inesperado al obtener todas las disciplinas.

<br>
<br>

### 3. **DELETE** `/discipline/:id`

- **Descripcion:** Eliminar una disciplina.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id de la disciplina.

**Response:**

```json
{
  "message": "Discipline deleted successfully",
  "id": "dis01"
}
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Disciplina no encontrada.
- `500 Internal Server Error`: Error inesperado al eliminar una disciplina.

<br>
<br>

## 🎾 User-enrollment

### 1. **POST** `/user-enrollment`

- **Descripcion:** Inscribir un usuario en una disciplina.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "categoryId": "cat01",
  "disciplineId": "dis01"
}
```

**Response:**

```json
{
  "id": "ue01",
  "user": {
    "id": "user01",
    "name": "Tomas",
    "lastname": "Cardenas",
    "email": "tomas@gmail.com",
    "phone": null,
    "birthdate": "2014-07-15",
    "createdAt": "2025-07-10T19:15:30.646Z",
    "updatedAt": "2025-07-12T22:17:18.000Z",
    "deletedAt": null,
    "isAdmin": false,
    "dni": "49433649",
    "address": null,
    "cuit": null,
    "cbu": null,
    "membershipNumber": null,
    "isAutoDebit": false
  },
  "category": {
    "id": "cat01",
    "name": "Septima"
  },
  "discipline": {
    "id": "dis01",
    "name": "Futbol"
  },
  "isActive": true,
  "startAt": "2025-07-10T19:15:30.646Z"
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos inválidos (validación de campos).
  - Usuario ya inscripto.
- `401 Unathorized`: Token invalido o inexistente.
- `404 Not Found`:
  - Categoria no encontrada.
  - Disciplina no encontrada.
- `500 Internal Server Error`: Error inesperado al inscribir un usuario a una disciplina.

<br>
<br>

### 2. **GET** `/user-enrollment/user/:id`

- **Descripcion:** Mostrar todas las inscripciones por usuario.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id del usuario.

**Response:**

```json
[
  {
    "id": "ue01",
    "user": {
      "id": "user01",
      "name": "Tomas",
      "lastname": "Cardenas",
      "email": "tomas@gmail.com",
      "phone": null,
      "birthdate": "2014-07-15",
      "createdAt": "2025-07-10T19:15:30.646Z",
      "updatedAt": "2025-07-12T22:17:18.000Z",
      "deletedAt": null,
      "isAdmin": false,
      "dni": "49433649",
      "address": null,
      "cuit": null,
      "cbu": null,
      "membershipNumber": null,
      "isAutoDebit": false
    },
    "category": {
      "id": "cat01",
      "name": "Septima"
    },
    "discipline": {
      "id": "dis01",
      "name": "Futbol"
    },
    "isActive": true,
    "startAt": "2025-07-10T19:15:30.646Z"
  }
]
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Usuario no encontrado.
- `500 Internal Server Error`: Error inesperado al obtener todas las inscripciones por id de usuario.

<br>
<br>

### 3. **GET** `/user-enrollment/discipline/:id`

- **Descripcion:** Mostrar todas las inscripciones por disciplina

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id de la disciplina.

**Response:**

```json
[
  {
    "id": "ue01",
    "user": {
      "id": "user01",
      "name": "Tomas",
      "lastname": "Cardenas",
      "email": "tomas@gmail.com",
      "phone": null,
      "birthdate": "2014-07-15",
      "createdAt": "2025-07-10T19:15:30.646Z",
      "updatedAt": "2025-07-12T22:17:18.000Z",
      "deletedAt": null,
      "isAdmin": false,
      "dni": "49433649",
      "address": null,
      "cuit": null,
      "cbu": null,
      "membershipNumber": null,
      "isAutoDebit": false
    },
    "category": {
      "id": "cat01",
      "name": "Septima"
    },
    "discipline": {
      "id": "dis01",
      "name": "Futbol"
    },
    "isActive": true,
    "startAt": "2025-07-10T19:15:30.646Z"
  }
]
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`: Disciplina no encontrado.
- `500 Internal Server Error`: Error inesperado al obtener todas las inscripciones por id de disciplina.

<br>
<br>

### 4. **DELETE** `/user-enrollment/:id`

- **Descripcion:** Eliminar una inscripcion.

**Headers:**

- `Authorization: Bearer <access_token>`

**Params:**

- `id`: Id de la inscripcion.

**Response:**

```json
{
  "message": "Enrollment deleted successfully",
  "id": "ue01"
}
```

**Errores esperados:**

- `401 Unauthorized`:
  - Token invalido o inexistente.
  - La inscripcion solo puede ser eliminada por el titular.
- `404 Not Found`: Inscripcion no encontrada.
- `500 Internal Server Error`: Error inesperado al eliminar una inscripcion.

<br>
<br>

## 🪙 Payment-method

### 1. **POST** `/payment-method`

- **Descripcion:** Crear un metodo de pago

**Headers:**

- `Authorization: Bearer <access_token>`

**Body(JSON):**

```json
{
  "name": "cash"
}
```

**Response:**

```json
{
  "id": "pm01",
  "name": "cash"
}
```

**Errores esperados:**

- `400 Bad Request`: Datos invalidos.
- `401 Unauthorized`: Token invalido o inexistente.
- `409 Conflict`: El nombre ya existe.
- `500 Internal Server Error`:
  - Error inesperado al crear un metodo de pago.
  - Error inesperado al verificar si ya existe en la base de datos.

<br>
<br>

### 2. **GET** `/payment-method`

- **Descripcion:** Obtener todos los metodos de pagos

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
[
  {
    "id": "pm01",
    "name": "cash"
  },
  {
    "id": "pm02",
    "name": "transfer"
  }
]
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `500 Internal Server Error`: Error inesperado al obtener todos los metodos de pago disponibles.

<br>
<br>

## 💰 Fee-payment

### 1. **POST** `/fee-payment/member`

- **Descripcion:** Registrar pago de cuota mensual de un socio.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "user": "user01",
  "paymentMehthod": "pm01",
  "fee": [
    {
      "year": "2025",
      "months": ["Sep", "Oct", "Nov", "Dec"]
    },
    {
      "year": "2026",
      "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
    }
  ]
}
```

**Response:**

```json
{
  "id": "fp01",
  "type": "membership",
  "createdAt": "2025-07-09T19:15:30.646Z",
  "user": {
    "id": "user01",
    "name": "Tomas",
    "lastname": "Cardenas",
    "email": "tomas@gmail.com",
    "phone": null,
    "birthdate": "2014-07-15",
    "createdAt": "2025-07-10T19:15:30.646Z",
    "updatedAt": "2025-07-12T22:17:18.000Z",
    "deletedAt": null,
    "isAdmin": false,
    "dni": "49433649",
    "address": null,
    "cuit": null,
    "cbu": null,
    "membershipNumber": null,
    "isAutoDebit": false
  },
  "paymentMethod": {
    "id": "pm01",
    "name": "cash"
  },
  "enrollment": null
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos invalidos.
  - Pago existente.
- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`:
  - Usuario no encontrado.
  - Metodo de pago no encontrado.
- `500 Internal Server Error`:
  - Error inesperado al registrar el pago de la cuota.
  - Error inesperado al obtener el usuario.
  - Error inesperado al obtener el metodo de pago.

<br>
<br>

### 2. **POST** `/fee-payment/discipline`

- **Descripcion:** Registrar pago de cuota de disciplina.

**Headers:**

- `Authorization: Bearer <access_token>`

**Body (JSON):**

```json
{
  "user": "user01",
  "paymentMehthod": "pm02",
  "enrollment": "ue01",
  "fee": [
    {
      "year": "2025",
      "months": ["Sep", "Oct", "Nov", "Dec"]
    },
    {
      "year": "2026",
      "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
    }
  ]
}
```

**Response:**

```json
{
  "id": "fp01",
  "type": "discipline",
  "createdAt": "2025-07-09T19:15:30.646Z",
  "user": {
    "id": "user01",
    "name": "Tomas",
    "lastname": "Cardenas",
    "email": "tomas@gmail.com",
    "phone": null,
    "birthdate": "2014-07-15",
    "createdAt": "2025-07-10T19:15:30.646Z",
    "updatedAt": "2025-07-12T22:17:18.000Z",
    "deletedAt": null,
    "isAdmin": false,
    "dni": "49433649",
    "address": null,
    "cuit": null,
    "cbu": null,
    "membershipNumber": null,
    "isAutoDebit": false
  },
  "paymentMethod": {
    "id": "pm02",
    "name": "transfer"
  },
  "enrollment": {
    "id": "ue01",
    "user": {
      "id": "user01",
      "name": "Tomas",
      "lastname": "Cardenas",
      "email": "tomas@gmail.com",
      "phone": null,
      "birthdate": "2014-07-15",
      "createdAt": "2025-07-10T19:15:30.646Z",
      "updatedAt": "2025-07-12T22:17:18.000Z",
      "deletedAt": null,
      "isAdmin": false,
      "dni": "49433649",
      "address": null,
      "cuit": null,
      "cbu": null,
      "membershipNumber": null,
      "isAutoDebit": false
    },
    "category": {
      "id": "cat01",
      "name": "Septima"
    },
    "discipline": {
      "id": "dis01",
      "name": "Futbol"
    },
    "isActive": true,
    "startAt": "2025-07-10T19:15:30.646Z"
  }
}
```

**Errores esperados:**

- `400 Bad Request`:
  - Datos invalidos.
  - Pago existente.
- `401 Unauthorized`: Token invalido o inexistente.
- `404 Not Found`:
  - Usuario no encontrado.
  - Metodo de pago no encontrado.
  - Inscripcion no encontrada.
- `500 Internal Server Error`:
  - Error inesperado al registrar el pago de la cuota de la disciplina.
  - Error inesperado al obtener el usuario.
  - Error inesperado al obtener el metodo de pago.
  - Error inesperado al obtener la inscripcion.

<br>
<br>

## 💸 Payment-month

### 1. **GET** `/payment-month`

- **Descripcion:** Obtener historial de pagos del usuario activo.

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
[
  {
    "id": "paym01",
    "year": "2025",
    "month": "Jan",
    "paidAt": "2025-07-09T19:15:30.646Z",
    "isPaid": true,
    "feePayment": {
      "id": "fp01",
      "type": "discipline",
      "createdAt": "2025-07-09T19:15:30.646Z",
      "user": {
        "id": "user01",
        "name": "Tomas",
        "lastname": "Cardenas",
        "email": "tomas@gmail.com",
        "phone": null,
        "birthdate": "2014-07-15",
        "createdAt": "2025-07-10T19:15:30.646Z",
        "updatedAt": "2025-07-12T22:17:18.000Z",
        "deletedAt": null,
        "isAdmin": false,
        "dni": "49433649",
        "address": null,
        "cuit": null,
        "cbu": null,
        "membershipNumber": null,
        "isAutoDebit": false
      },
      "paymentMethod": {
        "id": "pm02",
        "name": "transfer"
      },
      "enrollment": {
        "id": "ue01",
        "user": {
          "id": "user01",
          "name": "Tomas",
          "lastname": "Cardenas",
          "email": "tomas@gmail.com",
          "phone": null,
          "birthdate": "2014-07-15",
          "createdAt": "2025-07-10T19:15:30.646Z",
          "updatedAt": "2025-07-12T22:17:18.000Z",
          "deletedAt": null,
          "isAdmin": false,
          "dni": "49433649",
          "address": null,
          "cuit": null,
          "cbu": null,
          "membershipNumber": null,
          "isAutoDebit": false
        },
        "category": {
          "id": "cat01",
          "name": "Septima"
        },
        "discipline": {
          "id": "dis01",
          "name": "Futbol"
        },
        "isActive": true,
        "startAt": "2025-07-10T19:15:30.646Z"
      }
    }
  }
]
```

**Errores esperados:**

- `401 Unauthorized`: Token invalido o inexistente.
- `500 Internal Server Error`: Error inesperado al cargar el pago mensual.
