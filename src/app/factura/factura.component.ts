import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { DatosFacturaStore } from '../facturacion/datos-factura.store';
import { DatosFacturaResponse, FacturacionService } from '../facturacion/facturacion.service';

@Component({
  selector: 'app-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.css'],
})
export class FacturaComponent implements OnInit {
  correo = '';
  mensajeExito = '';
  mensajeInfo = '';
  errorInfo = false;
  esConsulta = false;

  constructor(private router: Router, private store: DatosFacturaStore, private facturacion: FacturacionService) {}

  ngOnInit(): void {
    const state = history.state as { datos?: DatosFacturaResponse; correo?: string; mensajeExito?: string; origen?: string } | undefined;
    const datos = state?.datos ?? this.store.obtener() ?? null;
    this.correo = state?.correo?.trim() || datos?.cliente?.correoElectronico?.trim() || '';
    this.esConsulta = state?.origen === 'consulta';
    const ticket = datos?.numeroTicket?.trim() || '';
    this.mensajeExito = state?.mensajeExito?.trim() || (ticket ? `Factura generada con éxito para el ticket ${ticket}` : 'Factura generada con éxito');
  }

  get textoCorreo(): string {
    return this.esConsulta
      ? 'Ingresa el correo al que deseas enviar la factura nuevamente'
      : 'La factura fue enviada al correo electrónico ingresado';
  }

  get textoBotonEnviar(): string {
    return this.esConsulta ? 'Enviar' : 'Enviar nuevamente';
  }

  enviarNuevamente(): void {
    if (!this.correo.trim()) {
      this.mensajeInfo = 'Capture un correo electrónico para reenviar la factura.';
      this.errorInfo = false;
      return;
    }
    const datos = this.store.obtener();
    const ticket = datos?.numeroTicket?.trim() || '';
    this.facturacion.enviarCorreo(this.correo.trim(), ticket).subscribe({
      next: () => {
        this.mensajeInfo = `La factura fue enviada nuevamente a ${this.correo.trim()}`;
        this.errorInfo = false;
      },
      error: () => {
        this.mensajeInfo = 'Error al enviar la factura. Intenta de nuevo.';
        this.errorInfo = true;
      }
    });
  }

  descargarXml(): void {
    return;
  }

  descargarPdf(): void {
    return;
  }

  nuevaFactura(): void {
    this.store.limpiar();
    void this.router.navigate(['/']);
  }
}
