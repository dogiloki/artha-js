# Artha JS

Mini libreria para construir interfaces HTML reactivas con Web Components, peticiones XHR, cola de tareas y mensajes visuales sin depender de frameworks.

Artha JS esta pensada para:

- enviar formularios por XHR
- renderizar listas y bloques desde respuestas JSON
- mostrar loaders y mensajes de estado
- buscar con debounce sobre contenedores remotos
- coordinar eventos globales entre componentes
- integrarse facil con Laravel y Vite

## Contenido

- [Que incluye](#que-incluye)
- [Instalacion](#instalacion)
- [Uso con Laravel](#uso-con-laravel)
- [Inicio rapido](#inicio-rapido)
- [Exportaciones](#exportaciones)
- [Componentes](#componentes)
- [Core](#core)
- [Flujo de respuesta esperado](#flujo-de-respuesta-esperado)
- [Eventos utiles](#eventos-utiles)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

## Que incluye

La libreria exporta:

- `DataHelper`
- `DOMHelper`
- `FormatHelper`
- `FormHelper`
- `NumberHelper`
- `StringHelper`
- `EventBus`
- `TaskQueue`
- `XHR`
- `SPA`
- `ArthaMessage`
- `ArthaLoader`
- `ArthaContainer`
- `ArthaForm`
- `ArthaField`
- `ArthaSelect`
- `InputSearch`

Al importar el paquete principal se registran automaticamente estos custom elements:

- `artha-container`
- `artha-form`
- `artha-message`
- `artha-loader`
- `input-search`
- `artha-field`
- `artha-select`

## Instalacion

### Desde npm

```bash
npm install @dogiloki/artha-js
```

### Importar el paquete

```js
import "@dogiloki/artha-js";
```

### Importar estilos

Desde JavaScript:

```js
import "@dogiloki/artha-js/style";
```

Desde tu archivo CSS o SCSS:

```scss
@import "@dogiloki/artha-js/dist/artha.min.css";
```

Tambien puedes importar modulos puntuales:

```js
import { EventBus, XHR, ArthaSelect } from "@dogiloki/artha-js";
```

## Uso con Laravel

En `resources/js/app.js`:

```js
import "@dogiloki/artha-js";
import "@dogiloki/artha-js/style";
```

Si quieres personalizar la forma en que se interpreta la respuesta del backend:

```js
import "@dogiloki/artha-js";
import "@dogiloki/artha-js/style";
import { EventBus, XHR } from "@dogiloki/artha-js";

EventBus.on("artha:before-register", () => {
  XHR.defaults.transformResponse = (xhr) => ({
    status: xhr.status >= 200 && xhr.status < 300 ? "success" : "error",
    message: xhr.response?.message ?? null,
    errors: xhr.response?.errors ?? null,
    data: xhr.response?.data ?? xhr.response
  });
});
```

Y en tu Blade:

```php
@vite(['resources/js/app.js'])
```

## Inicio rapido

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
    template="user-template"
    searcher
    pagination="10">
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
  DataHelper,
  DOMHelper,
  FormatHelper,
  FormHelper,
  NumberHelper,
  StringHelper,
  EventBus,
  TaskQueue,
  XHR,
  SPA,
  ArthaMessage,
  ArthaLoader,
  ArthaContainer,
  ArthaForm,
  ArthaField,
  ArthaSelect,
  InputSearch
} from "@dogiloki/artha-js";
```

Al cargar el modulo tambien se emiten:

- `artha:before-register`
- `artha:after-register`

## Componentes

### `artha-message`

Componente para mostrar mensajes visuales.

Tipos soportados:

- `info`
- `success`
- `warning`
- `error`

API publica:

- `show(message, type)`
- `info(message)`
- `success(message)`
- `warning(message)`
- `error(message)`
- `hidden()`

### `artha-loader`

Loader visual para estados de carga.

Atributos:

- `type`: tipo de loader. Default `ring`
- `text`: texto mostrado debajo del loader

Tipos disponibles:

- `ring`
- `dots`
- `bar`
- `wave`

### `artha-form`

Formulario asincrono basado en `XMLHttpRequest`.

Comportamiento:

- intercepta `submit`
- valida con `checkValidity()`
- envia datos por XHR
- muestra mensajes con `artha-message`
- rellena campos automaticamente si la respuesta trae `data`
- soporta `select`, `artha-select` y elementos `[selectable]`

Atributos utiles:

- `action`
- `method`
- `response-type`
- `disable-submit`
- `message-target`
- `id`

API publica:

- `submit()`
- `reset(resetMessage = true)`
- `resetMessage()`
- `checkValidity()`
- `loadInputs(selector = "input,select,textarea,artha-select,[selectable]")`
- `loadInputsSelect(element, data = null)`
- `fillFromJson(json, reset = true)`
- `getValue(name)`
- `input(name)`

Eventos emitidos:

- `load`
- `resolve`
- `component-ready`

#### Selects dinamicos dentro de `artha-form`

Si un `select` tiene atributo `action`, Artha cargara sus opciones de forma remota:

```html
<artha-form action="/users" method="POST">
  <select name="organism_id" action="/api/organisms"></select>
</artha-form>
```

Si ademas defines `refresh-on`, el select se recargara cuando ese evento global ocurra:

```html
<select
  name="organism_id"
  action="/api/organisms"
  refresh-on="organisms:reload">
</select>
```

### `artha-container`

Componente para cargar, renderizar y refrescar datos remotos.

Casos de uso:

- listados
- tarjetas
- tablas simples
- contenedores anidados
- seleccion simple o multiple
- busqueda con `input-search`
- paginacion
- refresco via `EventBus`

Atributos utiles:

- `action`
- `action_router`
- `method`
- `name`
- `page`
- `search`
- `response-type`
- `template`
- `pagination`
- `message`
- `message-target`
- `searcher`
- `selectable`
- `multiple`
- `refresh-on`
- `id`

API publica:

- `hasAction()`
- `hasPagination()`
- `router(id)`
- `refresh(search = null)`
- `refreshWithData(data)`
- `render(results, refresh = false, refreshChildren = true)`
- `renderItem(data, refreshChildren = true, update = null)`
- `renderMessage(message, status = "info")`
- `nextPage()`
- `prevPage()`
- `goToPage(page)`
- `resetPagination(refresh = false)`
- `reset()`
- `selection()`
- propiedad `value`

Eventos emitidos:

- `load`
- `resolve`
- `dynamic-content-loaded`
- `item-rendered`
- `item-selected`
- `item-deselected`
- `message-rendered`
- `component-ready`

#### `data-wire`

El renderizado se basa en atributos `data-wire` dentro de la plantilla.

Formatos soportados:

```html
data-wire="ruta"
data-wire="ruta:atributo"
data-wire="ruta:atributo:append"
data-wire="ruta:boolean"
data-wire="ruta:boolean:chooser"
```

Tambien puedes usar multiples wires separados por coma:

```html
<span data-wire="email,name:title"></span>
```

Ejemplos:

```html
<span data-wire="name"></span>
<span data-wire="user.email"></span>
<span data-wire="price:textContent:append">$ </span>
<span data-wire="active:boolean"></span>
```

Chooser:

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

Arreglos simples:

```html
<ul data-wire="tags[]">
  <li>
    <span fillable></span>
  </li>
</ul>
```

### `artha-select`

Componente de seleccion custom con soporte de formularios nativos.

Caracteristicas:

- soporte `formAssociated`
- seleccion simple o multiple
- `required`, `readonly` y `disabled`
- carga remota de opciones mediante `action`
- eventos `input` y `change`

Atributos utiles:

- `name`
- `action`
- `method`
- `multiple`
- `required`
- `readonly`
- `disabled`

API publica:

- propiedad `value`
- `selection()`
- `isSelect(option)`
- `select(option, emit = true)`
- `deselect(option, emit = true)`
- `reset(emit = true)`
- `checkValidity()`
- `reportValidity()`
- `setCustomValidity(message)`
- `render(data = null)`

Eventos emitidos:

- `select`
- `deselect`
- `reset`
- `input`
- `change`

Ejemplo simple:

```html
<artha-select name="role_id">
  <option value="1">Admin</option>
  <option value="2">Editor</option>
</artha-select>
```

Ejemplo remoto:

```html
<artha-select
  name="organism_id"
  action="/api/organisms"
  multiple>
</artha-select>
```

### `artha-field`

Componente para edicion inline de un campo usando la logica de `artha-form`.

Permite:

- mostrar un valor visible
- alternar entre lectura y edicion
- guardar por XHR
- cancelar cambios locales

Ejemplo:

```html
<artha-field action="/users/1" method="PUT">
  <span field-value="name"></span>
  <input type="text" name="name" class="hidden" value="Ana">
</artha-field>
```

### `input-search`

Componente de busqueda con debounce pensado para integrarse con `artha-container`.

Atributos:

- `delay`: default `300`
- `text`: placeholder del input

API publica:

- `search()`

Eventos emitidos:

- `search`
- `cancel-search`

## Core

### `XHR`

Wrapper de `XMLHttpRequest` con callbacks y opciones centralizadas.

Uso basico:

```js
import { XHR } from "@dogiloki/artha-js";

XHR.request({
  url: "/api/users",
  method: "GET",
  headers: {
    Accept: "application/json"
  },
  onData: (xhr, data) => {
    console.log(data);
  }
});
```

Opciones utiles:

- `method`
- `url`
- `uri`
- `headers`
- `data`
- `query`
- `files`
- `response_type`
- `with_credentials`
- `timeout`
- `retry`
- `retry_delay`
- `transformResponse(xhr)`
- `onLoad(xhr)`
- `onData(xhr, transformed)`
- `onError(transformed)`
- `onTimeout(transformed)`
- `onProgress(event, loaded, total)`
- `onAbort(transformed)`
- `onAction(xhr)`

Notas de comportamiento:

- acepta meta tags `csrf-token`, `csrf_token` y `_token`
- envia el token como header `X-CSRF-Token`
- para metodos distintos de `GET`, envia `FormData`
- agrega `_token` al cuerpo cuando existe
- agrega `_method` si no fue enviado manualmente

### `TaskQueue`

Evita ejecutar dos tareas con el mismo id al mismo tiempo y centraliza estados.

Uso basico:

```js
import { TaskQueue } from "@dogiloki/artha-js";

const queue = TaskQueue.singleton();
```

Defaults:

```js
TaskQueue.defaults = {
  title: "Peticion en proceso...",
  close: false,
  message: null
};
```

### `EventBus`

Bus global basado en `EventTarget`.

Uso:

```js
import { EventBus } from "@dogiloki/artha-js";

const unsubscribe = EventBus.on("users:reload", (data) => {
  console.log(data);
});

EventBus.emit("users:reload", { source: "manual" });
unsubscribe();
```

API publica:

- `EventBus.emit(name, data)`
- `EventBus.emitAsync(name, data)`
- `EventBus.on(name, callback)`
- `EventBus.once(name, callback)`
- `EventBus.onAny(callback)`
- `EventBus.off(name, callback)`
- `EventBus.clean(name)`
- `EventBus.clearAll()`

### `SPA`

Utilidad ligera para navegacion por secciones usando un menu y un contenedor.

Funcionamiento:

- busca elementos con atributo `key` dentro del menu
- busca contenidos con el mismo `key`
- oculta todos los contenidos
- activa el contenido correspondiente al hacer click

Ejemplo:

```js
import { SPA } from "@dogiloki/artha-js";

new SPA({
  menu: document.getElementById("menu"),
  content: document.getElementById("content")
});
```

### Helpers

Helpers exportados:

- `DataHelper`
- `DOMHelper`
- `FormatHelper`
- `FormHelper`
- `NumberHelper`
- `StringHelper`

## Flujo de respuesta esperado

Artha funciona mejor cuando el backend responde con una estructura como esta:

```json
{
  "status": "success",
  "message": "Operacion completada",
  "data": []
}
```

Para errores:

```json
{
  "status": "error",
  "message": "No se pudo completar la operacion",
  "errors": {
    "email": ["El correo ya existe"]
  }
}
```

Si tu API responde distinto, puedes normalizarla con `XHR.defaults.transformResponse`.

## Eventos utiles

Eventos de componentes:

- `component-ready`
- `load`
- `resolve`
- `dynamic-content-loaded`
- `item-rendered`
- `item-selected`
- `item-deselected`
- `message-rendered`
- `search`
- `cancel-search`
- `select`
- `deselect`
- `change`
- `input`

Eventos globales:

- `artha:before-register`
- `artha:after-register`

Ejemplo de refresco:

```js
import { EventBus } from "@dogiloki/artha-js";

EventBus.emit("users:updated", { id: 3, name: "Nuevo nombre" });
EventBus.emit("users:reload");
```

```html
<artha-container
  action="/api/users"
  template="user-template"
  refresh-on="users:reload,users:updated">
</artha-container>
```

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Modo desarrollo:

```bash
npm run dev
```

Scripts disponibles:

- `npm run dev:css`
- `npm run dev:js`
- `npm run dev:server`
- `npm run build`
- `npm run build:css`
- `npm run build:js`
- `npm run build:debug`
- `npm run build:debug:css`
- `npm run build:debug:js`

Build de produccion:

```bash
npm run build
```

Esto genera:

- `dist/artha.min.css`
- `dist/artha.min.js`

Build de depuracion:

```bash
npm run build:debug
```

Esto genera:

- `dist/artha.css`
- `dist/artha.js`

## Licencia

MIT. Consulta [`LICENSE`](./LICENSE).
