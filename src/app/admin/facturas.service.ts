import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminAuthService } from './auth.service';

export interface FacturaEmitida {
  folio: string;
  uuid: string;
  fecha: string;
  cliente: string;
  rfc: string;
  tienda: string;
  total: number;
  estado: 'Vigente' | 'Cancelada';
  ticket: string;
  sustituyeA?: string;
  sustituidaPor?: string;
  motivoCancelacion?: string;
}

export interface DatosRefacturacion {
  cliente: string;
  rfc: string;
  correo: string;
  regimen: string;
  uso: string;
  motivo: string;
}

export interface FacturaItem {
  idFactura?: number | null;
  folio?: string | null;
  serie?: string | null;
  fecha?: string | null;
  cliente?: string | null;
  rfc?: string | null;
  razonSocial?: string | null;
  noTicket?: string | null;
  subtotal?: number | null;
  impuesto?: number | null;
  total?: number | null;
  estatus?: string | null;
  uuid?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaginaFactura {
  content?: FacturaItem[] | null;
  page?: number | null;
  size?: number | null;
  totalElements?: number | null;
  totalPages?: number | null;
}

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private readonly BASE = 'http://localhost:8080/api/v1/facturas';

  constructor(private http: HttpClient, private auth: AdminAuthService) {}

  obtenerFacturas(desde: string, hasta: string, noTicket: string, page: number, size: number): Observable<PaginaFactura> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (desde?.trim()) params = params.set('desde', `${desde}T00:00:00Z`);
    if (hasta?.trim()) params = params.set('hasta', `${hasta}T23:59:59.999Z`);
    if (noTicket?.trim()) params = params.set('noTicket', noTicket.trim());
    return this.http.get<PaginaFactura>(this.BASE, { params, headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const session = this.auth.getSession<{ token?: string; tokenType?: string }>();
    const token = session?.token?.trim();
    if (!token) return new HttpHeaders();
    const tipo = session?.tokenType?.trim() || 'Bearer';
    return new HttpHeaders().set('Authorization', `${tipo} ${token}`);
  }

  private facturas: FacturaEmitida[] = [
    { folio: 'OD-2026-0101', uuid: 'A1B2C3D4-0101-4CFDI-ABCD-000000010101', fecha: '2026-09-01', cliente: 'María Hernández', rfc: 'HEMA900101ABC', tienda: 'Roma Norte', total: 486.50, estado: 'Vigente', ticket: 'T-88231' },
    { folio: 'OD-2026-0100', uuid: 'A1B2C3D4-0100-4CFDI-ABCD-000000010100', fecha: '2026-08-30', cliente: 'Carlos Ruiz', rfc: 'RUCJ850515XYZ', tienda: 'Condesa', total: 1290.00, estado: 'Vigente', ticket: 'T-88190' },
    { folio: 'OD-2026-0099', uuid: 'A1B2C3D4-0099-4CFDI-ABCD-000000010099', fecha: '2026-08-29', cliente: 'Ana Paula López', rfc: 'LOPA920722DEF', tienda: 'Polanco', total: 356.00, estado: 'Cancelada', ticket: 'T-88155', motivoCancelacion: '01', sustituidaPor: 'OD-2026-0099-B' },
    { folio: 'OD-2026-0098', uuid: 'A1B2C3D4-0098-4CFDI-ABCD-000000010098', fecha: '2026-08-28', cliente: 'José Vázquez', rfc: 'VAZJ880310GHI', tienda: 'Roma Norte', total: 720.75, estado: 'Vigente', ticket: 'T-88120' },
    { folio: 'OD-2026-0097', uuid: 'A1B2C3D4-0097-4CFDI-ABCD-000000010097', fecha: '2026-08-27', cliente: 'Lucía Fernández', rfc: 'FELU950118JKL', tienda: 'Del Valle', total: 214.00, estado: 'Vigente', ticket: 'T-88098' },
    { folio: 'OD-2026-0096', uuid: 'A1B2C3D4-0096-4CFDI-ABCD-000000010096', fecha: '2026-08-25', cliente: 'Miguel Torres', rfc: 'TOMM800430MNO', tienda: 'Condesa', total: 985.20, estado: 'Vigente', ticket: 'T-88071' },
    { folio: 'OD-2026-0095', uuid: 'A1B2C3D4-0095-4CFDI-ABCD-000000010095', fecha: '2026-08-24', cliente: 'Sofía Morales', rfc: 'SOMO910203AAA', tienda: 'Roma Norte', total: 542.90, estado: 'Vigente', ticket: 'T-88045' },
    { folio: 'OD-2026-0094', uuid: 'A1B2C3D4-0094-4CFDI-ABCD-000000010094', fecha: '2026-08-22', cliente: 'Diego Ramírez', rfc: 'RADI870714BBB', tienda: 'Polanco', total: 1780.00, estado: 'Vigente', ticket: 'T-88012' },
    { folio: 'OD-2026-0093', uuid: 'A1B2C3D4-0093-4CFDI-ABCD-000000010093', fecha: '2026-08-20', cliente: 'Valeria Cruz', rfc: 'CRUV950630CCC', tienda: 'Del Valle', total: 329.50, estado: 'Cancelada', ticket: 'T-87988' },
    { folio: 'OD-2026-0092', uuid: 'A1B2C3D4-0092-4CFDI-ABCD-000000010092', fecha: '2026-08-18', cliente: 'Andrés Gutiérrez', rfc: 'GUAA820911DDD', tienda: 'Condesa', total: 640.25, estado: 'Vigente', ticket: 'T-87960' },
    { folio: 'OD-2026-0091', uuid: 'A1B2C3D4-0091-4CFDI-ABCD-000000010091', fecha: '2026-08-16', cliente: 'Camila Ortiz', rfc: 'ORCA940517EEE', tienda: 'Roma Norte', total: 895.00, estado: 'Vigente', ticket: 'T-87933' },
    { folio: 'OD-2026-0090', uuid: 'A1B2C3D4-0090-4CFDI-ABCD-000000010090', fecha: '2026-08-14', cliente: 'Fernando Soto', rfc: 'SOFE790802FFF', tienda: 'Polanco', total: 412.75, estado: 'Vigente', ticket: 'T-87901' },
    { folio: 'OD-2026-0089', uuid: 'A1B2C3D4-0089-4CFDI-ABCD-000000010089', fecha: '2026-08-12', cliente: 'Paola Mendoza', rfc: 'MEPA900919GGG', tienda: 'Del Valle', total: 1150.60, estado: 'Vigente', ticket: 'T-87877' },
    { folio: 'OD-2026-0088', uuid: 'A1B2C3D4-0088-4CFDI-ABCD-000000010088', fecha: '2026-08-10', cliente: 'Ricardo Navarro', rfc: 'NARI850326HHH', tienda: 'Condesa', total: 278.00, estado: 'Cancelada', ticket: 'T-87850' },
    { folio: 'OD-2026-0087', uuid: 'A1B2C3D4-0087-4CFDI-ABCD-000000010087', fecha: '2026-08-08', cliente: 'Elena Vargas', rfc: 'VAEL930415III', tienda: 'Roma Norte', total: 730.40, estado: 'Vigente', ticket: 'T-87822' },
    { folio: 'OD-2026-0086', uuid: 'A1B2C3D4-0086-4CFDI-ABCD-000000010086', fecha: '2026-08-06', cliente: 'Hugo Castillo', rfc: 'CAHU880701JJJ', tienda: 'Polanco', total: 960.00, estado: 'Vigente', ticket: 'T-87795' },
    { folio: 'OD-2026-0085', uuid: 'A1B2C3D4-0085-4CFDI-ABCD-000000010085', fecha: '2026-08-04', cliente: 'Daniela Ríos', rfc: 'RIOD910208KKK', tienda: 'Del Valle', total: 385.20, estado: 'Vigente', ticket: 'T-87770' },
    { folio: 'OD-2026-0084', uuid: 'A1B2C3D4-0084-4CFDI-ABCD-000000010084', fecha: '2026-08-02', cliente: 'Jorge Medina', rfc: 'MEJO800913LLL', tienda: 'Condesa', total: 1520.75, estado: 'Vigente', ticket: 'T-87744' },
    { folio: 'OD-2026-0083', uuid: 'A1B2C3D4-0083-4CFDI-ABCD-000000010083', fecha: '2026-07-30', cliente: 'Natalia Peña', rfc: 'PENA940622MMM', tienda: 'Roma Norte', total: 445.00, estado: 'Vigente', ticket: 'T-87710' },
    { folio: 'OD-2026-0082', uuid: 'A1B2C3D4-0082-4CFDI-ABCD-000000010082', fecha: '2026-07-28', cliente: 'Emilio Aguilar', rfc: 'AGEM870509NNN', tienda: 'Polanco', total: 690.90, estado: 'Vigente', ticket: 'T-87685' },
    { folio: 'OD-2026-0081', uuid: 'A1B2C3D4-0081-4CFDI-ABCD-000000010081', fecha: '2026-07-26', cliente: 'Renata Delgado', rfc: 'DERE920111OOO', tienda: 'Del Valle', total: 310.00, estado: 'Cancelada', ticket: 'T-87660' },
    { folio: 'OD-2026-0080', uuid: 'A1B2C3D4-0080-4CFDI-ABCD-000000010080', fecha: '2026-07-24', cliente: 'Gabriel Rojas', rfc: 'ROGA890704PPP', tienda: 'Condesa', total: 825.50, estado: 'Vigente', ticket: 'T-87630' },
    { folio: 'OD-2026-0079', uuid: 'A1B2C3D4-0079-4CFDI-ABCD-000000010079', fecha: '2026-07-22', cliente: 'Fernanda Silva', rfc: 'SIFE910917QQQ', tienda: 'Roma Norte', total: 540.00, estado: 'Vigente', ticket: 'T-87602' },
    { folio: 'OD-2026-0078', uuid: 'A1B2C3D4-0078-4CFDI-ABCD-000000010078', fecha: '2026-07-20', cliente: 'Martín López', rfc: 'LOMM840303RRR', tienda: 'Polanco', total: 1340.20, estado: 'Vigente', ticket: 'T-87575' },
    { folio: 'OD-2026-0077', uuid: 'A1B2C3D4-0077-4CFDI-ABCD-000000010077', fecha: '2026-07-18', cliente: 'Carolina Torres', rfc: 'TOCA950512SSS', tienda: 'Del Valle', total: 295.75, estado: 'Vigente', ticket: 'T-87540' },
    { folio: 'OD-2026-0076', uuid: 'A1B2C3D4-0076-4CFDI-ABCD-000000010076', fecha: '2026-07-15', cliente: 'Alejandro Díaz', rfc: 'DIAL860820TTT', tienda: 'Condesa', total: 770.00, estado: 'Vigente', ticket: 'T-87510' },
  ];

  listar(): FacturaEmitida[] {
    return [...this.facturas];
  }

  buscar(query: string): FacturaEmitida | undefined {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return this.facturas.find((f) =>
      f.folio.toLowerCase() === q || f.ticket.toLowerCase() === q || f.uuid.toLowerCase() === q
    );
  }

  refacturar(original: FacturaEmitida, datos: DatosRefacturacion): FacturaEmitida {
    const consecutivo = this.facturas.length + 101;
    const nueva: FacturaEmitida = {
      folio: `OD-2026-0${consecutivo}`,
      uuid: this.generarUuid(),
      fecha: new Date().toISOString().slice(0, 10),
      cliente: datos.cliente || original.cliente,
      rfc: datos.rfc || original.rfc,
      tienda: original.tienda,
      total: original.total,
      estado: 'Vigente',
      ticket: original.ticket,
      sustituyeA: original.uuid,
    };
    const idx = this.facturas.findIndex((f) => f.uuid === original.uuid);
    if (idx >= 0) {
      this.facturas[idx] = {
        ...this.facturas[idx],
        estado: 'Cancelada',
        motivoCancelacion: '01',
        sustituidaPor: nueva.uuid,
      };
    }
    this.facturas.unshift(nueva);
    return nueva;
  }

  private generarUuid(): string {
    return 'XXXXXXXX-XXXX-4XXX-AXXX-XXXXXXXXXXXX'.replace(/X/g, () =>
      Math.floor(Math.random() * 16).toString(16).toUpperCase()
    );
  }
}
