import { fechaMaxima, fechaUruguay, instante, locales } from '../dominio/locales.ts';
import type { Reserva, SolicitudReserva } from '../dominio/modelos.ts';
import { ServicioReservas } from '../dominio/reservas.ts';
import { RepositorioLocal } from './persistencia.ts';

const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}`);
  return element;
};
const icon = (nombre: string) => `<svg class="icon" aria-hidden="true"><use href="#i-${nombre}"/></svg>`;
const escapar = (valor: string) => valor.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const fechaTexto = (fecha: string) => new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'long', timeZone: 'America/Montevideo' }).format(new Date(`${fecha}T12:00:00-03:00`));
const localNombre = (id: string) => locales.find(local => local.id === id)?.nombre ?? 'Local';
const servicio = new ServicioReservas(new RepositorioLocal());
const bookingDialog = $<HTMLDialogElement>('#booking-dialog');
const infoDialog = $<HTMLDialogElement>('#info-dialog');
const bookingContent = $('#booking-content');
const infoContent = $('#info-content');
const quickDate = $<HTMLInputElement>('#quick-date');
const quickLocal = $<HTMLSelectElement>('#quick-local');
const quickGuests = $<HTMLSelectElement>('#quick-guests');
let paso = 1;
let guardando = false;
let viendoReservas = false;
let borrador: SolicitudReserva = { localId: 'centro', fecha: fechaUruguay(), hora: '', personas: 2, nombre: '', email: '', telefono: '', notas: '' };

quickLocal.innerHTML = locales.map(local => `<option value="${local.id}">${local.nombre}</option>`).join('');
quickDate.min = fechaUruguay();
quickDate.max = fechaMaxima();
quickDate.value = fechaUruguay(new Date(Date.now() + 86400_000));

const productos = [
  { id: 'big-mac', nombre: 'Big Mac®', categoria: 'hamburguesas', etiqueta: 'EL CLÁSICO', descripcion: 'Hay sabores que no necesitan presentación.', detalle: 'El clásico de dos carnes, pan con sésamo, queso, lechuga, pepinillos, cebolla y salsa especial. Una inspiración para tu próximo encuentro.', clase: 'crop-burger' },
  { id: 'papas', nombre: 'Papas McDonald’s', categoria: 'acompanamientos', etiqueta: 'PARA COMPARTIR… O NO', descripcion: 'Doradas, crujientes y siempre bienvenidas.', detalle: 'Ese acompañamiento que transforma cualquier encuentro en un buen plan. La imagen es una representación ilustrativa; consultá los tamaños y la disponibilidad en el local.', clase: 'crop-fries' },
  { id: 'combo', nombre: 'Un dúo que encanta', categoria: 'combos', etiqueta: 'JUNTOS, MEJOR', descripcion: 'Tu hamburguesa y sus mejores compañeras.', detalle: 'Una hamburguesa con papas: una combinación para disfrutar en buena compañía. Esta presentación es ilustrativa y no representa una oferta o un combo comercial vigente.', clase: '' },
];

function mostrarProductos(categoria = 'todos') {
  $('#product-grid').innerHTML = productos.filter(p => categoria === 'todos' || p.categoria === categoria).map(p => `<article class="product-card"><div class="product-visual"><span class="product-tag">${p.etiqueta}</span><img src="/imagenes/hero.png" class="product-picture ${p.clase}" alt="${p.nombre}, representación ilustrativa" loading="lazy" width="500" height="500"></div><div class="product-content"><h3>${p.nombre}</h3><p>${p.descripcion}</p><button class="round-arrow" data-product="${p.id}" aria-label="Conocer ${p.nombre}">${icon('arrow')}</button></div></article>`).join('');
}

mostrarProductos();
document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-category]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  button.classList.add('active'); button.setAttribute('aria-pressed', 'true');
  mostrarProductos(button.dataset.category);
}));

$('#product-grid').addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-product]');
  const producto = productos.find(p => p.id === button?.dataset.product);
  if (!producto) return;
  viendoReservas = false;
  infoContent.innerHTML = cabecera(producto.nombre, 'UN FAVORITO PARA TU PLAN', 'info') + `<div class="modal-body"><div class="detail-image"><img src="/imagenes/hero.png" alt="Hamburguesa y papas, imagen ilustrativa"></div><p class="modal-intro">${producto.detalle}</p><p class="notice">Menú ilustrativo. La disponibilidad, los ingredientes y los alérgenos pueden variar. Consultá la información vigente del restaurante.</p><button class="button button-yellow" id="product-reserve">Reservar una mesa ${icon('arrow')}</button></div>`;
  infoDialog.showModal();
  $('#product-reserve').addEventListener('click', () => { infoDialog.close(); irAReserva(); });
});

$('#locations-grid').innerHTML = locales.map(local => `<article class="location-card"><div class="location-icon">${icon('pin')}</div><h3>${local.nombre}</h3><p class="zone">${local.zona}</p><p class="description">${local.descripcion}</p><div class="location-meta"><span>${icon('clock')} Turnos 11:00–22:00</span><span>${icon('users')} Hasta 8 personas</span></div><button class="text-link" data-local="${local.id}">Elegir este local ${icon('arrow')}</button></article>`).join('');
$('#locations-grid').addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-local]');
  if (!button) return;
  quickLocal.value = button.dataset.local!;
  irAReserva();
});

function irAReserva() {
  $('#reservar').scrollIntoView({ behavior: 'smooth', block: 'center' });
  quickLocal.focus({ preventScroll: true });
}

$('#mobile-menu-toggle').addEventListener('click', () => {
  const menu = $('#mobile-nav'); menu.hidden = !menu.hidden;
  $('#mobile-menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
  $('#mobile-menu-toggle').setAttribute('aria-label', menu.hidden ? 'Abrir menú' : 'Cerrar menú');
});
$('#mobile-nav').addEventListener('click', event => {
  if ((event.target as Element).closest('a,button')) { $('#mobile-nav').hidden = true; $('#mobile-menu-toggle').setAttribute('aria-expanded', 'false'); }
});

function cabecera(titulo: string, subtitulo: string, tipo = 'booking') {
  return `<div class="modal-header"><div><span class="eyebrow">${subtitulo}</span><h2 id="${tipo}-title" tabindex="-1">${titulo}</h2></div><button class="icon-button" data-close="${tipo}" type="button" aria-label="Cerrar ventana">${icon('close')}</button></div>`;
}
function progreso() {
  return `<ol class="progress-steps" aria-label="Pasos de la reserva">${['Elegí un horario', 'Tus datos', 'Revisá tu reserva'].map((label, i) => `<li class="${paso >= i + 1 ? 'current' : ''}" ${paso === i + 1 ? 'aria-current="step"' : ''}>${i + 1}. ${label}</li>`).join('')}</ol>`;
}
function resumen(r = borrador) {
  return `<div class="booking-summary"><span>${icon('pin')}${escapar(localNombre(r.localId))}</span><span>${icon('calendar')}${fechaTexto(r.fecha)}</span><span>${icon('users')}${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}</span>${r.hora ? `<span>${icon('clock')}${r.hora} h</span>` : ''}</div>`;
}
function errorEn(selector: string, error: unknown) {
  const el = $(selector); el.textContent = error instanceof Error ? error.message : 'No pudimos completar la acción. Intentá nuevamente.'; el.hidden = false;
}

document.addEventListener('click', event => {
  const close = (event.target as Element).closest<HTMLElement>('[data-close]');
  if (close) (close.dataset.close === 'booking' ? bookingDialog : infoDialog).close();
});
for (const dialog of [bookingDialog, infoDialog]) {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); }
  });
}

$('#quick-form').addEventListener('submit', event => {
  event.preventDefault(); $('#quick-error').hidden = true;
  borrador = { ...borrador, localId: quickLocal.value, fecha: quickDate.value, personas: Number(quickGuests.value), hora: '' };
  try { servicio.disponibilidad(borrador.localId, borrador.fecha, borrador.personas); mostrarHorarios(); bookingDialog.showModal(); }
  catch (error) { errorEn('#quick-error', error); }
});

function mostrarHorarios() {
  paso = 1;
  const turnos = servicio.disponibilidad(borrador.localId, borrador.fecha, borrador.personas);
  if (!turnos.some(t => t.hora === borrador.hora && t.disponible)) borrador.hora = '';
  bookingContent.innerHTML = cabecera('Un horario para encontrarnos.', 'RESERVÁ TU MESA') + `<div class="modal-body">${progreso()}${resumen({ ...borrador, hora: '' })}<p class="slots-label">¿A qué hora te esperamos?</p><div class="time-slots" role="group" aria-label="Horarios disponibles">${turnos.map(t => `<button class="time-slot" data-time="${t.hora}" ${t.disponible ? '' : 'disabled'} aria-pressed="${borrador.hora === t.hora}" aria-label="${t.hora}${t.disponible ? '' : ', no disponible'}">${t.hora}</button>`).join('')}</div>${turnos.every(t => !t.disponible) ? '<p class="notice">No quedan turnos para esta búsqueda. Probá otra fecha, otro local o una cantidad menor de personas.</p>' : ''}<p class="field-help" style="margin-top:15px">Tu mesa se reserva por 90 minutos. Los horarios son de Uruguay y requieren al menos 30 minutos de anticipación.</p><div class="modal-actions"><button class="text-button" id="change-search">Cambiar búsqueda</button><button class="button button-yellow" id="continue-time" ${borrador.hora ? '' : 'disabled'}>Continuar ${icon('arrow')}</button></div></div>`;
  bookingContent.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button => button.addEventListener('click', () => {
    borrador.hora = button.dataset.time!;
    bookingContent.querySelectorAll('[data-time]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $<HTMLButtonElement>('#continue-time').disabled = false;
  }));
  $('#change-search').addEventListener('click', () => { bookingDialog.close(); quickDate.focus(); });
  $('#continue-time').addEventListener('click', mostrarDatos);
  $('#booking-title').focus();
}

function mostrarDatos() {
  paso = 2;
  bookingContent.innerHTML = cabecera('¿A nombre de quién?', 'YA CASI TENÉS TU PLAN') + `<div class="modal-body">${progreso()}${resumen()}<form id="contact-form"><div class="form-grid"><label class="form-field full">Nombre y apellido<input name="nombre" autocomplete="name" required minlength="2" maxlength="80" placeholder="Ej. Juan Pérez" value="${escapar(borrador.nombre)}"></label><label class="form-field">Correo electrónico<input name="email" type="email" autocomplete="email" required maxlength="120" placeholder="tu@email.com" value="${escapar(borrador.email)}"></label><label class="form-field">Teléfono<input name="telefono" type="tel" autocomplete="tel" required minlength="6" maxlength="24" placeholder="Ej. 099 123 456" value="${escapar(borrador.telefono)}"></label><label class="form-field full">¿Algo que debamos saber? <span class="field-help">Opcional · hasta 300 caracteres</span><textarea name="notas" maxlength="300" rows="2" placeholder="Un comentario para tu reserva de prueba">${escapar(borrador.notas)}</textarea></label></div><label class="checkbox-label"><input type="checkbox" name="aceptar" required><span>Entiendo que es una reserva de prueba, guardada solo en este navegador. No se envían correos ni se reserva una mesa real.</span></label><p id="contact-error" class="error-message" role="alert" hidden></p><div class="modal-actions"><button type="button" id="back-time" class="text-button">Volver</button><button type="submit" class="button button-yellow">Revisar reserva ${icon('arrow')}</button></div></form></div>`;
  const form = $<HTMLFormElement>('#contact-form');
  const recogerDatos = () => { const data = new FormData(form); for (const campo of ['nombre', 'email', 'telefono', 'notas'] as const) borrador[campo] = String(data.get(campo) ?? '').trim(); };
  $('#back-time').addEventListener('click', () => { recogerDatos(); mostrarHorarios(); });
  form.addEventListener('submit', event => {
    event.preventDefault(); recogerDatos();
    if (!/^[+\d\s()-]{6,24}$/.test(borrador.telefono) || borrador.telefono.replace(/\D/g, '').length < 6) { errorEn('#contact-error', new Error('Ingresá un teléfono válido.')); return; }
    mostrarRevision();
  });
  $('#booking-title').focus();
}

function detalles(r: SolicitudReserva) {
  return `<dl class="review-list"><div><dt>Local</dt><dd>${escapar(localNombre(r.localId))}</dd></div><div><dt>Día y hora</dt><dd>${fechaTexto(r.fecha)} · ${r.hora} h</dd></div><div><dt>Personas</dt><dd>${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} · 90 minutos</dd></div><div><dt>A nombre de</dt><dd>${escapar(r.nombre)}</dd></div><div><dt>Correo</dt><dd>${escapar(r.email)}</dd></div><div><dt>Teléfono</dt><dd>${escapar(r.telefono)}</dd></div>${r.notas ? `<div><dt>Comentario</dt><dd>${escapar(r.notas)}</dd></div>` : ''}</dl>`;
}

function mostrarRevision() {
  paso = 3;
  bookingContent.innerHTML = cabecera('Todo listo para tu encuentro.', 'REVISÁ LOS DETALLES') + `<div class="modal-body">${progreso()}${detalles(borrador)}<p class="notice">Esta es una reserva de demostración. Se guardará en este navegador; no se enviará al local ni a tu correo.</p><p id="confirm-error" class="error-message" role="alert" hidden></p><div class="modal-actions"><button class="text-button" id="back-data">Editar datos</button><button class="button button-yellow" id="confirm-booking">Confirmar reserva ${icon('check')}</button></div></div>`;
  $('#back-data').addEventListener('click', mostrarDatos);
  $('#confirm-booking').addEventListener('click', async () => {
    if (guardando) return;
    guardando = true;
    const button = $<HTMLButtonElement>('#confirm-booking'); button.disabled = true; button.textContent = 'Guardando…';
    try {
      // Web Locks evita asignaciones simultáneas entre pestañas del mismo navegador.
      const reserva = navigator.locks ? await navigator.locks.request('mc-mesa-reservas', () => servicio.reservar(borrador)) : servicio.reservar(borrador);
      mostrarExito(reserva);
    } catch (error) {
      errorEn('#confirm-error', error);
      button.disabled = false; button.innerHTML = `Confirmar reserva ${icon('check')}`;
      if (!document.querySelector('#choose-another-time')) {
        const volver = document.createElement('button'); volver.id = 'choose-another-time'; volver.className = 'text-button'; volver.textContent = 'Elegir otro horario';
        volver.addEventListener('click', () => {
          try { mostrarHorarios(); } catch { bookingDialog.close(); irAReserva(); }
        });
        $('#confirm-error').after(volver);
      }
    } finally { guardando = false; }
  });
  $('#booking-title').focus();
}

function mostrarExito(reserva: Reserva) {
  paso = 4;
  bookingContent.innerHTML = cabecera('¡Ya tenés un plan!', 'RESERVA DE PRUEBA CONFIRMADA') + `<div class="modal-body success-body"><div class="success-icon">${icon('check')}</div><h3>Nos vemos en la mesa.</h3><p>Guardamos tu reserva de prueba, ${escapar(reserva.nombre.split(' ')[0])}.<br>Podés encontrarla cuando quieras en Mis reservas.</p><span class="reservation-code">${reserva.codigo}</span>${detalles(reserva)}<p class="notice">El código solo es válido en este prototipo. No se envió una reserva al restaurante ni un correo de confirmación.</p><div class="success-actions"><button class="button button-outline" id="download-calendar">${icon('calendar')} Guardar en calendario</button><button class="button button-yellow" id="view-bookings">Mis reservas ${icon('arrow')}</button></div></div>`;
  $('#download-calendar').addEventListener('click', () => descargarCalendario(reserva));
  $('#view-bookings').addEventListener('click', () => { bookingDialog.close(); mostrarReservas(); });
  borrador = { ...borrador, hora: '', nombre: '', email: '', telefono: '', notas: '' };
  $('#booking-title').focus();
}

function descargarCalendario(r: Reserva) {
  const utc = (milisegundos: number) => new Date(milisegundos).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const inicio = instante(r.fecha, r.hora);
  const contenido = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mc Mesa Demo//ES', 'BEGIN:VEVENT', `UID:${r.id}@mc-mesa.demo`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(inicio)}`, `DTEND:${utc(inicio + 90 * 60000)}`, 'SUMMARY:Reserva de prueba - McDonald’s', `LOCATION:${localNombre(r.localId)}`, `DESCRIPTION:Demostracion local. No es una reserva real. Codigo: ${r.codigo}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/calendar;charset=utf-8' }));
  const enlace = document.createElement('a'); enlace.href = url; enlace.download = `${r.codigo}.ics`; enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function mostrarReservas() {
  viendoReservas = true;
  try {
    const reservas = servicio.listar();
    infoContent.innerHTML = cabecera('Tus próximos buenos momentos.', 'MIS RESERVAS', 'info') + `<div class="modal-body"><p class="modal-intro">Reservas de prueba guardadas en este navegador.</p>${reservas.length ? reservas.map(r => { const futura = instante(r.fecha, r.hora) > Date.now(); return `<article class="saved-reservation"><div class="saved-top"><h3>${escapar(localNombre(r.localId))}</h3><span class="status ${r.estado === 'cancelada' ? 'cancelled' : ''}">${r.estado === 'cancelada' ? 'Cancelada' : futura ? 'Confirmada · demo' : 'Finalizada · demo'}</span></div><p>${fechaTexto(r.fecha)} · ${r.hora} h · ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}<br>A nombre de ${escapar(r.nombre)}<br><span class="code">${escapar(r.codigo)}</span></p>${r.estado === 'confirmada' && futura ? `<button class="cancel-button" data-cancel="${escapar(r.id)}">Cancelar reserva</button>` : ''}</article>`; }).join('') : `<div class="empty-state">${icon('calendar')}<h3>Tu próximo plan empieza acá.</h3><p>Todavía no tenés reservas.<br>Busquemos una mesa para compartir.</p><button id="empty-reserve" class="button button-yellow">Reservar mesa ${icon('arrow')}</button></div>`}</div>`;
    infoContent.querySelector('#empty-reserve')?.addEventListener('click', () => { infoDialog.close(); irAReserva(); });
    infoContent.querySelectorAll<HTMLButtonElement>('[data-cancel]').forEach(button => button.addEventListener('click', () => confirmarCancelacion(reservas.find(r => r.id === button.dataset.cancel)!)));
  } catch (error) {
    infoContent.innerHTML = cabecera('Mis reservas', 'TUS PLANES', 'info') + '<div class="modal-body"><p id="list-error" class="error-message" role="alert"></p></div>';
    errorEn('#list-error', error);
  }
  if (!infoDialog.open) infoDialog.showModal();
  $('#info-title').focus();
}

function confirmarCancelacion(r: Reserva) {
  viendoReservas = false;
  infoContent.innerHTML = cabecera('¿Cancelamos este plan?', 'CANCELAR RESERVA', 'info') + `<div class="modal-body"><p class="modal-intro">Vas a liberar tu mesa en ${escapar(localNombre(r.localId))} para el ${fechaTexto(r.fecha)} a las ${r.hora} h. Después podés elegir un nuevo horario.</p><p id="cancel-error" class="error-message" role="alert" hidden></p><div class="modal-actions"><button class="button button-outline" id="keep-booking">Mantener reserva</button><button class="button button-red" id="cancel-confirm">Sí, cancelar</button></div></div>`;
  $('#keep-booking').addEventListener('click', mostrarReservas);
  $('#cancel-confirm').addEventListener('click', async () => {
    const button = $<HTMLButtonElement>('#cancel-confirm'); button.disabled = true;
    try {
      if (navigator.locks) await navigator.locks.request('mc-mesa-reservas', () => servicio.cancelar(r.id));
      else servicio.cancelar(r.id);
      mostrarReservas(); notificar('Reserva cancelada. Tu mesa quedó disponible.');
    } catch (error) { errorEn('#cancel-error', error); button.disabled = false; }
  });
  $('#info-title').focus();
}

document.querySelectorAll('.my-bookings').forEach(button => button.addEventListener('click', mostrarReservas));
let toastTimer: ReturnType<typeof setTimeout>;
function notificar(mensaje: string) {
  const toast = $('#toast'); toast.textContent = mensaje; toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

$('#privacy-button').addEventListener('click', () => {
  viendoReservas = false;
  infoContent.innerHTML = cabecera('Tus datos en este prototipo.', 'PRIVACIDAD DE LA DEMO', 'info') + `<div class="modal-body privacy-copy"><p>El nombre, correo, teléfono y comentarios que ingreses se guardan en el almacenamiento local de este navegador. No se envían a McDonald’s ni a un servidor de reservas.</p><p>Las personas que usen este mismo perfil del navegador pueden consultar las reservas. Para la demostración, usá datos ficticios.</p><p>Podés eliminar estos datos desde los ajustes de almacenamiento del navegador para este sitio. Si borrás los datos o cambiás de navegador, tus reservas no estarán disponibles.</p><p>Este es un concepto independiente, sin conexión con el sistema de McDonald’s. Las imágenes de productos son ilustrativas, generadas para el diseño.</p></div>`;
  infoDialog.showModal();
});

window.addEventListener('storage', event => {
  if (event.key === 'mc-mesa.reservas.v1') {
    if (infoDialog.open && viendoReservas) mostrarReservas();
    if (bookingDialog.open && paso === 1) {
      try { mostrarHorarios(); } catch { bookingDialog.close(); notificar('La disponibilidad cambió. Volvé a buscar una mesa.'); }
    }
  }
});
