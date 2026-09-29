import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminAuthService } from './auth.service';
import { API_BASE } from '../shared/api-base';

export interface ClienteItem {
  idCliente?: number | null;
  rfc?: string | null;
  razonSocial?: string | null;
  calle?: string | null;
  numExterior?: string | null;
  numInterior?: string | null;
  referencia?: string | null;
  estado?: string | null;
  municipio?: string | null;
  colonia?: string | null;
  codigoPostal?: string | null;
  correoElectronico?: string | null;
  regimenFiscal?: string | null;
  usoFactura?: string | null;
  estatus?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaginaCliente {
  content?: ClienteItem[] | null;
  page?: number | null;
  size?: number | null;
  totalElements?: number | null;
  totalPages?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly BASE = `${API_BASE}/clientes`;

  constructor(private http: HttpClient, private auth: AdminAuthService) {}

  obtenerClientes(
    rfc: string,
    razonSocial: string,
    codigoPostal: string,
    page: number,
    size: number
  ): Observable<PaginaCliente> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'idCliente,desc');
    if (rfc?.trim()) params = params.set('rfc', rfc.trim());
    if (razonSocial?.trim()) params = params.set('razonSocial', razonSocial.trim());
    if (codigoPostal?.trim()) params = params.set('codigoPostal', codigoPostal.trim());
    return this.http.get<PaginaCliente>(this.BASE, { params, headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const session = this.auth.getSession<{ token?: string; tokenType?: string }>();
    const token = session?.token?.trim();
    if (!token) return new HttpHeaders();
    const tipo = session?.tokenType?.trim() || 'Bearer';
    return new HttpHeaders().set('Authorization', `${tipo} ${token}`);
  }
}