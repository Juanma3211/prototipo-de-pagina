# McDonald’s · Nos vemos en la mesa

Prototipo responsive creado con **HTML semántico, TypeScript y CSS**, sin frameworks de interfaz. Vite compila TypeScript y genera los archivos estáticos de producción.

## Ejecutar

Requiere Node.js 22.18+ o 24+ y pnpm. Alternativamente se puede usar npm.

```sh
pnpm install
pnpm dev
```

Abrí la URL que imprime Vite. No abras `index.html` directamente con `file://`: los navegadores necesitan el servidor para cargar TypeScript y módulos.

```sh
pnpm build    # Verificación estricta de tipos + compilación a dist/
pnpm preview  # Vista previa del build
pnpm test     # Pruebas de las reglas de reserva
```

Con npm: `npm install`, `npm run dev`, `npm run build`, `npm test`.

## Separación del proyecto

```text
dominio/
  modelos.ts           # Entidades y contrato del repositorio
  locales.ts           # Locales de ejemplo, mesas, horarios y fechas
  reservas.ts          # Disponibilidad, validación, creación y cancelación
interfaz/
  main.ts              # Eventos, filtros, navegación y flujo de reserva
  persistencia.ts      # Adaptador localStorage del repositorio
  estilos.css          # Diseño responsive y accesibilidad
public/
  imagenes/hero.png    # Imagen generada para este concepto
  favicon.svg
tests/
  reservas.test.ts     # Pruebas de reglas de negocio
index.html            # Estructura semántica de la página
```

El dominio no importa código de la interfaz, DOM ni localStorage. Recibe un `RepositorioReservas` y un reloj inyectable. La interfaz implementa ese contrato y utiliza el servicio del dominio.

## Funcionalidad

- Menú con filtros y detalles de productos ilustrativos.
- Selección de local, fecha y cantidad de personas.
- Disponibilidad calculada por mesa, con reservas de 90 minutos.
- Turnos cada 30 minutos, de 11:00 a 22:00, con al menos 30 minutos de anticipación y hasta 30 días a futuro.
- Grupos de 1 a 8 personas; asignación de la mesa de menor capacidad adecuada.
- Validación de datos y bloqueo de reservas superpuestas por correo.
- Revisión, confirmación con código, archivo de calendario `.ics`, historial y cancelación.
- Persistencia al recargar y actualización entre pestañas del mismo origen. Web Locks serializa las escrituras entre pestañas cuando está disponible.
- Formularios etiquetados, navegación por teclado, modales nativos y respeto de movimiento reducido.

## Alcance del prototipo

**No realiza reservas reales ni envía correos.** Los locales, cupos y horarios son de ejemplo. Los datos se guardan únicamente en este navegador y son visibles a quien use su mismo perfil. Usá datos ficticios. No hay autenticación, base de datos compartida ni sincronización entre dispositivos o entre la vista local y la versión publicada. Borrar el almacenamiento del sitio elimina sus reservas.

Para producción se necesita implementar un repositorio mediante una API, mover la asignación y validación de disponibilidad al servidor y utilizar transacciones de base de datos para evitar sobreventa entre usuarios. También se necesitan locales y horarios reales, autenticación, políticas de datos y el canal de confirmaciones que el negocio elija.

Fechas y horarios de reservas: `America/Montevideo` (UTC−03:00). Cada reserva ocupa 90 minutos, por lo que el último turno termina a las 23:30 en estos datos de ejemplo.

## Identidad e imágenes

Concepto independiente no oficial. McDonald’s y sus marcas pertenecen a sus respectivos titulares. No se presentan precios ni promociones comerciales ficticias.

Imagen de portada guardada en `public/imagenes/hero.png`, generada con la herramienta integrada ImageGen. Prompt: “Premium photorealistic studio food photograph of a Big Mac style double beef cheeseburger with three layers of sesame bun, lettuce, pickles, sauce and melted cheese, foreground left, with golden French fries in a red McDonald’s carton with yellow arches behind right. Transparent background, warm advertising lighting, complete products visible, no other text or watermark.” Se utiliza como representación ilustrativa, no como fotografía oficial.

Tipografías: Manrope y DM Sans, cargadas desde Google Fonts con alternativas locales Arial/sans-serif. El sitio sigue funcionando sin conexión a Google Fonts.

Referencia para la descripción del Big Mac: https://www.mcdonalds.com/us/en-us/product/big-mac.html. La formulación puede variar por mercado; el prototipo no proporciona información nutricional ni de alérgenos.
