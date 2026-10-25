import { ANTICIPACION_MINUTOS, DURACION_MINUTOS, fechaMaxima, fechaUruguay, horarios, instante, locales } from './locales.ts';
import { ErrorReserva, type RepositorioReservas, type Reserva, type SolicitudReserva } from './modelos.ts';

export class ServicioReservas {
  private repositorio: RepositorioReservas;
  private reloj: () => Date;

  constructor(repositorio: RepositorioReservas, reloj: () => Date = () => new Date()) {
    this.repositorio = repositorio;
    this.reloj = reloj;
  }

  listar(): Reserva[] {
    return this.repositorio.listar().sort((a, b) => instante(a.fecha, a.hora) - instante(b.fecha, b.hora));
  }

  private validarTurno(localId: string, fecha: string, personas: number): void {
    if (!locales.some(local => local.id === localId)) throw new ErrorReserva('Elegí uno de los locales disponibles.');
    if (!Number.isInteger(personas) || personas < 1 || personas > 8) throw new ErrorReserva('Podés reservar para entre 1 y 8 personas.');
    const parsed = new Date(`${fecha}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fecha || fecha < fechaUruguay(this.reloj()) || fecha > fechaMaxima(this.reloj())) {
      throw new ErrorReserva('Elegí una fecha desde hoy y hasta los próximos 30 días.');
    }
  }

  mesasDisponibles(localId: string, fecha: string, hora: string, personas: number) {
    this.validarTurno(localId, fecha, personas);
    if (!horarios.includes(hora) || instante(fecha, hora) < this.reloj().getTime() + ANTICIPACION_MINUTOS * 60_000) return [];
    const ocupadas = this.repositorio.listar().filter(r => r.estado === 'confirmada' && r.localId === localId && Math.abs(instante(r.fecha, r.hora) - instante(fecha, hora)) < DURACION_MINUTOS * 60_000);
    return locales.find(local => local.id === localId)!.mesas
      .filter(mesa => mesa.capacidad >= personas && !ocupadas.some(r => r.mesaId === mesa.id))
      .sort((a, b) => a.capacidad - b.capacidad);
  }

  disponibilidad(localId: string, fecha: string, personas: number) {
    this.validarTurno(localId, fecha, personas);
    return horarios.map(hora => ({ hora, disponible: this.mesasDisponibles(localId, fecha, hora, personas).length > 0 }));
  }

  reservar(solicitud: SolicitudReserva): Reserva {
    const limpia = { ...solicitud, nombre: solicitud.nombre.trim(), email: solicitud.email.trim().toLowerCase(), telefono: solicitud.telefono.trim(), notas: solicitud.notas.trim() };
    this.validarTurno(limpia.localId, limpia.fecha, limpia.personas);
    if (limpia.nombre.length < 2 || limpia.nombre.length > 80) throw new ErrorReserva('Ingresá tu nombre (entre 2 y 80 caracteres).');
    if (limpia.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpia.email)) throw new ErrorReserva('Ingresá un correo electrónico válido.');
    if (!/^[+\d\s()-]{6,24}$/.test(limpia.telefono) || limpia.telefono.replace(/\D/g, '').length < 6) throw new ErrorReserva('Ingresá un teléfono válido.');
    if (limpia.notas.length > 300) throw new ErrorReserva('El comentario puede tener hasta 300 caracteres.');
    const inicio = instante(limpia.fecha, limpia.hora);
    if (this.repositorio.listar().some(r => r.estado === 'confirmada' && r.email === limpia.email && Math.abs(instante(r.fecha, r.hora) - inicio) < DURACION_MINUTOS * 60_000)) {
      throw new ErrorReserva('Ya tenés una reserva con ese correo en este horario. Revisá Mis reservas.');
    }
    const mesa = this.mesasDisponibles(limpia.localId, limpia.fecha, limpia.hora, limpia.personas)[0];
    if (!mesa) throw new ErrorReserva('Ese horario ya no tiene mesas disponibles. Elegí otro para continuar.');
    const id = crypto.randomUUID();
    const reserva: Reserva = { ...limpia, id, codigo: `MC-${id.slice(0, 8).toUpperCase()}`, mesaId: mesa.id, creadaEn: this.reloj().toISOString(), estado: 'confirmada' };
    this.repositorio.guardar(reserva);
    return reserva;
  }

  cancelar(id: string): void {
    const reserva = this.repositorio.listar().find(r => r.id === id);
    if (!reserva) throw new ErrorReserva('No encontramos esa reserva.');
    if (instante(reserva.fecha, reserva.hora) <= this.reloj().getTime()) throw new ErrorReserva('Solo podés cancelar reservas futuras.');
    this.repositorio.guardar({ ...reserva, estado: 'cancelada' });
  }
}
