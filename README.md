# Artha JS

Mini librería para construir interfaces HTML reactivas con Web Components, peticiones XHR, cola de tareas y mensajes visuales sin depender de frameworks.

`Artha JS` expone un conjunto pequeño de utilidades y componentes personalizados pensados para:

- enviar formularios por XMLHttpRequest
- renderizar listas o bloques desde respuestas JSON
- mostrar loaders y mensajes de estado
- coordinar eventos globales entre componentes

## Contenido

- [¿Qué incluye?](#que-incluye)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Exportaciones](#exportaciones)
- [Componentes](#componentes)
- [Core](#core)
- [Flujo de respuesta esperado](#flujo-de-respuesta-esperado)
- [Eventos útiles](#eventos-útiles)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

## ¿Qué incluye?

La librería exporta estas piezas:

- `Util`: helpers de DOM, formato y utilidades generales
- `EventBus`: bus global de eventos
- `TaskQueue`: cola simple para evitar tareas duplicadas y coordinar estados
- `XHR`: wrapper ligero sobre `XMLHttpRequest`
- `ArthaMessage`: componente para mostrar mensajes de estado
- `ArthaLoader`: componente visual de carga
- `ArthaContainer`: componente para cargar y renderizar datos
- `ArthaForm`: formulario con envío asíncrono

Al importar `dist/artha.min.js`, la librería registra automáticamente estos custom elements:

- `artha-container`
- `artha-form`
- `artha-message`
- `artha-loader`

## Instalación

### Desde npm

```bash
npm install @dogiloki/artha-js
```

### Importando el bundle

```js
import {
  XHR,
  EventBus,
  TaskQueue,
  Util,
  ArthaForm,
  ArthaContainer,
  ArthaMessage,
  ArthaLoader
} from "@dogiloki/artha-js/dist/artha.min.js";
```

### Importando estilos

Si tu bundler soporta CSS desde dependencias:

```js
import "@dogiloki/artha-js/dist/artha.min.css";
```

O bien desde HTML:

```html
<link rel="stylesheet" href="./node_modules/@dogiloki/artha-js/dist/artha.min.css">
```

## Inicio rápido

Ejemplo mínimo con un formulario y un contenedor que carga datos remotos:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="csrf-token" content="TOKEN_OPCIONAL">
  <link rel="stylesheet" href="./dist/artha.min.css">
</head>
<body>
  <artha-form
    id="user-form"
    action="/api/user"
    method="POST">
    <input type="text" name="name" placeholder="Nombre">
    <input type="email" name="email" placeholder="Correo">
    <button type="submit">Guardar</button>
  </artha-form>

  <artha-container
    id="users"
    action="/api/users"
    method="GET"
    template="user-template">
  </artha-container>

  <template id="user-template">
    <article>
      <h3 data-wire="name"></h3>
      <p data-wire="email"></p>
      <small data-wire="id"></small>
    </article>
  </template>

  <script type="module">
    import "./dist/artha.min.js";
  </script>
</body>
</html>
```

## Exportaciones

```js
import {
  Util,
  EventBus,
  TaskQueue,
  XHR,
  ArthaMessage,
  ArthaLoader,
  ArthaContainer,
  ArthaForm
} from "./dist/artha.min.js";
```

Al cargar el módulo también se emiten dos eventos globales:

- `artha:before-register`
- `artha:after-register`

Esto sirve, por ejemplo, para personalizar la transformación de respuestas antes de registrar los componentes:

```js
import { EventBus, XHR } from "./dist/artha.min.js";

EventBus.on("artha:before-register", () => {
  XHR.defaults.transformResponse = (xhr) => ({
    data: xhr.response,
    message: null,
    errors: null,
    status: "success"
  });
});
```

## Componentes

### `artha-message`

Componente para mostrar mensajes visuales.

### Tipos soportados

- `info`
- `success`
- `warning`
- `error`

### Ejemplo

```html
<artha-message id="feedback"></artha-message>
```

```js
const message = document.getElementById("feedback");

message.info("Cargando información...");
message.success("Guardado correctamente");
message.warning("Faltan campos por revisar");
message.error("Ocurrió un error");
message.hidden();
```

### API pública

- `show(message, type)`
- `info(message)`
- `success(message)`
- `warning(message)`
- `error(message)`
- `hidden()`

### `artha-loader`

Loader visual para estados de carga.

### Atributos

- `type`: tipo de loader. Default: `ring`
- `text`: texto mostrado debajo del loader. Default: `Petición en proceso...`

### Tipos disponibles

- `ring`
- `dots`
- `bar`
- `wave`

Nota: en la implementación actual `bar` y `wave` reutilizan la misma clase visual que `dots`.

### Ejemplo

```html
<artha-loader type="ring" text="Cargando usuarios"></artha-loader>
<artha-loader type="dots" text="Procesando"></artha-loader>
```

### `artha-form`

Formulario asíncrono basado en `XMLHttpRequest`.

### Comportamiento

- intercepta el evento `submit`
- valida los campos con `checkValidity()`
- envía los datos por XHR
- muestra mensajes con `artha-message`
- rellena campos automáticamente si la respuesta trae `data`

### Atributos útiles

- `action`: endpoint del formulario
- `method`: método HTTP
- `response-type`: tipo de respuesta del XHR. Default: `json`
- `disable-submit`: impide el envío automático al presionar Enter
- `message-target`: selector interno para localizar el mensaje asociado
- `id`: usado para identificar la tarea en `TaskQueue`

### Ejemplo

```html
<artha-form id="profile-form" action="/api/profile" method="POST">
  <artha-message></artha-message>
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <label>
    <input type="checkbox" name="active">
    Activo
  </label>
  <button type="submit">Guardar</button>
  <button type="reset">Limpiar</button>
</artha-form>
```

### API pública

- `submit()`
- `reset(resetMessage = true)`
- `resetMessage()`
- `checkValidity()`
- `loadInputs(selector = "input,select,textarea")`
- `fillFromJson(json, reset = true)`
- `getValue(name)`
- `input(name)`

### Eventos emitidos

- `load`: se dispara cuando XHR termina de cargar
- `resolve`: se dispara cuando la respuesta fue aceptada y procesada
- `component-ready`: heredado de `BaseComponent`

### `artha-container`

Componente para cargar, renderizar y refrescar datos remotos, o actualizar vistas existentes.

### Casos de uso

- listados
- tarjetas
- tablas simples
- bloques con plantillas HTML
- selección simple o múltiple
- refresco desde eventos globales

### Atributos útiles

- `action`: endpoint a consultar
- `method`: método HTTP. Default: `GET`
- `template`: id de un `<template>` o referencia configurada en el componente
- `pagination`: valor configurado pero no aplicado directamente en la clase actual. Default: `10`
- `message`: referencia al mensaje asociado
- `message-target`: selector interno alternativo para localizar un `artha-message`
- `searcher`: activa el comportamiento de búsqueda si existe un `input-search`
- `selectable`: permite seleccionar items
- `multiple`: permite múltiples selecciones
- `refresh-on`: nombres de eventos del `EventBus`, separados por coma
- `id`: identificador del contenedor

### Ejemplo con plantilla

```html
<artha-container
  id="users"
  action="/api/users"
  method="GET"
  template="user-card"
  selectable
  multiple
  refresh-on="users:reload,users:updated">
  <artha-message></artha-message>
</artha-container>

<template id="user-card">
  <article class="user-card">
    <h3 data-wire="name"></h3>
    <p data-wire="email"></p>
    <span data-wire="active:boolean"></span>
  </article>
</template>
```

### API pública

- `refresh(search = null)`: vuelve a pedir los datos remotos
- `refreshWithData(data)`: actualiza un item ya renderizado por `data.id`
- `render(results, refresh = false, refreshChildren = true)`
- `renderItem(data, refreshChildren = true, update = null)`
- `reset()`: limpia la selección
- `selection()`: devuelve el store de selección
- propiedad `value`: ids seleccionados

### Selección

Si `selectable` está activo:

- `container.value` devuelve el id seleccionado
- si también `multiple` está activo, devuelve un arreglo de ids
- `reset()` limpia la selección actual

### Eventos emitidos

- `load`
- `resolve`
- `dynamic-content-loaded`
- `item-rendered`
- `item-selected`
- `item-deselected`
- `component-ready`

### Sistema `data-wire`

El renderizado se basa en atributos `data-wire` dentro de la plantilla.

Formato general:

```html
data-wire="ruta"
data-wire="ruta:atributo"
data-wire="ruta:atributo:append"
data-wire="ruta:boolean"
data-wire="ruta:boolean:chooser"
```

### Ejemplos de `data-wire`

Texto simple:

```html
<span data-wire="name"></span>
```

Propiedad anidada:

```html
<span data-wire="user.email"></span>
```

Append sobre contenido actual:

```html
<span data-wire="price:textContent:append">$ </span>
```

Booleano como check o cross:

```html
<span data-wire="active:boolean"></span>
```

Booleano con selección por plantilla:

```html
<div data-wire="status:boolean:chooser">
  <template data-chooser-value="approved">
    <span>Aprobado</span>
  </template>
  <template data-chooser-value="rejected">
    <span>Rechazado</span>
  </template>
  <template data-chooser-default>
    <span>Pendiente</span>
  </template>
</div>
```

### Renderizado de arreglos

El componente soporta rutas terminadas en `[]` para iterar datos. Internamente, busca elementos marcados con `fillable` o `iterable`.

Ejemplo conceptual:

```html
<ul data-wire="tags[]">
  <li>
    <span fillable></span>
  </li>
</ul>
```

Nota: el flujo más sólido en la implementación actual es renderizar texto, booleanos y arreglos. Si quieres usar mapeos más avanzados, conviene probarlos primero en tu caso concreto.

## Core

### `XHR`

Wrapper de `XMLHttpRequest` con callbacks y opciones centralizadas.

### Uso básico

```js
import { XHR } from "./dist/artha.min.js";

XHR.request({
  url: "/api/users",
  method: "GET",
  headers: {
    Accept: "application/json"
  },
  onData: (xhr, data) => {
    console.log("ok", data);
  },
  onError: (error) => {
    console.error("error", error);
  }
});
```

### Opciones disponibles

- `method`: default `GET`
- `url`: URL final
- `uri`: alternativa para construir `"/" + uri"`
- `headers`: headers adicionales
- `data`: datos del formulario
- `query`: query params para GET
- `files`: archivos o listas de archivos
- `response_type`: default `json`
- `with_credentials`: default `false`
- `timeout`: default `0`
- `retry`: reintenta en `error` o `timeout`
- `retry_delay`: default `5000`
- `transformResponse(xhr)`: transforma `xhr.response`
- `onLoad(xhr)`
- `onData(xhr, transformed)`
- `onError(transformed)`
- `onTimeout(transformed)`
- `onProgress(event, loaded, total)`
- `onAbort(transformed)`
- `onAction(xhr)`

### Notas de comportamiento

- si existe `<meta name="csrf-token">` o `<meta name="csrf_token">`, se envía como header `X-CSRF-Token`
- para métodos distintos de `GET`, la librería envía `FormData`
- también agrega `_method` dentro del `FormData`
- si hay token CSRF, también agrega `csrf_token` al cuerpo

### `TaskQueue`

Evita ejecutar dos tareas con el mismo id al mismo tiempo y centraliza el cierre de estados.

### Uso básico

```js
import { TaskQueue } from "./dist/artha.min.js";

const queue = TaskQueue.singleton();

queue.loadTask("save-user", "Guardando usuario...", (task) => {
  setTimeout(() => {
    task.resolve({
      status: 200,
      response: JSON.stringify({
        status: "success",
        message: "Usuario guardado",
        data: { id: 1 }
      })
    });
  }, 500);
}, {
  close: true
});
```

### Defaults

```js
TaskQueue.defaults = {
  title: "Petición en proceso...",
  close: false,
  message: null
};
```

### Observaciones

- cada tarea necesita un id único
- si se repite el id mientras sigue activa, se cancela la nueva tarea
- si se pasa un `ArthaMessage`, la cola actualiza sus estados visuales
- `close: true` intenta cerrar el mensaje automáticamente al finalizar

### `EventBus`

Bus global basado en `EventTarget`.

### Uso

```js
import { EventBus } from "./dist/artha.min.js";

const unsubscribe = EventBus.on("users:reload", (data) => {
  console.log("recargar", data);
});

EventBus.emit("users:reload", { source: "manual" });
EventBus.emitAsync("users:reload", { source: "async" });
unsubscribe();
```

### API pública

- `EventBus.emit(name, data)`
- `EventBus.emitAsync(name, data)`
- `EventBus.on(name, callback)`
- `EventBus.once(name, callback)`
- `EventBus.onAny(callback)`
- `EventBus.off(name, callback)`
- `EventBus.clean(name)`
- `EventBus.clearAll()`

### Debug

```js
EventBus.debug = true;
```

### `Util`

Utilidades generales.

### API pública

- `Util.getMeta(name)`
- `Util.getValueByPath(obj, path, defaultValue = null)`
- `Util.modal(element, visible = -1)`
- `Util.modalById(id, visible = -1)`
- `Util.formatMoney(value, options = {})`
- `Util.numberRandom(min, max)`
- `Util.withinRange(value, min, max)`
- `Util.createElement(type, value = null, options = {})`

### Ejemplos

```js
Util.getMeta("csrf-token");
Util.getValueByPath({ user: { name: "Ana" } }, "user.name");
Util.modalById("panel", true);
Util.formatMoney("1234.5");
Util.numberRandom(1, 10);
Util.withinRange(204, 200, 299);
```

## Flujo de respuesta esperado

`ArthaForm` y `ArthaContainer` funcionan mejor cuando el backend responde con una estructura parecida a esta:

```json
{
  "status": "success",
  "message": "Operación completada",
  "data": []
}
```

También soporta errores con este formato:

```json
{
  "status": "error",
  "message": "No se pudo completar la operación",
  "errors": {
    "email": ["El correo ya existe"]
  }
}
```

Si tu API responde con otro formato, puedes adaptar la salida usando `XHR.defaults.transformResponse`.

## Eventos útiles

### Eventos de componentes

- `component-ready`
- `load`
- `resolve`
- `dynamic-content-loaded`
- `item-rendered`
- `item-selected`
- `item-deselected`

### Eventos globales de Artha

- `artha:before-register`
- `artha:after-register`

### Ejemplo de refresco entre componentes

```js
import { EventBus } from "./dist/artha.min.js";

EventBus.emit("users:updated", { id: 3, name: "Nuevo nombre" });
EventBus.emit("users:reload");
```

Y en el contenedor:

```html
<artha-container
  action="/api/users"
  template="user-template"
  refresh-on="users:reload,users:updated">
</artha-container>
```

## Desarrollo

### Instalar dependencias

```bash
npm install
```

### Desarrollo

Compilar CSS en modo watch:

```bash
npm run dev:css
```

Levantar servidor local:

```bash
npm run dev:server
```

Ejecutar ambos:

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Licencia

MIT. Consulta [`LICENSE`](./LICENSE).
