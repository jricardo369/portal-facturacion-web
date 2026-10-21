import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EnvioFacturaDialogComponent } from './envio-factura-dialog.component';

describe('EnvioFacturaDialogComponent', () => {
  let fixture: ComponentFixture<EnvioFacturaDialogComponent>;
  let componente: EnvioFacturaDialogComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvioFacturaDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnvioFacturaDialogComponent);
    componente = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('numeroTicket', '00001234');
    fixture.componentRef.setInput('correoInicial', 'cliente@ejemplo.com');
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('inicializa el correo enviado y el editable con el correo recibido', () => {
    expect(componente.correoEnviado()).toBe('cliente@ejemplo.com');
    expect(componente.correoEnvio()).toBe('cliente@ejemplo.com');
  });

  it('no reenvía si el correo no es válido', () => {
    componente.correoEnvio.set('correo-invalido');
    componente.reenviar();
    expect(componente.errorReenvio()).toContain('correo electrónico válido');
    httpMock.expectNone(() => true);
  });

  it('reenvía al correo capturado y confirma con mensaje', () => {
    componente.correoEnvio.set('otro@ejemplo.com');
    componente.reenviar();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/facturacion/reenviar-factura' && r.method === 'POST'
    );
    expect(req.request.body).toEqual({ correoElectronico: 'otro@ejemplo.com', numeroTicket: '00001234' });
    req.flush({ mensaje: 'ok', numeroTicket: '00001234' });

    expect(componente.enviando()).toBe(false);
    expect(componente.mensajeReenvio()).toContain('otro@ejemplo.com');
    expect(componente.correoEnviado()).toBe('otro@ejemplo.com');
  });

  it('resuelve el uuid por ticket antes de descargar el XML', () => {
    componente.descargar('xml');

    const consulta = httpMock.expectOne(
      (r) => r.url === '/api/v1/facturacion/factura' && r.method === 'GET'
    );
    expect(consulta.request.params.get('numeroTicket')).toBe('00001234');
    consulta.flush({ uuid: 'uuid-123', folio: 'F-1' });

    const descarga = httpMock.expectOne(
      (r) => r.url === '/api/v1/facturacion/factura/xml' && r.method === 'GET'
    );
    expect(descarga.request.params.get('uuid')).toBe('uuid-123');
    descarga.flush(new Blob(['<xml/>'], { type: 'application/xml' }));

    expect(componente.descargando()).toBe(false);
  });

  it('informa cuando la factura no tiene comprobante timbrado', () => {
    componente.descargar('pdf');

    const consulta = httpMock.expectOne(
      (r) => r.url === '/api/v1/facturacion/factura' && r.method === 'GET'
    );
    consulta.flush({ folio: 'F-1' });

    expect(componente.errorDescarga()).toContain('comprobante timbrado');
    expect(componente.descargando()).toBe(false);
  });
});
