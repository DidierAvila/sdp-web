# SDP Web

SDP Web es una aplicación Angular para la gestión de clientes, órdenes y predicciones de ventas. Incluye visualización de datos, gráficos y administración de entidades clave para negocios comerciales.

## Funcionalidades principales
- Gestión de clientes: alta, edición, listado y consulta de órdenes por cliente.
- Gestión de órdenes: creación, edición, listado y detalles.
- Predicción de ventas: vista de predicciones y gráficos interactivos.
- Visualización de estadísticas y gráficos con D3.js.
- Interfaz moderna con Angular Material.

## Requisitos previos
- Node.js >= 18.x
- Angular CLI >= 20.x

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/DidierAvila/sdp-web.git
   cd sdp-web
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecución en desarrollo
```bash
ng serve
```
Accede a `http://localhost:4200/` en tu navegador.

## Scripts útiles
- `ng build` — Compila la aplicación para producción.
- `ng test` — Ejecuta pruebas unitarias.

## Estructura de carpetas
```
src/
  app/
    components/
      customer-list/         # Listado de clientes
      customer-form/         # Formulario de clientes
      customer-orders/       # Órdenes por cliente
      order-list/            # Listado de órdenes
      orders-view/           # Vista de órdenes
      order-form/            # Formulario de órdenes
      order-details/         # Detalles de orden
      sales-prediction/      # Predicción de ventas
      graphics/              # Gráficos y estadísticas
    models/                  # Modelos TypeScript
    services/                # Servicios REST
  public/                    # Archivos estáticos
```

## Principales rutas
- `/customers` — Listado de clientes
- `/customers/new` — Alta de cliente
- `/customers/:id/edit` — Edición de cliente
- `/customers/:id/orders` — Órdenes de un cliente
- `/orders` — Listado de órdenes
- `/predictions` — Predicción de ventas
- `/graphics` — Gráficos y estadísticas

## Stack tecnológico
- Angular 17+ (standalone components)
- Angular Material
- D3.js para gráficos
- RxJS
- TypeScript

## Contribuir
Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.

## Contacto
Desarrollador principal: Didier Avila

---
Para más información sobre Angular CLI, visita la [documentación oficial](https://angular.dev/tools/cli).
