import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ServicioReservas } from '../dominio/reservas.ts';
import { fechaUruguay, fechaMaxima } from '../dominio/locales.ts';
import type { RepositorioReservas, Reserva, SolicitudReserva } from '../dominio/modelos.ts';

class Memoria implements RepositorioReservas {
  datos: Reserva[] = [];
  listar() { return this.datos; }
  guardar(reserva: Reserva) { this.datos = [...this.datos.filter(r => r.id !== reserva.id), reserva]; }
}
const reloj = () => new Date('2026-10-25T13:00:00-03:00');
const solicitud = (cambios: Partial<SolicitudReserva> = {}): SolicitudReserva => ({ localId: 'centro', fecha: '2026-10-26', hora: '14:00', personas: 4, nombre: 'Juan Prueba', email: 'juan@example.com', telefono: '099123456', notas: '', ...cambios });
const crear = () => new ServicioReservas(new Memoria(), reloj);

test('asigna la mesa más pequeña adecuada y genera un código', () => {
  const servicio = crear();
  const reserva = servicio.reservar(solicitud({ nombre: '  Juan Prueba  ', email: 'JUAN@example.com' }));
  assert.equal(reserva.mesaId, 'M3'); assert.equal(reserva.estado, 'confirmada');
  assert.equal(reserva.nombre, 'Juan Prueba'); assert.equal(reserva.email, 'juan@example.com');
  assert.match(reserva.codigo, /^MC-[A-F0-9]{8}$/); assert.equal(servicio.listar().length, 1);
});
test('impide ocupar la misma mesa en intervalos superpuestos de 90 minutos', () => {
  const servicio = crear();
  servicio.reservar(solicitud({ personas: 8 }));
  for (const hora of ['13:00', '13:30', '14:00', '14:30', '15:00']) {
    assert.equal(servicio.mesasDisponibles('centro', '2026-10-26', hora, 8).length, 0);
  }
  assert.equal(servicio.mesasDisponibles('centro', '2026-10-26', '15:30', 8).length, 1);
  assert.throws(() => servicio.reservar(solicitud({ hora: '14:30', personas: 8, email: 'otro@example.com' })), /no tiene mesas/);
});
test('no permite duplicar o solapar reservas del mismo correo en otro local', () => {
  const servicio = crear(); servicio.reservar(solicitud());
  assert.throws(() => servicio.reservar(solicitud({ localId: 'pocitos', hora: '15:00' })), /Ya tenés una reserva/);
  assert.doesNotThrow(() => servicio.reservar(solicitud({ hora: '15:30' })));
});
test('cancelar libera la mesa y conserva el historial', () => {
  const servicio = crear(); const r = servicio.reservar(solicitud({ personas: 8 }));
  servicio.cancelar(r.id);
  assert.equal(servicio.mesasDisponibles('centro', '2026-10-26', '14:00', 8).length, 1);
  assert.equal(servicio.listar()[0].estado, 'cancelada');
  assert.throws(() => servicio.cancelar('inexistente'), /No encontramos/);
});
test('rechaza fechas pasadas, imposibles, fuera de rango y locales inexistentes', () => {
  const servicio = crear();
  for (const fecha of ['2026-10-24', '2026-11-25', '2026-02-30', 'texto', '']) assert.throws(() => servicio.reservar(solicitud({ fecha })), /Elegí una fecha/);
  assert.throws(() => servicio.reservar(solicitud({ localId: 'inventado' })), /locales disponibles/);
});
test('respeta la anticipación mínima y los horarios definidos', () => {
  const servicio = crear();
  assert.equal(servicio.mesasDisponibles('centro', '2026-10-25', '13:00', 2).length, 0);
  assert.ok(servicio.mesasDisponibles('centro', '2026-10-25', '13:30', 2).length > 0);
  for (const hora of ['03:00', '14:15', '25:00', '']) assert.throws(() => servicio.reservar(solicitud({ hora })), /no tiene mesas/);
});
test('valida cantidad de personas y datos de contacto', () => {
  for (const personas of [0, 9, -1, 2.5, NaN]) assert.throws(() => crear().reservar(solicitud({ personas })), /entre 1 y 8/);
  for (const cambios of [{ nombre: ' ' }, { email: 'sin-arroba' }, { telefono: 'abcdefg' }, { telefono: '()----' }, { notas: 'a'.repeat(301) }]) assert.throws(() => crear().reservar(solicitud(cambios)));
});
test('las reservas de diferentes locales y días no comparten cupos', () => {
  const servicio = crear(); servicio.reservar(solicitud({ personas: 8 }));
  assert.equal(servicio.mesasDisponibles('pocitos', '2026-10-26', '14:00', 8).length, 1);
  assert.equal(servicio.mesasDisponibles('centro', '2026-10-27', '14:00', 8).length, 1);
});
test('no confirma una reserva cuando el almacenamiento falla', () => {
  const servicio = new ServicioReservas({ listar: () => [], guardar: () => { throw new Error('Sin espacio'); } }, reloj);
  assert.throws(() => servicio.reservar(solicitud()), /Sin espacio/);
});
test('calcula el día de Uruguay aunque UTC ya esté en el siguiente día', () => {
  const ahora = new Date('2026-10-26T01:30:00Z');
  assert.equal(fechaUruguay(ahora), '2026-10-25'); assert.equal(fechaMaxima(ahora), '2026-11-24');
});
test('no permite cancelar una reserva que ya pasó', () => {
  let ahora = new Date('2026-10-25T13:00:00-03:00');
  const servicio = new ServicioReservas(new Memoria(), () => ahora);
  const reserva = servicio.reservar(solicitud());
  ahora = new Date('2026-10-27T13:00:00-03:00');
  assert.throws(() => servicio.cancelar(reserva.id), /reservas futuras/);
});
