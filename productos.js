// productos.js - Gestión de productos

function initProductosPage() {
    console.log('Inicializando página de productos');
    
    // Cargar lista de productos
    cargarProductos();
    
    // Configurar formulario de producto
    const productoForm = document.getElementById('productoForm');
    if (productoForm) {
        productoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarProducto();
        });
    }
}

// Cargar y mostrar la lista de productos
function cargarProductos() {
    const productosTable = document.getElementById('productosTable');
    if (!productosTable) return;
    
    const tbody = productosTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    
    getAllItems('productos')
        .then(productos => {
            if (productos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos registrados</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            productos.forEach(producto => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${producto.id}</td>
                    <td>${producto.nombre}</td>
                    <td>${producto.descripcion.substring(0, 50)}${producto.descripcion.length > 50 ? '...' : ''}</td>
                    <td>${producto.precio.toFixed(2)}</td>
                    <td>${producto.stock}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${producto.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${producto.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos</td></tr>';
        });
}

// Guardar o actualizar un producto
function guardarProducto() {
    // Obtener datos del formulario
    const productoId = document.getElementById('productoId').value;
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value)
    };
    
    // Validar datos
    if (isNaN(producto.precio) || producto.precio <= 0) {
        showAlert('warning', 'El precio debe ser un número mayor que cero');
        return;
    }
    
    if (isNaN(producto.stock) || producto.stock < 0) {
        showAlert('warning', 'El stock debe ser un número no negativo');
        return;
    }
    
    // Si hay ID, actualizar; sino, crear nuevo
    if (productoId && productoId !== '') {
        producto.id = parseInt(productoId);
        updateItem('productos', producto)
            .then(() => {
                showAlert('success', 'Producto actualizado con éxito');
                cerrarModalProducto();
                cargarProductos();
            })
            .catch(error => {
                console.error('Error al actualizar producto:', error);
                showAlert('danger', 'Error al actualizar el producto');
            });
    } else {
        addItem('productos', producto)
            .then(() => {
                showAlert('success', 'Producto agregado con éxito');
                cerrarModalProducto();
                cargarProductos();
            })
            .catch(error => {
                console.error('Error al agregar producto:', error);
                showAlert('danger', 'Error al agregar el producto');
            });
    }
}

// Editar un producto existente
function editarProducto(id) {
    getItemById('productos', id)
        .then(producto => {
            if (producto) {
                // Llenar formulario con datos del producto
                document.getElementById('productoId').value = producto.id;
                document.getElementById('nombre').value = producto.nombre;
                document.getElementById('descripcion').value = producto.descripcion;
                document.getElementById('precio').value = producto.precio.toFixed(2);
                document.getElementById('stock').value = producto.stock;
                
                // Mostrar modal
                const productoModal = new bootstrap.Modal(document.getElementById('productoModal'));
                productoModal.show();
            } else {
                showAlert('warning', 'Producto no encontrado');
            }
        })
        .catch(error => {
            console.error('Error al obtener producto:', error);
            showAlert('danger', 'Error al cargar los datos del producto');
        });
}

// Eliminar un producto
function eliminarProducto(id) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        // Verificar si el producto está en algún pedido
        getAllItems('detallesPedido')
            .then(detalles => {
                const detallesConProducto = detalles.filter(detalle => detalle.productoId === id);
                if (detallesConProducto.length > 0) {
                    showAlert('warning', 'No se puede eliminar el producto porque está incluido en pedidos');
                    return;
                }
                
                // Si no está en pedidos, proceder con la eliminación
                deleteItem('productos', id)
                    .then(() => {
                        showAlert('success', 'Producto eliminado con éxito');
                        cargarProductos();
                    })
                    .catch(error => {
                        console.error('Error al eliminar producto:', error);
                        showAlert('danger', 'Error al eliminar el producto');
                    });
            })
            .catch(error => {
                console.error('Error al verificar detalles de pedidos:', error);
                showAlert('danger', 'Error al verificar pedidos asociados');
            });
    }
}

// Cerrar modal y limpiar formulario
function cerrarModalProducto() {
    const productoForm = document.getElementById('productoForm');
    if (productoForm) productoForm.reset();
    document.getElementById('productoId').value = '';
    
    const productoModal = bootstrap.Modal.getInstance(document.getElementById('productoModal'));
    if (productoModal) productoModal.hide();
}

// Attach global functions to window object
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.initProductosPage = initProductosPage;