export interface Local {
  id: string;
  nombre: string;
  zona: string;
  descripcion: string;
  mesas: { id: string; capacidad: number }[];
}

export interface SolicitudReserva {
  localId: string;
  fecha: string;
  hora: string;
  personas: number;
  nombre: string;
  email: string;
  telefono: string;
  notas: string;
}

export interface Reserva extends SolicitudReserva {
  id: string;
  codigo: string;
  mesaId: string;
  creadaEn: string;
  estado: 'confirmada' | 'cancelada';
}

export interface RepositorioReservas {
  listar(): Reserva[];
  guardar(reserva: Reserva): void;
}

export class ErrorReserva extends Error {}
