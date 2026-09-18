import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { FooterComponent } from '../layout/footer/footer.component';
import { FacturasService, FacturaEmitida, DatosRefacturacion } from '../admin/facturas.service';

@Component({
  selector: 'app-refacturar',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './refacturar.component.html',
  styleUrls: ['./refacturar.component.css'],
})
export class RefacturarComponent {
  paso = 1;
  busqueda = '';
  error = '';
  encontrada?: FacturaEmitida;
  nueva?: FacturaEmitida;
  datos: DatosRefacturacion = { cliente: '', rfc: '', correo: '', regimen: '', uso: '', motivo: 'Error en RFC / Razón social' };

  constructor(private svc: FacturasService, private router: Router) {}

  buscar(): void {
    this.error = '';
    this.encontrada = undefined;
    const f = this.svc.buscar(this.busqueda);
    if (!f) {
      this.error = 'No se encontró factura vigente con ese folio, ticket o UUID.';
      return;
    }
    if (f.estado === 'Cancelada') {
      this.error = `La factura ${f.folio} ya está cancelada.`;
      return;
    }
    this.encontrada = f;
    this.datos = { ...this.datos, cliente: f.cliente, rfc: f.rfc };
    this.paso = 2;
  }

  generar(): void {
    if (!this.encontrada) return;
    if (!this.datos.cliente.trim() || !this.datos.rfc.trim() || !this.datos.correo.trim() || !this.datos.regimen || !this.datos.uso) {
      this.error = 'Capture los campos obligatorios de la nueva factura.';
      return;
    }
    this.error = '';
    this.nueva = this.svc.refacturar(this.encontrada, this.datos);
    this.paso = 3;
  }

  reiniciar(): void {
    this.paso = 1;
    this.busqueda = '';
    this.encontrada = undefined;
    this.nueva = undefined;
    this.error = '';
  }

  salir(): void {
    void this.router.navigate(['/admin']);
  }
}
