# Changelog

## 4.0.0

### Changed
- Se agrego empaquetado con 'esbuild' para genera 'dist/artha.min.js'.
- Se unifico la compilación de assets JS y CSS desde 'npm run build'.
- Se exportaron nuevos modulos de componentes creados al paquete.
- Se agrego soporte para importar el paquete y sus estilos desde Laravel/Vite.
- 'artha-container' ahora sopporta 'name' y 'action_router'.
- 'artha-container' ahora expone 'renderMessage()' y emite el evento 'message-rendered'.
- 'artha-form' ahora detecta tambien elementos 'artha-select' y elementos '[selectable]' al cargar inputs.
- Se agrego carga dinamica de opciones 'select' usando 'action' y 'refresh-on'.
- Se agregaron clases globales de estado '.hidden', '.disabled' y '.enabled'.
- Se integraron iconos embebidos base64 para evitar dependencias externas de assets.

### Added
- Nuevo componente 'artha-field' para edición de campos.
- Nuevo componente 'artha-select' con soporte 'formAssociated', selección simple y multiple.
- Nuevo modulo 'SPA' para navegación simple basada en menu y contenido.
- Nuevos estilos para 'artha-field' y 'artha-select'.

### Fidex
- Se corrigio el flujo de compilación para que 'dev:css' genere 'dist/artha.min.css'.
- Se corrigio el manejo del token CSRF aceptando 'csrf-token', csrf_token' y '_token'.
- En 'XHR' ose envio '_token' y se evito sobreescribir '_method' cuando ya existe en los datos.
- Se corrigio el manejo de respuestas HTTP para que 'onData' procese tambien respuestas no 2xx y la capa superior resuelva el mensaje.
- Se evitaron errores al remover o volver a insertar 'loader_container' cuando no existe.
- Se corrigio el manejo de mensajes en 'artha-container', usando 'renderMessage()' tanto en exito como en error.
- Se removio un 'console.log' residual en 'artha-form'.
- Se normalizaron valores 'null' en formularios para evitar envios inconsistentes.
- Se evito que botones sin 'type' en 'artha-form' disparen submit accidentalmente.

## 3.0.3

### Fidex
- Error al empaquetar cambios de v3.0.2

## 3.0.2

### Changed
- Aceptar varias referecias de 'data-wire' en un 'artha-container'. Ejemplo data-wire="email,name:title"

## 3.0.1

### Fidex
- Públicar archivos .md

## 3.0.0

### Fidex
- Se remmovio el src de la paqueteria dejando unicamente el dist con todo empaquetado al instalar con npm

## 2.0.0

### Fixed
- Se corrigió que la clase TaskQueue no usaba el XHR.defaults.transformResponse al resolver la petición hecha por 'artha-form'.
- Se agregó en la clase TaskQueue generar status en la respuesta en caso de no exitir validada en base al código de respuesta del http.

## 1.4.0

### Fixed
- Códgio el error 'Operation is not supported' que aparecia en la consola del navegador al crear de forma automática el 'artha-loader' en un 'artha-container' anidado dentro de una template.
- En todos los componentes se modificó para separar la carga del constructor, connectedCallback y disconnectedCallback. Solucionando mensajes de error al anidar componentes entre si.
- Error al actualizar estilos un item de un 'artha-container' al hacer un setter de value desde js.

## 1.3.2

### Fixed
- Se corrigió error al cargar componente 'artha-loader' dentro de 'artha-container'

## 1.3.1

### Changed
- Se separo el manejo de arrays simples y arrays de objectos en artha-container.

### Fixed
- Se corrigió el render de contenedores anidados usando 'data-wire' con arrays de objetos.


## 1.3.0
- Se agregó `input-search` que se agrega en automático al usar el componente artha-container.
- Se implemento cancelación de búsquedas al continuar escribiendo o al pulsa el botón buscar en un artha-container con busqueda activada.
- Se implmento funcionalidad al atributo pagination en el componente artha-componente.
- A la clase BaseComponent se implemento un atributo reflect en el apuntador especial (_special_props) para indicar si se debe reflejar los valores en base a un attributo del elemento en el DOM.
