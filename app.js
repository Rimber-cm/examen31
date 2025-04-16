// app.js - Archivo principal de la aplicación

// Inicializar la base de datos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando la aplicación PoleraTech...');
  initDB()
      .then(() => {
          // Determinar la página actual e inicializar su funcionalidad específica
          const currentPage = getCurrentPage();
          console.log('Página actual:', currentPage);
          
          // Cargar datos iniciales si es necesario (solo en desarrollo)
          // loadSampleData();
          
          // Inicializar funcionalidad según la página actual
          switch (currentPage) {
              case 'index':
                  initHomePage();
                  break;
              case 'productos':
                  initProductosPage();
                  break;
              case 'clientes':
                  initClientesPage();
                  break;
              case 'pedidos':
                  initPedidosPage();
                  break;
          }
          
          // Inicializar funcionalidad común
          setupLoginModal();
      })
      .catch(error => {
          console.error('Error al inicializar la base de datos:', error);
          showError('Error al inicializar la aplicación. Por favor, recarga la página.');
      });
});

// Determinar la página actual basado en la URL
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('productos.html')) return 'productos';
  if (path.includes('clientes.html')) return 'clientes';
  if (path.includes('pedidos.html')) return 'pedidos';
  return 'index'; // Página por defecto
}

// Configurar el modal de inicio de sesión
function setupLoginModal() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          // Aquí podrías implementar la autenticación real
          // Por ahora simulamos un inicio de sesión exitoso
          console.log('Inicio de sesión:', email, password);
          
          // Simular un inicio de sesión exitoso
          showAlert('success', 'Inicio de sesión exitoso!');
          
          // Cerrar el modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
          modal.hide();
      });
  }
}

// Mostrar mensaje de alerta
function showAlert(type, message, duration = 3000) {
  // Crear el elemento de alerta
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  
  // Agregar mensaje y botón de cierre
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Agregar al cuerpo del documento
  document.body.appendChild(alertDiv);
  
  // Remover después de un tiempo
  setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 300);
  }, duration);
}

function showError(message) {
  showAlert('danger', message, 5000);
}

// Inicialización básica de la página de inicio
function initHomePage() {
  console.log('Inicializando página de inicio');
  
  // Botón para mostrar productos
  const showProductsBtn = document.getElementById('showProductsBtn');
  if (showProductsBtn) {
      showProductsBtn.addEventListener('click', () => {
          window.location.href = 'productos.html';
      });
  }
}

// Cargar datos de muestra (solo para desarrollo)
function loadSampleData() {
  // Verificar si ya hay datos
  getAllItems('productos').then(productos => {
      if (productos.length === 0) {
          // Agregar productos de muestra
          const sampleProductos = [
              { nombre: 'Polera Basic', descripcion: 'Polera básica de algodón', precio: 150, stock: 50 },
              { nombre: 'Polera Sport', descripcion: 'Polera deportiva con tecnología dri-fit', precio: 200, stock: 30 },
              { nombre: 'Polera Vintage', descripcion: 'Polera estilo retro', precio: 180, stock: 25 }
          ];
          
          sampleProductos.forEach(producto => addItem('productos', producto));
          console.log('Productos de muestra agregados');
      }
  });
  
  getAllItems('clientes').then(clientes => {
      if (clientes.length === 0) {
          // Agregar clientes de muestra
          const sampleClientes = [
              { nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '70123456', direccion: 'Calle 1 #123' },
              { nombre: 'María López', email: 'maria@example.com', telefono: '71234567', direccion: 'Av. Principal #456' }
          ];
          
          sampleClientes.forEach(cliente => addItem('clientes', cliente));
          console.log('Clientes de muestra agregados');
      }
  });
}