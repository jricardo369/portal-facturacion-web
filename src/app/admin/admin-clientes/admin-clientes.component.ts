import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LoadingOverlayComponent } from '../../shared/loading-overlay.component';
import { ErrorDialogComponent } from '../../shared/error-dialog.component';
import { ClientesService, ClienteItem } from '../clientes.service';
import { ClienteDialogComponent } from './cliente-dialog.component';
import { AdminAuthService } from '../auth.service';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, LoadingOverlayComponent, ErrorDialogComponent, ClienteDialogComponent],
  templateUrl: './admin-clientes.component.html',
  styleUrls: ['./admin-clientes.component.css'],
})
export class AdminClientesComponent implements OnInit {
  clientes: ClienteItem[] = [];
  rfc = '';
  razonSocial = '';
  codigoPostal = '';
  pagina = 1;
  porPagina = 20;
  totalElementos = 0;
  cargando = false;
  error = '';
  clienteSeleccionado?: ClienteItem;
  private totalPaginasApi = 1;
  private cargaId = 0;

  constructor(
    private svc: ClientesService,
    private auth: AdminAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get totalPaginas(): number {
    return this.totalPaginasApi;
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get rango(): string {
    if (this.totalElementos === 0) return '0 de 0';
    const inicio = (this.pagina - 1) * this.porPagina + 1;
    const fin = Math.min(this.pagina * this.porPagina, this.totalElementos);
    return `${inicio}–${fin} de ${this.totalElementos}`;
  }

  get activos(): number {
    return this.clientes.filter((c) => c.estatus).length;
  }

  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas && p !== this.pagina) {
      this.pagina = p;
      this.cargar();
    }
  }

  buscar(): void {
    this.pagina = 1;
    this.cargar();
  }

  salir(): void {
    this.auth.logout();
    void this.router.navigate(['/admin']);
  }

  verDetalle(c: ClienteItem): void {
    this.clienteSeleccionado = c;
  }

  limpiar(): void {
    this.rfc = '';
    this.razonSocial = '';
    this.codigoPostal = '';
    this.pagina = 1;
    this.cargar();
  }

  cargar(): void {
    const id = ++this.cargaId;
    this.cargando = true;
    this.error = '';
    this.svc
      .obtenerClientes(this.rfc, this.razonSocial, this.codigoPostal, this.pagina - 1, this.porPagina)
      .subscribe({
        next: (res) => {
          if (id !== this.cargaId) return;
          this.clientes = res.content ?? [];
          this.totalElementos = res.totalElements ?? 0;
          this.totalPaginasApi = Math.max(1, res.totalPages ?? 1);
          if (this.pagina > this.totalPaginasApi) this.pagina = this.totalPaginasApi;
          this.cargando = false;
        },
        error: () => {
          if (id !== this.cargaId) return;
          this.clientes = [];
          this.totalElementos = 0;
          this.cargando = false;
          this.error = 'No se pudieron cargar los clientes. Verifica la conexión e intenta de nuevo.';
        },
      });
  }

  formatearFecha(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}