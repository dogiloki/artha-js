# Changelog

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
