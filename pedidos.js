// pedidos.js - Gestión de pedidos

function initPedidosPage() {
    console.log('Inicializando página de pedidos');
    
    // Cargar lista de pedidos
    cargarPedidos();
    
    // Cargar clientes y productos en el formulario
    cargarClientesSelect();
    
    // Configurar formulario de pedido
    const pedidoForm = document.getElementById('pedidoForm');
    if (pedidoForm) {
        pedidoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarPedido();
        });
        
        // Establecer fecha actual por defecto
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            const hoy = new Date();
            const fechaFormateada = hoy.toISOString().split('T')[0];
            fechaInput.value = fechaFormateada;
        }
    }
    
    // Agregar primera línea de producto al abrir el modal de nuevo pedido
    const pedidoModal = document.getElementById('pedidoModal');
    if (pedidoModal) {
        pedidoModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const action = button.getAttribute('data-action') || '';
            
            if (action !== 'edit') {
                document.getElementById('pedidoId').value = '';
                document.getElementById('pedidoForm').reset();
                document.getElementById('itemsPedido').innerHTML = '';
                document.getElementById('totalPedido').textContent = '0.00 Bs';
                
                // Establecer fecha actual
                const hoy = new Date();
                const fechaFormateada = hoy.toISOString().split('T')[0];
                document.getElementById('fecha').value = fechaFormateada;
                
                // Agregar primera línea de producto
                agregarLineaProducto();
            }
        });
    }
}

// Cargar y mostrar la lista de pedidos
function cargarPedidos() {
    const pedidosTable = document.getElementById('pedidosTable');
    if (!pedidosTable) return;
    
    const tbody = pedidosTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';
    
    getAllItems('pedidos')
        .then(pedidos => {
            if (pedidos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pedidos registrados</td></tr>';
                return;
            }
            
            // Ordenar pedidos por fecha (más recientes primero)
            pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            // Obtener información de clientes para mostrar nombres
            getAllItems('clientes').then(clientes => {
                const clientesMap = {};
                clientes.forEach(cliente => {
                    clientesMap[cliente.id] = cliente.nombre;
                });
                
                tbody.innerHTML = '';
                pedidos.forEach(pedido => {
                    const nombreCliente = clientesMap[pedido.clienteId] || 'Cliente desconocido';
                    const fechaFormateada = new Date(pedido.fecha).toLocaleDateString();
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${pedido.id}</td>
                        <td>${nombreCliente}</td>
                        <td>${fechaFormateada}</td>
                        <td>${pedido.total.toFixed(2)}</td>
                        <td>
                            <span class="badge ${getBadgeClass(pedido.estado)}">${pedido.estado}</span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetallePedido(${pedido.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="editarPedido(${pedido.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPedido(${pedido.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar pedidos:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos</td></tr>';
        });
}

// Determinar la clase de Bootstrap para el badge según el estado
function getBadgeClass(estado) {
    switch (estado) {
        case 'Pendiente': return 'bg-warning text-dark';
        case 'En proceso': return 'bg-info text-dark';
        case 'Completado': return 'bg-success';
        case 'Cancelado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// Cargar clientes en el select del formulario
function cargarClientesSelect() {
    const clienteSelect = document.getElementById('clienteId');
    if (!clienteSelect) return;
    
    // Limpiar opciones actuales
    clienteSelect.innerHTML = '<option value="" disabled selected>Seleccione un cliente</option>';
    
    getAllItems('clientes')
        .then(clientes => {
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.nombre} (${cliente.email})`;
                clienteSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar clientes:', error);
            showAlert('danger', 'Error al cargar la lista de clientes');
        });
}

// Cargar productos en el select de una línea
function cargarProductosSelect(selectElement) {
    if (!selectElement) return;
    
    // Limpiar opciones actuales
    selectElement.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
    
    getAllItems('productos')
        .then(productos => {
            productos.forEach(producto => {
                if (producto.stock > 0) {
                    const option = document.createElement('option');
                    option.value = producto.id;
                    option.textContent = `${producto.nombre} - ${producto.precio.toFixed(2)} Bs`;
                    option.dataset.precio = producto.precio;
                    option.dataset.stock = producto.stock;
                    selectElement.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
        });
}

// Agregar una nueva línea de producto al formulario
function agregarLineaProducto() {
    const itemsContainer = document.getElementById('itemsPedido');
    if (!itemsContainer) return;
    
    const lineaIndex = document.querySelectorAll('.linea-producto').length;
    const lineaId = `linea-${Date.now()}-${lineaIndex}`;
    
    const lineaDiv = document.createElement('div');
    lineaDiv.className = 'linea-producto row mb-2 align-items-center';
    lineaDiv.id = lineaId;
    lineaDiv.innerHTML = `
        <div class="col-md-5">
            <select class="form-select producto-select" name="producto[]" required
                    onchange="actualizarPrecioProducto(this)">
                <option value="" disabled selected>Seleccione un producto</option>
            </select>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control precio-unitario" name="precio[]"
                   readonly placeholder="Precio">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control cantidad" name="cantidad[]" min="1"
                   value="1" onchange="actualizarSubtotal(this)" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control subtotal" name="subtotal[]"
                   readonly placeholder="Subtotal">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarLineaProducto('${lineaId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    itemsContainer.appendChild(lineaDiv);
    
    // Cargar productos en el select recién creado
    const productoSelect = lineaDiv.querySelector('.producto-select');
    cargarProductosSelect(productoSelect);
}

// Actualizar precio unitario al seleccionar un producto
function actualizarPrecioProducto(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const lineaDiv = selectElement.closest('.linea-producto');
    
    const precioInput = lineaDiv.querySelector('.precio-unitario');
    const cantidadInput = lineaDiv.querySelector('.cantidad');
    const subtotalInput = lineaDiv.querySelector('.subtotal');
    
    if (selectedOption && selectedOption.dataset.precio) {
        const precio = parseFloat(selectedOption.dataset.precio);
        const stock = parseInt(selectedOption.dataset.stock);
        
        precioInput.value = precio.toFixed(2);
        
        // Limitar cantidad al stock disponible
        cantidadInput.max = stock;
        cantidadInput.value = 1;
        
        // Actualizar subtotal
        const cantidad = parseInt(cantidadInput.value);
        subtotalInput.value = (precio * cantidad).toFixed(2);
        
        // Actualizar total general
        actualizarTotalPedido();
    } else {
        precioInput.value = '';
        subtotalInput.value = '';
    }
}

// Actualizar subtotal al cambiar la cantidad
function actualizarSubtotal(cantidadInput) {
    const lineaDiv = cantidadInput.closest('.linea-producto');
    const precioInput = lineaDiv.querySelector('.precio-unitario');
    const subtotalInput = lineaDiv.querySelector('.subtotal');
    
    if (precioInput.value && cantidadInput.value) {
        const precio = parseFloat(precioInput.value);
        const cantidad = parseInt(cantidadInput.value);
        
        if (cantidad > 0) {
            subtotalInput.value = (precio * cantidad).toFixed(2);
            actualizarTotalPedido();
        }
    }
}

// Actualizar el total del pedido
function actualizarTotalPedido() {
    const subtotales = document.querySelectorAll('.subtotal');
    let total = 0;
    
    subtotales.forEach(input => {
        if (input.value) {
            total += parseFloat(input.value);
        }
    });
    
    const totalPedidoElement = document.getElementById('totalPedido');
    if (totalPedidoElement) {
        totalPedidoElement.textContent = `${total.toFixed(2)} Bs`;
    }
}

// Eliminar una línea de producto
function eliminarLineaProducto(lineaId) {
    const lineaDiv = document.getElementById(lineaId);
    if (lineaDiv) {
        lineaDiv.remove();
        actualizarTotalPedido();
        
        // Si no quedan líneas, agregar una nueva
        const lineas = document.querySelectorAll('.linea-producto');
        if (lineas.length === 0) {
            agregarLineaProducto();
        }
    }
}

// Guardar o actualizar un pedido
function guardarPedido() {
    // Obtener datos básicos del pedido
    const pedidoId = document.getElementById('pedidoId').value;
    const clienteId = parseInt(document.getElementById('clienteId').value);
    const fecha = document.getElementById('fecha').value;
    const estado = document.getElementById('estado').value;
    
    // Obtener líneas de productos
    const lineasProducto = document.querySelectorAll('.linea-producto');
    const detalles = [];
    let total = 0;
    
    // Validar que haya al menos un producto
    if (lineasProducto.length === 0) {
        showAlert('warning', 'Debe agregar al menos un producto al pedido');
        return;
    }
    
    // Recopilar detalles y validar
    let esValido = true;
    lineasProducto.forEach(linea => {
        const productoSelect = linea.querySelector('.producto-select');
        const productoId = parseInt(productoSelect.value);
        const precioUnitario = parseFloat(linea.querySelector('.precio-unitario').value);
        const cantidad = parseInt(linea.querySelector('.cantidad').value);
        const subtotal = parseFloat(linea.querySelector('.subtotal').value);
        
        if (!productoId || isNaN(productoId)) {
            showAlert('warning', 'Seleccione un producto en todas las líneas');
            esValido = false;
            return;
        }
        
        if (!cantidad || cantidad <= 0) {
            showAlert('warning', 'La cantidad debe ser mayor que cero');
            esValido = false;
            return;
        }
        
        detalles.push({
            productoId,
            precioUnitario,
            cantidad,
            subtotal
        });
        
        total += subtotal;
    });
    
    if (!esValido) return;
    
    // Crear objeto pedido
    const pedido = {
        clienteId,
        fecha,
        estado,
        total,
    };
    
    // Si es edición, incluir el ID
    if (pedidoId && pedidoId !== '') {
        pedido.id = parseInt(pedidoId);
        
        // Actualizar pedido existente
        updateItem('pedidos', pedido)
            .then(() => {
                // Eliminar detalles antiguos
                return new Promise((resolve, reject) => {
                    getAllItems('detallesPedido')
                        .then(todosDetalles => {
                            const detallesAEliminar = todosDetalles.filter(d => d.pedidoId === pedido.id);
                            const promesas = detallesAEliminar.map(d => deleteItem('detallesPedido', d.id));
                            
                            Promise.all(promesas)
                                .then(() => resolve())
                                .catch(error => reject(error));
                        })
                        .catch(error => reject(error));
                });
            })
            .then(() => {
                // Agregar nuevos detalles
                const promesas = detalles.map(detalle => {
                    detalle.pedidoId = pedido.id;
                    return addItem('detallesPedido', detalle);
                });
                
                return Promise.all(promesas);
            })
            .then(() => {
                // Actualizar stock de productos
                return actualizarStockProductos(detalles);
            })
            .then(() => {
                showAlert('success', 'Pedido actualizado con éxito');
                cerrarModalPedido();
                cargarPedidos();
            })
            .catch(error => {
                console.error('Error al actualizar pedido:', error);
                showAlert('danger', 'Error al actualizar el pedido');
            });
    } else {
        // Crear nuevo pedido
        addItem('pedidos', pedido)
            .then(pedidoId => {
                // Agregar detalles
                const promesas = detalles.map(detalle => {
                    detalle.pedidoId = pedidoId;
                    return addItem('detallesPedido', detalle);
                });
                
                return Promise.all(promesas).then(() => pedidoId);
            })
            .then(pedidoId => {
                // Actualizar stock de productos
                return actualizarStockProductos(detalles).then(() => pedidoId);
            })
            .then(() => {
                showAlert('success', 'Pedido creado con éxito');
                cerrarModalPedido();
                cargarPedidos();
            })
            .catch(error => {
                console.error('Error al crear pedido:', error);
                showAlert('danger', 'Error al crear el pedido');
            });
    }
}

// Actualizar stock de productos después de un pedido
function actualizarStockProductos(detalles) {
    const productosPromesas = detalles.map(detalle => {
        return getItemById('productos', detalle.productoId)
            .then(producto => {
                if (producto) {
                    // Restar la cantidad del stock
                    producto.stock -= detalle.cantidad;
                    if (producto.stock < 0) producto.stock = 0;
                    
                    // Actualizar el producto
                    return updateItem('productos', producto);
                }
            });
    });
    
    return Promise.all(productosPromesas);
}

// Ver detalle de un pedido
function verDetallePedido(id) {
    Promise.all([
        getItemById('pedidos', id),
        getAllItems('detallesPedido'),
        getAllItems('productos'),
        getAllItems('clientes')
    ])
    .then(([pedido, todosDetalles, productos, clientes]) => {
        if (!pedido) {
            showAlert('warning', 'Pedido no encontrado');
            return;
        }
        
        // Obtener cliente
        const cliente = clientes.find(c => c.id === pedido.clienteId);
        
        // Obtener detalles de este pedido
        const detallesPedido = todosDetalles.filter(d => d.pedidoId === pedido.id);
        
        // Crear un mapa de productos para acceso rápido
        const productosMap = {};
        productos.forEach(p => {
            productosMap[p.id] = p;
        });
        
        // Crear contenido HTML para el modal
        let detallesHTML = '';
        detallesPedido.forEach(detalle => {
            const producto = productosMap[detalle.productoId];
            if (producto) {
                detallesHTML += `
                    <tr>
                        <td>${producto.nombre}</td>
                        <td>${detalle.precioUnitario.toFixed(2)} Bs</td>
                        <td>${detalle.cantidad}</td>
                        <td>${detalle.subtotal.toFixed(2)} Bs</td>
                    </tr>
                `;
            }
        });
        
        // Crear modal dinámicamente
        const modalHTML = `
            <div class="modal fade" id="detallePedidoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle de Pedido #${pedido.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Cliente:</strong> ${cliente ? cliente.nombre : 'Desconocido'}
                                </div>
                                <div class="col-md-6">
                                    <strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Estado:</strong> 
                                    <span class="badge ${getBadgeClass(pedido.estado)}">${pedido.estado}</span>
                                </div>
                                <div class="col-md-6">
                                    <strong>Total:</strong> ${pedido.total.toFixed(2)} Bs
                                </div>
                            </div>
                            
                            <h6 class="mt-4 mb-2">Productos</h6>
                            <div class="table-responsive">
                                <table class="table table-bordered">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Producto</th>
                                            <th>Precio Unitario</th>
                                            <th>Cantidad</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detallesHTML}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="3" class="text-end">Total:</th>
                                            <th>${pedido.total.toFixed(2)} Bs</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al cuerpo del documento
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('detallePedidoModal'));
        modal.show();
        
        // Eliminar modal del DOM cuando se cierre
        document.getElementById('detallePedidoModal').addEventListener('hidden.bs.modal', function () {
            document.body.removeChild(modalContainer);
        });
    })
    .catch(error => {
        console.error('Error al cargar detalles del pedido:', error);
        showAlert('danger', 'Error al cargar los detalles del pedido');
    });
}

// Editar un pedido existente
function editarPedido(id) {
    Promise.all([
        getItemById('pedidos', id),
        getAllItems('detallesPedido'),
        getAllItems('productos')
    ])
    .then(([pedido, todosDetalles, productos]) => {
        if (!pedido) {
            showAlert('warning', 'Pedido no encontrado');
            return;
        }
        
        // Llenar el formulario con los datos del pedido
        document.getElementById('pedidoId').value = pedido.id;
        document.getElementById('clienteId').value = pedido.clienteId;
        document.getElementById('fecha').value = pedido.fecha;
        document.getElementById('estado').value = pedido.estado;
        
        // Limpiar líneas de productos actuales
        document.getElementById('itemsPedido').innerHTML = '';
        
        // Obtener detalles de este pedido
        const detallesPedido = todosDetalles.filter(d => d.pedidoId === pedido.id);
        
        // Crear un mapa de productos para acceso rápido
        const productosMap = {};
        productos.forEach(p => {
            productosMap[p.id] = p;
        });
        
        // Si no hay detalles, agregar una línea vacía
        if (detallesPedido.length === 0) {
            agregarLineaProducto();
        } else {
            // Agregar una línea por cada detalle
            detallesPedido.forEach((detalle, index) => {
                agregarLineaProducto();
                
                // Obtener la línea recién agregada (la última)
                const lineas = document.querySelectorAll('.linea-producto');
                const lineaActual = lineas[lineas.length - 1];
                
                // Llenar datos
                const productoSelect = lineaActual.querySelector('.producto-select');
                
                // Esperar a que se carguen los productos en el select
                const checkSelectLoaded = setInterval(() => {
                    if (productoSelect.options.length > 1) {
                        clearInterval(checkSelectLoaded);
                        
                        // Seleccionar el producto
                        productoSelect.value = detalle.productoId;
                        
                        // Establecer precio, cantidad y subtotal
                        lineaActual.querySelector('.precio-unitario').value = detalle.precioUnitario.toFixed(2);
                        lineaActual.querySelector('.cantidad').value = detalle.cantidad;
                        lineaActual.querySelector('.subtotal').value = detalle.subtotal.toFixed(2);
                        
                        // Actualizar total
                        actualizarTotalPedido();
                    }
                }, 100);
            });
        }
        
        // Mostrar modal
        const pedidoModal = new bootstrap.Modal(document.getElementById('pedidoModal'));
        pedidoModal.show();
    })
    .catch(error => {
        console.error('Error al cargar datos para editar pedido:', error);
        showAlert('danger', 'Error al cargar los datos del pedido');
    });
}

// Eliminar un pedido
function eliminarPedido(id) {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
        // Primero, obtener todos los detalles del pedido
        getAllItems('detallesPedido')
            .then(todosDetalles => {
                // Filtrar los detalles que pertenecen a este pedido
                const detallesPedido = todosDetalles.filter(d => d.pedidoId === id);
                
                // Eliminar cada detalle
                const promesasEliminarDetalles = detallesPedido.map(detalle => deleteItem('detallesPedido', detalle.id));
                
                return Promise.all(promesasEliminarDetalles);
            })
            .then(() => {
                // Una vez eliminados los detalles, eliminar el pedido
                return deleteItem('pedidos', id);
            })
            .then(() => {
                showAlert('success', 'Pedido eliminado con éxito');
                cargarPedidos();
            })
            .catch(error => {
                console.error('Error al eliminar pedido:', error);
                showAlert('danger', 'Error al eliminar el pedido');
            });
    }
}

// Cerrar modal y limpiar formulario
function cerrarModalPedido() {
    document.getElementById('pedidoForm').reset();
    document.getElementById('pedidoId').value = '';
    document.getElementById('itemsPedido').innerHTML = '';
    
    const pedidoModal = bootstrap.Modal.getInstance(document.getElementById('pedidoModal'));
    if (pedidoModal) pedidoModal.hide();
}

// Attach global functions to window object
window.verDetallePedido = verDetallePedido;
window.editarPedido = editarPedido;
window.eliminarPedido = eliminarPedido;
window.agregarLineaProducto = agregarLineaProducto;
window.eliminarLineaProducto = eliminarLineaProducto;
window.actualizarPrecioProducto = actualizarPrecioProducto;
window.actualizarSubtotal = actualizarSubtotal;
window.initPedidosPage = initPedidosPage;