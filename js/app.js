const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRS3ybkxZouRY-zvi2noCIblsugnvLk8HY0-uRxcwVfJbh2GxB-zFmWOxvjx0Bk4Jxk66Q7q-RT91GI/pub?output=csv";

let total = 0;
let cantidades = {};

async function cargarProductos() {
    try {
        // Agregamos un timestamp a la URL de forma oculta para asegurar que el navegador siempre 
        // pida la versión más fresca posible y eluda el caché local.
        const respuesta = await fetch(URL_SHEET + "&_t=" + new Date().getTime());
        const datos = await respuesta.text();
        const filas = datos.split("\n").slice(1);

        const contenedor = document.getElementById('lista-productos');
        contenedor.innerHTML = ""; // Quitar Loader

        filas.forEach(fila => {
            const columnas = fila.split(",");
            if (columnas.length >= 2) {
                const nombre = columnas[0].trim();
                let precioStr = columnas[1].replace('$', '').replace('\r', '').trim();
                const precio = parseFloat(precioStr);

                if (!isNaN(precio) && nombre) {
                    const tarjeta = document.createElement('div');
                    
                    tarjeta.className = `
                        tarjeta-producto cursor-pointer group relative flex flex-col justify-between text-left 
                        bg-slate-800 border border-slate-700/60 rounded-2xl p-4 min-h-[110px]
                        hover:bg-slate-700/80 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 
                        transition-all duration-300 ease-out 
                        hover:-translate-y-1 active:scale-[0.97] overflow-hidden
                    `;
                    
                    tarjeta.innerHTML = `
                        <!-- Glow Effect -->
                        <div class="absolute inset-0 bg-gradient-to-b from-white/0 to-white/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-colors duration-300 pointer-events-none"></div>
                        
                        <!-- Botón Restar (Esquina superior izquierda, oculto inicialmente) -->
                        <button class="restar-btn hidden absolute top-0 left-0 bg-rose-500/90 hover:bg-rose-500 text-white w-9 h-9 flex items-center justify-center rounded-br-2xl shadow-md transition-all duration-200 z-20 active:scale-95" title="Quitar uno">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18 12H6" />
                            </svg>
                        </button>
                        
                        <!-- Badge de cantidad (Esquina superior derecha, oculto inicialmente) -->
                        <div class="cantidad-badge hidden absolute top-0 right-0 bg-emerald-500 text-slate-900 text-xs font-black px-2.5 py-1 rounded-bl-xl shadow-sm transition-transform duration-200 z-10 w-auto min-w-[32px] text-center pointer-events-none">0</div>
                        
                        <span class="relative text-sm md:text-[15px] font-medium text-slate-300 group-hover:text-white transition-colors leading-snug line-clamp-2 pr-5 pl-5 mt-1 pointer-events-none">${nombre}</span>
                        
                        <div class="relative mt-3 pt-2 w-full flex items-end justify-between border-t border-slate-700/50 group-hover:border-slate-600/50 transition-colors pointer-events-none">
                            <span class="text-lg md:text-xl font-bold text-emerald-400 tracking-tight">$${precio.toFixed(2)}</span>
                            
                            <div class="h-7 w-7 rounded-full bg-slate-700/50 group-hover:bg-emerald-500 text-slate-400 group-hover:text-slate-900 flex items-center justify-center transition-all duration-300 shadow-sm pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    `;
                    
                    // Evento Clic Principal (Sumar)
                    tarjeta.addEventListener('click', (e) => {
                        e.preventDefault();
                        sumar(precio, nombre, tarjeta);
                    });

                    // Evento Clic en el Botón Restar
                    const btnRestar = tarjeta.querySelector('.restar-btn');
                    btnRestar.addEventListener('click', (e) => {
                        e.stopPropagation(); // Evitar que el click se propague a "tarjeta"
                        e.preventDefault();
                        restar(precio, nombre, tarjeta);
                    });
                    
                    contenedor.appendChild(tarjeta);
                }
            }
        });
        
        if(contenedor.children.length === 0) {
             contenedor.innerHTML = `<p class="col-span-full text-center text-slate-500 py-10 font-medium">Aún no hay productos en el Sheet.</p>`;
        }

    } catch (error) {
        console.error("Error cargando el Sheet:", error);
        document.getElementById('lista-productos').innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-rose-400 font-bold mb-1">¡UPS! Acción restringida</p>
                <p class="text-sm text-rose-400/80 text-center max-w-sm mt-2">
                Por seguridad, no podemos descargar los productos si abriste la página directamente (file://). 
                <br><br>👉 Recuerda usar tu servidor local (Live Server). <br>
                </p>
            </div>
        `;
    }
}

// LÓGICA DE NEGOCIO

function sumar(precio, nombre, tarjetaElement) {
    total += precio;
    if (!cantidades[nombre]) cantidades[nombre] = 0;
    cantidades[nombre]++;
    
    actualizarEstadosTarjeta(nombre, tarjetaElement, true);
    actualizarTotalUI();
    animarTotal('#6ee7b7', '#34d399');
    
    showToast(`Suma: +$${precio.toFixed(2)}`, nombre, 'add');
}

function restar(precio, nombre, tarjetaElement) {
    if (!cantidades[nombre] || cantidades[nombre] <= 0) return;
    
    total -= precio;
    cantidades[nombre]--;
    
    actualizarEstadosTarjeta(nombre, tarjetaElement, false);
    actualizarTotalUI();
    animarTotal('#fda4af', '#34d399'); // Destello rojizo
    
    showToast(`Resta: -$${precio.toFixed(2)}`, nombre, 'remove');
}

function actualizarEstadosTarjeta(nombre, tarjetaElement, esSuma) {
    if (!tarjetaElement) return;
    
    const badge = tarjetaElement.querySelector('.cantidad-badge');
    const restarBtn = tarjetaElement.querySelector('.restar-btn');
    const cant = cantidades[nombre];
    
    if (cant > 0) {
        badge.innerText = cant + 'x';
        badge.classList.remove('hidden');
        restarBtn.classList.remove('hidden');
        
        if (esSuma) {
            badge.classList.add('scale-125');
            setTimeout(() => badge.classList.remove('scale-125'), 150);
        } else {
            badge.classList.add('scale-90', 'text-rose-900', 'bg-rose-400');
            setTimeout(() => {
                badge.classList.remove('scale-90', 'text-rose-900', 'bg-rose-400');
            }, 150);
        }
    } else {
        badge.classList.add('hidden');
        restarBtn.classList.add('hidden');
    }
}

function limpiar() {
    if (total === 0) return;
    total = 0;
    cantidades = {}; 
    
    document.querySelectorAll('.tarjeta-producto').forEach(tarjeta => {
        tarjeta.querySelector('.cantidad-badge').classList.add('hidden');
        tarjeta.querySelector('.restar-btn').classList.add('hidden');
    });
    
    actualizarTotalUI();
    showToast("Cuenta reiniciada a cero", "", "clear");
}

function copiarTotal() {
    const strTotal = total.toFixed(2);
    if (navigator.clipboard) {
        navigator.clipboard.writeText("Total a cobrar: $" + strTotal).then(() => {
            showToast(`$${strTotal} copiado`, "Listo para pegar", "copy");
        }).catch(err => alert("Total: $" + strTotal)); 
    } else {
        alert("Total a cobrar: $" + strTotal);
    }
}

function actualizarTotalUI() {
    // Evitar decimales como -0.00 al restar mucho
    if(total < 0.01) total = 0;
    document.getElementById('total').innerText = total.toFixed(2);
}

function animarTotal(colorFlash, colorNormal) {
    const totalContainer = document.getElementById('total-container');
    if(!totalContainer) return;
    
    totalContainer.style.transform = 'scale(1.08)';
    totalContainer.style.color = colorFlash;
    setTimeout(() => {
        totalContainer.style.transform = 'scale(1)';
        totalContainer.style.color = colorNormal; 
    }, 150);
}

// SISTEMA DE NOTIFICACIONES (TOASTS)

let toastCounter = 0;
function showToast(title, subtitle = "", type = "add") {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toastId = 'toast-' + toastCounter++;
    const toast = document.createElement('div');
    toast.id = toastId;
    
    let icon = '';
    let bgClass = '';
    let textColorClass = 'text-white';
    let subTextColorClass = 'text-slate-400';
    
    if (type === 'add') {
        bgClass = 'bg-slate-800 border-l-4 border-emerald-500';
        icon = `<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>`;
    } else if (type === 'remove') {
        bgClass = 'bg-slate-800 border-l-4 border-rose-500';
        icon = `<svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>`;
    } else if (type === 'clear') {
        bgClass = 'bg-slate-800 border-l-4 border-rose-600';
        icon = `<svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
    } else if (type === 'copy') {
        bgClass = 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_20px_rgba(52,211,153,0.4)] border-none';
        icon = `<svg class="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
        textColorClass = 'text-slate-900';
        subTextColorClass = 'text-slate-900/70';
    }
    
    toast.className = `transform translate-y-[-20px] opacity-0 scale-95 transition-all duration-300 ease-out flex items-center gap-3 py-3 px-4 rounded-2xl shadow-lg backdrop-blur-sm mx-4 max-w-sm pointer-events-auto border border-white/5 ${bgClass}`;
    
    toast.innerHTML = `
        <div class="flex-shrink-0 bg-black/10 rounded-full p-1.5 shadow-inner">
            ${icon}
        </div>
        <div class="flex flex-col">
            <span class="text-sm font-bold ${textColorClass}">${title}</span>
            ${subtitle ? `<span class="text-[11px] font-medium ${subTextColorClass} leading-tight line-clamp-1">${subtitle}</span>` : ''}
        </div>
    `;
    
    if (container.children.length >= 3) {
        removeToast(container.firstElementChild);
    }
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-20px]', 'opacity-0', 'scale-95');
        toast.classList.add('translate-y-0', 'opacity-100', 'scale-100');
    });
    
    setTimeout(() => {
        if(document.getElementById(toastId)) {
            removeToast(toast);
        }
    }, 2500);
}

function removeToast(toastElement) {
    toastElement.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
    toastElement.classList.add('translate-y-4', 'opacity-0', 'scale-95');
    setTimeout(() => {
        if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
        }
    }, 300);
}

// Cargar la app cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', cargarProductos);
