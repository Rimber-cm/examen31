// clientes.js - Gestión de clientes

function initClientesPage() {
    console.log('Inicializando página de clientes');
    // Cargar lista de clientes
    cargarClientes();
  
    // Configurar formulario de cliente
    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) {
      clienteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarCliente();
      });
    }
  }
  
  // Cargar y mostrar la lista de clientes
  function cargarClientes() {
    const clientesTable = document.getElementById('clientesTable');
    if (!clientesTable) return;
    const tbody = clientesTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
  
    getAllItems('clientes')
      .then(clientes => {
        if (clientes.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay clientes registrados</td></tr>';
          return;
        }
  
        tbody.innerHTML = '';
        clientes.forEach(cliente => {
          const row = document.createElement('tr');
          row.innerHTML = `
                      <td>${cliente.id}</td>
                      <td>${cliente.nombre}</td>
                      <td>${cliente.email}</td>
                      <td>${cliente.telefono}</td>
                      <td>
                          <button class="btn btn-sm btn-outline-primary me-1" onclick="editarCliente(${cliente.id})">
                              <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-danger" onclick="eliminarCliente(${cliente.id})">
                              <i class="fas fa-trash"></i>
                          </button>
                      </td>
                  `;
          tbody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Error al cargar clientes:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>';
      });
  }
  
  // Guardar o actualizar un cliente
  function guardarCliente() {
    console.log("guardarCliente: Inicio"); // <--- INICIO
  
    // Obtener datos del formulario
    const clienteId = document.getElementById('clienteId').value;
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
  
    const cliente = {
      nombre: document.getElementById('nombre').value.trim(),
      email: email,
      telefono: document.getElementById('telefono').value.trim(),
      direccion: document.getElementById('direccion').value.trim()
    };
  
    console.log("guardarCliente: Datos obtenidos -", { clienteId, email, cliente }); // <--- DATOS
  
    // Validación del email en el cliente
    if (!email) {
      console.log("guardarCliente: Email vacío"); // <--- IF 1
      showAlert('danger', 'El email es requerido');
      emailInput.classList.add('is-invalid');
      return;
    }
    console.log("guardarCliente: Email no vacío"); // <--- ELSE 1
  
    if (!isValidEmail(email)) {
      console.log("guardarCliente: Email inválido"); // <--- IF 2
      showAlert('danger', 'Por favor ingrese un email válido (ejemplo: usuario@dominio.com)');
      emailInput.classList.add('is-invalid');
      return;
    } else {
      console.log("guardarCliente: Email válido"); // <--- ELSE 2
      emailInput.classList.remove('is-invalid');
    }
  
    // Resto de la lógica de guardado...
    if (clienteId && clienteId !== '') {
      console.log("guardarCliente: Actualizar cliente"); // <--- IF 3
      cliente.id = parseInt(clienteId);
      updateItem('clientes', cliente)
        .then(() => {
          showAlert('success', 'Cliente actualizado con éxito');
          cerrarModalCliente();
          cargarClientes();
        })
        .catch(error => {
          console.error('Error al actualizar cliente:', error);
          showAlert('danger', 'Error al actualizar el cliente');
        });
    } else {
      console.log("guardarCliente: Agregar cliente"); // <--- ELSE 3
      addItem('clientes', cliente)
        .then(() => {
          showAlert('success', 'Cliente agregado con éxito');
          cerrarModalCliente();
          cargarClientes();
        })
        .catch(error => {
          console.error('Error al agregar cliente:', error);
          if (error.name === 'ConstraintError') {
            showAlert('danger', 'El email ya está registrado');
            emailInput.classList.add('is-invalid');
          } else {
            showAlert('danger', 'Error al agregar el cliente');
          }
        });
    }
    console.log("guardarCliente: Fin"); // <--- FIN
  }
  
  // Editar un cliente existente
  function editarCliente(id) {
    getItemById('clientes', id)
      .then(cliente => {
        if (cliente) {
          // Llenar formulario con datos del cliente
          document.getElementById('clienteId').value = cliente.id;
          document.getElementById('nombre').value = cliente.nombre;
          document.getElementById('email').value = cliente.email;
          document.getElementById('telefono').value = cliente.telefono;
          document.getElementById('direccion').value = cliente.direccion || '';
  
          // Mostrar modal
          const clienteModal = new bootstrap.Modal(document.getElementById('clienteModal'));
          clienteModal.show();
        } else {
          showAlert('warning', 'Cliente no encontrado');
        }
      })
      .catch(error => {
        console.error('Error al obtener cliente:', error);
        showAlert('danger', 'Error al cargar los datos del cliente');
      });
  }
  
  // Eliminar un cliente
  function eliminarCliente(id) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      // Primero verificar si tiene pedidos asociados
      getItemsByIndex('pedidos', 'clienteId', id)
        .then(pedidos => {
          if (pedidos.length > 0) {
            showAlert('warning', 'No se puede eliminar el cliente porque tiene pedidos asociados');
            return;
          }
  
          // Si no tiene pedidos, proceder con la eliminación
          deleteItem('clientes', id)
            .then(() => {
              showAlert('success', 'Cliente eliminado con éxito');
              cargarClientes();
            })
            .catch(error => {
              console.error('Error al eliminar cliente:', error);
              showAlert('danger', 'Error al eliminar el cliente');
            });
        })
        .catch(error => {
          console.error('Error al verificar pedidos:', error);
          showAlert('danger', 'Error al verificar pedidos asociados');
        });
    }
  }
  
  // Cerrar modal y limpiar formulario
  function cerrarModalCliente() {
    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) clienteForm.reset();
    document.getElementById('clienteId').value = '';
  
    const clienteModal = bootstrap.Modal.getInstance(document.getElementById('clienteModal'));
    if (clienteModal) clienteModal.hide();
  }
  
  // Simple email validation (for demonstration)
  function isValidEmail(email) {
    if (!email) return false;
    return email.includes('@') && email.includes('.');
  }
  
  // Attach global functions to window object
  window.editarCliente = editarCliente;
  window.eliminarCliente = eliminarCliente;
  window.initClientesPage = initClientesPage;