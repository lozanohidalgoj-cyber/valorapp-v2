# 🎨 Interfaz de Usuario - ValorApp v2.0

## 📱 Pantallas Implementadas

### 1. **Pantalla Principal (Home)**
**Ruta**: `/`

**Descripción**: Pantalla de bienvenida que permite al usuario seleccionar entre gestión de Fraude o Avería.

**Características**:
- ✅ Diseño centrado vertical y horizontalmente
- ✅ Título principal: "Bienvenido a ValorApp" (color primario #0000D0)
- ✅ Subtítulo: "¿Qué tipo de gestión desea realizar?"
- ✅ Dos botones principales con iconos:
  - 🔍 Fraude
  - ⚙️ Avería
- ✅ Efectos hover suaves con transformación
- ✅ Sombras y animaciones profesionales
- ✅ Responsive: adapta a móviles y tablets

**Componente**: `src/pages/Home/Home.tsx`

---

### 2. **Pantalla de Selección de Tipo de Avería**
**Ruta**: `/averia`

**Descripción**: Permite seleccionar el tipo específico de avería para continuar el proceso de valoración.

**Características**:
- ✅ Logo/Título de la aplicación: "📊 ValorApp"
- ✅ Título de sección: "¿Qué tipo de gestión desea realizar?"
- ✅ Instrucciones claras para el usuario
- ✅ Tarjeta contenedora con fondo blanco y sombra
- ✅ Tres botones con iconos representativos:
  - ⚡ Wart
  - 🔧 Error de Montaje
  - ⚠️ Error de Avería
- ✅ Flechas animadas en cada botón (efecto hover)
- ✅ Botón "Volver atrás" con icono
- ✅ Separador visual entre opciones principales y botón volver
- ✅ Footer informativo

**Componente**: `src/pages/Averia/Averia.tsx`

---

## 🎨 Sistema de Diseño

### Colores Corporativos

```javascript
// Configuración en tailwind.config.js
colors: {
  'primary': '#0000D0',      // Azul corporativo
  'secondary': '#FF3184',    // Rosa vibrante
  'light-gray': '#F5F5F5',
  'medium-gray': '#D9D9D9',
  'dark-gray': '#333333',
}
```

### Tipografía

**Fuente principal**: Inter (sistema de respaldo incluido)

```css
font-family: 'Inter', system-ui, -apple-system, Avenir, Helvetica, Arial, sans-serif;
```

**Tamaños utilizados**:
- Título principal: `text-5xl` (60px) / `text-6xl` (72px) en desktop
- Subtítulo: `text-xl` (20px) / `text-2xl` (24px)
- Títulos de sección: `text-2xl` a `text-3xl`
- Botones: `text-lg` (18px)
- Texto informativo: `text-sm` (14px)

---

## 🧩 Componentes Reutilizables

### ButtonTailwind

**Ubicación**: `src/components/ButtonTailwind/ButtonTailwind.tsx`

**Uso**:
```tsx
import { ButtonTailwind } from '@/components';

// Botón primario
<ButtonTailwind variant="primary" size="large">
  Click me
</ButtonTailwind>

// Botón con iconos
<ButtonTailwind 
  variant="secondary" 
  iconLeft={<Icon />}
  iconRight={<ArrowIcon />}
>
  Continuar
</ButtonTailwind>

// Botón outline
<ButtonTailwind variant="outline" fullWidth>
  Cancelar
</ButtonTailwind>
```

**Props**:
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean
- `iconLeft`: ReactNode
- `iconRight`: ReactNode
- `disabled`: boolean

---

## 🚀 Navegación

**Router**: React Router DOM v6

### Rutas Configuradas

```tsx
/ → Home (Pantalla principal)
/averia → Averia (Selección de tipo de avería)
```

### Rutas Pendientes (TODO)

```tsx
/fraude → Pantalla de gestión de fraudes
/averia/wart → Detalle de Wart
/averia/montaje → Detalle de Error de Montaje
/averia/error → Detalle de Error de Avería
```

### Navegación Programática

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navegar a otra ruta
navigate('/averia');

// Volver atrás
navigate(-1);
// o
navigate('/');
```

---

## 🎯 Efectos y Animaciones

### Hover Effects

Todos los botones principales incluyen:
- ✅ Transformación en Y (-4px)
- ✅ Cambio de color de fondo
- ✅ Aumento de sombra
- ✅ Duración: 300ms
- ✅ Easing: cubic-bezier

### Iconos Animados

Las flechas en los botones de la pantalla de avería tienen:
- ✅ Translación en X (+8px) al hover
- ✅ Transición suave

### Focus States

Todos los botones incluyen:
- ✅ Ring de enfoque visible (accesibilidad)
- ✅ Grosor: 4px
- ✅ Opacidad: 50%
- ✅ Color según variante del botón

---

## 📐 Responsive Design

### Breakpoints Utilizados

```css
/* Mobile-first approach */
Base: < 640px (móvil)
sm: >= 640px (tablet pequeña)
md: >= 768px (tablet)
lg: >= 1024px (desktop pequeño)
xl: >= 1280px (desktop grande)
```

### Adaptaciones por Pantalla

**Home**:
- Móvil: Botones apilados verticalmente, título más pequeño
- Desktop: Botones horizontales, título grande

**Averia**:
- Móvil: Tarjeta ocupa 100% del ancho con padding reducido
- Desktop: Tarjeta centrada con max-width de 3xl

---

## ♿ Accesibilidad

### Implementaciones

- ✅ **Focus visible**: Todos los botones tienen ring de enfoque
- ✅ **Contraste de color**: Cumple WCAG 2.1 AA
- ✅ **Navegación por teclado**: Todos los botones son accesibles
- ✅ **Estados disabled**: Feedback visual claro
- ✅ **Iconos descriptivos**: Emojis para mejor comprensión

### Mejoras Futuras

- [ ] Atributos ARIA en botones
- [ ] Alt text en iconos SVG
- [ ] Skip navigation links
- [ ] Anuncios de cambio de ruta para lectores de pantalla

---

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 📦 Dependencias Nuevas

```json
{
  "dependencies": {
    "react-router-dom": "^6.x.x"  // Navegación entre páginas
  },
  "devDependencies": {
    "tailwindcss": "^3.x.x",       // Utility-first CSS
    "postcss": "^8.x.x",           // Procesador CSS
    "autoprefixer": "^10.x.x"      // Prefijos CSS automáticos
  }
}
```

---

## 🎨 Estructura de Archivos UI

```
src/
├── pages/
│   ├── Home/
│   │   ├── Home.tsx          # Pantalla principal
│   │   └── index.ts
│   ├── Averia/
│   │   ├── Averia.tsx        # Selección de tipo de avería
│   │   └── index.ts
│   └── index.ts              # Barrel export de páginas
│
├── components/
│   ├── ButtonTailwind/
│   │   ├── ButtonTailwind.tsx
│   │   └── index.ts
│   └── index.ts
│
├── App.tsx                   # Configuración de rutas
├── App.css                   # Animaciones personalizadas
└── index.css                 # Tailwind + variables CSS
```

---

## 📝 Convenciones de Código

### Nombres de Componentes
- PascalCase para componentes: `Home`, `Averia`, `ButtonTailwind`
- Archivos .tsx para componentes con JSX

### Estilos con Tailwind
- Utility classes directamente en JSX
- Clases condicionales con template literals
- Evitar inline styles salvo excepciones

### Comentarios
- JSDoc para componentes y funciones públicas
- Comentarios inline para lógica compleja
- Secciones marcadas con emojis para mejor navegación

---

## 🔄 Próximos Pasos

1. **Implementar pantalla de Fraude**
2. **Crear pantallas detalladas para cada tipo de avería**:
   - Wart
   - Error de Montaje
   - Error de Avería
3. **Agregar formularios de captura de datos**
4. **Integrar con servicios de análisis de consumo**
5. **Agregar breadcrumbs para navegación**
6. **Implementar modo oscuro (dark mode)**

---

**Última actualización**: 7 de noviembre de 2025  
**Versión**: 1.0.0  
**Desarrollado con**: React 19 + Vite + Tailwind CSS
