import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../shared/api-base';

export interface ContactoRespuesta {
  mensaje: string;
  destinatario: string;
}

export interface ContactoPeticion {
  nombre: string;
  motivo: 'DUDA' | 'ACLARACION';
  fecha?: string;
  hora?: string;
  total?: string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE}/contacto`;

  enviarContacto(peticion: ContactoPeticion): Observable<ContactoRespuesta> {
    return this.http.post<ContactoRespuesta>(this.url, peticion);
  }
}
