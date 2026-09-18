import { Routes } from '@angular/router';
import { BienvenidaComponent } from './bienvenida/bienvenida.component';
import { FacturarComponent } from './facturar/facturar.component';
import { RefacturarComponent } from './refacturar/refacturar.component';
import { DatosFacturaComponent } from './datos-factura/datos-factura.component';
import { FacturaComponent } from './factura/factura.component';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { AdminFacturasComponent } from './admin/admin-facturas/admin-facturas.component';
import { adminGuard } from './admin/auth.guard';
import { AvisoPrivacidadComponent } from './aviso-privacidad/aviso-privacidad.component';

export const routes: Routes = [
  { path: '', component: BienvenidaComponent, title: 'Bienvenido al Servicio de Facturación Electrónica' },
  { path: 'bienvenida', component: BienvenidaComponent, title: 'Bienvenido al Servicio de Facturación Electrónica' },
  { path: 'facturar', component: FacturarComponent, data: { tab: 'facturar' }, title: 'Servicio de facturación en línea' },
  { path: 'refacturar', component: RefacturarComponent, title: 'Refacturación de factura' },
  { path: 'datos-factura', component: DatosFacturaComponent, title: 'Capture la información solicitada' },
  { path: 'factura', component: FacturaComponent, title: 'Factura' },
  { path: 'admin', component: AdminLoginComponent, title: 'Administración' },
  { path: 'admin/facturas', component: AdminFacturasComponent, canActivate: [adminGuard], title: 'Facturas emitidas' },
  { path: 'aviso-privacidad', component: AvisoPrivacidadComponent, title: 'Aviso de privacidad' },
  { path: '**', redirectTo: '' },
];
