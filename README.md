# Inventario Sopas Perico

Sistema web ligero para inventariar libros, con inicio de sesion y despliegue gratis en Vercel.

## Funciones principales

- Inicio de sesion con usuario demo.
- Alta, edicion y eliminacion de libros.
- Barra de busqueda optimizada (debounce + indice de busqueda).
- Filtros por categoria y estado.
- Ordenamiento por titulo, existencias y fecha.
- Metricas animadas (titulos, ejemplares y stock bajo).
- Importar y exportar inventario en JSON.
- Persistencia local con `localStorage`.

## Credenciales demo

- Usuario: `admin`
- Contrasena: `perico123`

## Estructura

- `index.html`: login + interfaz principal.
- `styles.css`: diseno responsive + animaciones.
- `app.js`: logica de sesion, CRUD, busqueda y filtros.
- `vercel.json`: configuracion minima para despliegue.

## Ejecutar localmente

Puedes abrir `index.html` directamente en tu navegador, o levantar un servidor estatico:

```powershell
python -m http.server 5500
```

Luego abre `http://localhost:5500`.

## Desplegar en Vercel (gratis)

1. Sube estos archivos a GitHub/GitLab/Bitbucket.
2. Entra a [https://vercel.com](https://vercel.com) e inicia sesion.
3. Haz clic en **Add New Project** y conecta tu repositorio.
4. Vercel detecta sitio estatico y lo publica automaticamente.
5. Obtendras una URL publica al finalizar.

## Nota

Los datos se guardan en el navegador del usuario.  
Si cambias de dispositivo, puedes recuperar datos usando importar/exportar JSON.
