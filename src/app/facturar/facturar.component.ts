import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { ErrorDialogComponent } from '../shared/error-dialog.component';
import { LoadingOverlayComponent } from '../shared/loading-overlay.component';
import { FacturacionService } from '../facturacion/facturacion.service';
import { DatosFacturaStore } from '../facturacion/datos-factura.store';

type Pestana = 'facturar' | 'consulta';

@Component({
  selector: 'app-facturar',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, ErrorDialogComponent, LoadingOverlayComponent],
  templateUrl: './facturar.component.html',
  styleUrls: ['./facturar.component.css'],
})
export class FacturarComponent implements OnInit {
  pestana: Pestana = 'facturar';
  rfc = '';
  numeroTicket = '';
  numeroTicketConsulta = '';
  correoConsulta = '';
  cargando = false;
  errorAbierto = false;
  errorMensaje = '';
exitoMensaje = '';
  ayudaTicketVisible = false;

  @ViewChild('formFacturar') formFacturar?: ElementRef<HTMLFormElement>;
  @ViewChild('formConsulta') formConsulta?: ElementRef<HTMLFormElement>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private facturacion: FacturacionService,
    private store: DatosFacturaStore
  ) {}

  ngOnInit(): void {
    const tab = this.route.snapshot.data['tab'] as Pestana | undefined;
    if (tab) this.pestana = tab;
  }

  mostrar(p: Pestana): void {
    this.pestana = p;
  }

  cancelar(): void {
    this.formFacturar?.nativeElement.reset();
    this.rfc = '';
    this.numeroTicket = '';
    void this.router.navigate(['/']);
  }

  cancelarConsulta(): void {
    this.formConsulta?.nativeElement.reset();
    this.numeroTicketConsulta = '';
    this.correoConsulta = '';
    this.exitoMensaje = '';
    void this.router.navigate(['/']);
  }

  continuar(): void {
    if (this.pestana !== 'facturar') {
      this.continuarConsulta();
      return;
    }
    const form = this.formFacturar?.nativeElement;
    if (form && !form.reportValidity()) return;
    if (!this.rfc.trim() || !this.numeroTicket.trim()) {
      this.mostrarError('Capture RFC y número de ticket.');
      return;
    }
    this.cargando = true;
    this.facturacion.obtenerDatosFactura(this.rfc, this.numeroTicket).subscribe({
      next: (datos) => {
        this.cargando = false;
        const rfcCapturado = this.rfc.trim();
        this.store.guardar(datos, rfcCapturado);
        void this.router.navigate(['/datos-factura'], { state: { datos, rfcCapturado } });
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(this.mensajeError(e));
      },
    });
  }

  continuarConsulta(): void {
    const form = this.formConsulta?.nativeElement;
    if (form && !form.reportValidity()) return;
    const ticket = this.numeroTicketConsulta.trim();
    const correo = this.correoConsulta.trim();
    if (!ticket || !correo) {
      this.mostrarError('Capture el número de ticket y el correo electrónico.');
      return;
    }
    this.cargando = true;
    this.facturacion.reenviarFactura(correo, ticket).subscribe({
      next: () => {
        this.cargando = false;
        this.exitoMensaje = `La factura fue enviada nuevamente al correo ${correo}`;
        this.formConsulta?.nativeElement.reset();
        this.numeroTicketConsulta = '';
        this.correoConsulta = '';
      },
      error: (e: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(this.mensajeError(e));
      },
    });
  }

  mostrarAyudaTicket(): void {
    this.ayudaTicketVisible = true;
  }

  cerrarAyudaTicket(): void {
    this.ayudaTicketVisible = false;
  }

  cerrarError(): void {
    this.errorAbierto = false;
  }

  enviar(): void {
    this.continuar();
  }

  private mostrarError(mensaje: string): void {
    this.errorMensaje = mensaje;
    this.errorAbierto = true;
  }

  private mensajeError(e: HttpErrorResponse): string {
    const detail = (e?.error as { detail?: string; message?: string })?.detail
      ?? (e?.error as { message?: string })?.message;
    if (detail) return detail;
    if (e.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión.';
    if (e.status === 401) return 'No autorizado. Inicie sesión para continuar.';
    if (e.status === 403) return 'No tiene permisos para consultar esta información.';
    if (e.status === 404) return 'No se encontró información para el RFC y ticket capturados.';
    return 'No se pudo completar la solicitud. Intente de nuevo.';
  }
}
