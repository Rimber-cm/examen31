// db.js - Configuración central de IndexedDB
const DB_NAME = 'PoleraTechDB';
const DB_VERSION = 1;

// Función para inicializar la base de datos
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Error al abrir la base de datos:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('Base de datos abierta con éxito');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Actualizando estructura de la base de datos');
            
            // Crear almacén de clientes
            if (!db.objectStoreNames.contains('clientes')) {
                const clientesStore = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
                clientesStore.createIndex('email', 'email', { unique: true });
                clientesStore.createIndex('nombre', 'nombre', { unique: false });
                console.log('Almacén de clientes creado');
            }
            
            // Crear almacén de productos
            if (!db.objectStoreNames.contains('productos')) {
                const productosStore = db.createObjectStore('productos', { keyPath: 'id', autoIncrement: true });
                productosStore.createIndex('nombre', 'nombre', { unique: false });
                console.log('Almacén de productos creado');
            }
            
            // Crear almacén de pedidos
            if (!db.objectStoreNames.contains('pedidos')) {
                const pedidosStore = db.createObjectStore('pedidos', { keyPath: 'id', autoIncrement: true });
                pedidosStore.createIndex('clienteId', 'clienteId', { unique: false });
                pedidosStore.createIndex('fecha', 'fecha', { unique: false });
                console.log('Almacén de pedidos creado');
            }
            
            // Crear almacén para detalles de pedidos
            if (!db.objectStoreNames.contains('detallesPedido')) {
                const detallesStore = db.createObjectStore('detallesPedido', { keyPath: 'id', autoIncrement: true });
                detallesStore.createIndex('pedidoId', 'pedidoId', { unique: false });
                detallesStore.createIndex('productoId', 'productoId', { unique: false });
                console.log('Almacén de detalles de pedido creado');
            }
        };
    });
}

// Función genérica para agregar un elemento a cualquier almacén
function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        let db; // Declara db fuera del .then() para que esté en scope para el catch
        initDB()
            .then(database => {
                db = database; // Asigna el resultado de initDB a la variable db
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);

                // *** MEJORA IMPORTANTE: Manejo de la Transacción ***
                transaction.onerror = (event) => {
                    console.error("Transacción fallida:", event.target.error);
                    reject(event.target.error); // Rechaza la promesa si la transacción falla
                };

                const request = store.add(item);

                request.onsuccess = (event) => {
                    console.log(`Item agregado a ${storeName} con ID:`, event.target.result);
                    resolve(event.target.result);
                };

                request.onerror = (event) => {
                    console.error(`Error al agregar item a ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };

                // *** MEJORA IMPORTANTE: Completar la Transacción ***
                transaction.oncomplete = () => {
                    console.log("Transacción completada con éxito.");
                };
            })
            .catch(error => {
                console.error("Error al inicializar o durante la transacción:", error);
                reject(error); // Rechaza la promesa si initDB falla
                if (db) {
                    db.close(); // Cierra la base de datos si se abrió, para liberar recursos
                }
            });
    });
}

// Función genérica para obtener todos los elementos de un almacén
function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error al obtener items de ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => reject(error));
    });
}

// Función genérica para obtener un elemento por su ID
function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error al obtener item de ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => reject(error));
    });
}

// Función genérica para actualizar un elemento
function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            
            request.onsuccess = () => {
                console.log(`Item actualizado en ${storeName}`);
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error al actualizar item en ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => reject(error));
    });
}

// Función genérica para eliminar un elemento
function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`Item eliminado de ${storeName}`);
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error(`Error al eliminar item de ${storeName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => reject(error));
    });
}

// Función para buscar por un índice específico
function getItemsByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        initDB().then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error al buscar items en ${storeName} por ${indexName}:`, event.target.error);
                reject(event.target.error);
            };
        }).catch(error => reject(error));
    });
}