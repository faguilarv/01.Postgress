import {
  limpiarRut,
  validarRUT,
  validarFormatoRUT,
  validarDigitoVerificador,
  formatearRUT,
  calcularDigitoVerificador,
} from "../../../shared/utils.js";

class CitaManager {
  constructor() {
    this.URL_DOMAIN = "http://localhost:3000";
    this.tablaCitas = document.getElementById("tablaCitas");
    this.formAgendarCita = document.getElementById("formAgendarCita");
    this.rutPacienteInput = document.getElementById("rutPaciente");
    this.alertContainer = document.getElementById("alertContainer");

    this.init();
  }

  init() {
    this.cargarRutPaciente();
    this.obtenerCitas();
    this.manejarCambioPrevision("agendar"); // Para formulario principal
    this.manejarCambioPrevision("editar"); // Para formulario de edición

    this.formAgendarCita?.addEventListener("submit", (e) =>
      this.agendarCita(e)
    );
    document
      .getElementById("formEditarCita")
      ?.addEventListener("submit", (e) => this.guardarCambiosCita(e));

    // Nuevos manejadores para la búsqueda avanzada
    document
      .getElementById("formBuscarCitas")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this.buscarCitasAvanzadas();
      });

    document
      .getElementById("btnResetBusqueda")
      ?.addEventListener("click", () => {
        this.resetearBusqueda();
      });

    document.getElementById("btnLimpiarRut")?.addEventListener("click", () => {
      const rutInput = document.getElementById("rutBusqueda");
      if (rutInput) {
        rutInput.value = "";
        delete rutInput.dataset.cleanRut;
      }
    });

    // Validación automática de RUT - MODIFICADO
    document.getElementById("rutBusqueda")?.addEventListener("input", (e) => {
      // Limpia el RUT antes de formatear para evitar problemas
      const cleanValue = limpiarRut(e.target.value);
      if (cleanValue) {
        e.target.value = formatearRUT(cleanValue);
        // Guarda el RUT limpio en un atributo data para usarlo en la búsqueda
        e.target.dataset.cleanRut = cleanValue;
      }
    });
  }

  cargarRutPaciente() {
    const rutLimpio = localStorage.getItem("rutPacienteSeleccionado");

    if (rutLimpio) {
      this.rutPacienteInput.value = formatearRUT(rutLimpio);
      this.rutPacienteInput.dataset.cleanRut = rutLimpio;
      this.rutPacienteInput.readOnly = true;
      this.rutPacienteInput.classList.add("bg-light");
      localStorage.removeItem("rutPacienteSeleccionado");
    }
  }

  async obtenerCitas() {
    try {
      const response = await axios.get(`${this.URL_DOMAIN}/api/citas`, {
        params: { orden: "asc" },
      });
      let citas = response.data;

      // Ordenar citas por fecha (de más antigua a más nueva)
      if (!response.config.params?.orden) {
        citas.sort((a, b) => {
          const fechaHoraA = new Date(`${a.fecha}T${a.hora}`);
          const fechaHoraB = new Date(`${b.fecha}T${b.hora}`);
          return fechaHoraA - fechaHoraB;
        });
      }

      this.tablaCitas.innerHTML = "";

      if (!citas || citas.length === 0) {
        this.tablaCitas.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-muted py-4">
              <i class="fas fa-calendar-times fa-2x mb-2"></i>
              <p>No hay citas agendadas</p>
            </td>
          </tr>
        `;
        return;
      }

      citas.forEach((cita) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${cita.id}</td>
          <td>${
            cita.paciente_rut ? formatearRUT(cita.paciente_rut) : "N/A"
          }</td>
          <td>${new Date(cita.fecha).toLocaleDateString("es-CL")}</td>
          <td>${cita.hora}</td>
          <td>${cita.foliofonasa || "-"}</td>
          <td>${cita.prevision}</td>
          <td>${cita.motivo}</td>
          <td class="text-nowrap">
            <button class="btn btn-warning btn-sm editar-btn me-1" data-id="${
              cita.id
            }">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm eliminar-btn" data-id="${
              cita.id
            }">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        this.tablaCitas.appendChild(fila);
      });

      document.querySelectorAll(".editar-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.editarCita(btn.dataset.id));
      });

      document.querySelectorAll(".eliminar-btn").forEach((btn) => {
        btn.addEventListener("click", () => this.eliminarCita(btn.dataset.id));
      });
    } catch (error) {
      console.error("Error al obtener citas:", error);
      this.mostrarAlerta("Error al cargar citas", "danger");
    }
  }

  // Método de búsqueda avanzada
  async buscarCitasAvanzadas() {
    const rutInput = document.getElementById("rutBusqueda");
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;

    // Validación básica
    if (!fechaInicio || !fechaFin) {
      this.mostrarAlerta("Debe seleccionar un rango de fechas", "warning");
      return;
    }

    // Validar que fechaInicio no sea mayor que fechaFin
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      this.mostrarAlerta(
        "La fecha de inicio no puede ser mayor que la fecha fin",
        "warning"
      );
      return;
    }

    try {
      // Mostrar indicador de carga
      this.tablaCitas.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Buscando citas...</span>
            </div>
            <p class="mt-2">Buscando citas...</p>
          </td>
        </tr>
      `;

      let url;
      const params = {
        fechaInicio,
        fechaFin,
        orden: "asc", // Ordenar por fecha ascendente
      };

      const rutLimpio = rutInput?.dataset.cleanRut;
      if (rutLimpio && validarRUT(rutLimpio)) {
        url = `${this.URL_DOMAIN}/api/citas/rut/${rutLimpio}`;
      } else {
        url = `${this.URL_DOMAIN}/api/citas`;
      }

      const response = await axios.get(url, { params });
      this.mostrarResultadosBusqueda(response.data);
    } catch (error) {
      console.error("Error en búsqueda avanzada:", error);
      let errorMessage = "Error al realizar la búsqueda";

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage =
            "No se encontraron citas con los criterios especificados";
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }

      this.mostrarAlerta(errorMessage, "danger");
      this.obtenerCitas(); // Volver a cargar todas las citas
    }
  }

  // Método para mostrar resultados de búsqueda
  mostrarResultadosBusqueda(citas) {
    this.tablaCitas.innerHTML = "";

    if (!citas || citas.length === 0) {
      this.tablaCitas.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="fas fa-search fa-2x mb-2"></i>
            <p>No se encontraron citas con los criterios de búsqueda</p>
          </td>
        </tr>
      `;
      return;
    }

    // Ordenar por fecha y hora (ascendente = más antigua a más nueva)
    citas.sort((a, b) => {
      const fechaHoraA = new Date(`${a.fecha}T${a.hora}`);
      const fechaHoraB = new Date(`${b.fecha}T${b.hora}`);
      return fechaHoraA - fechaHoraB;
    });

    // Obtener el RUT buscado (en formato limpio)
    const rutInput = document.getElementById("rutBusqueda");
    const rutBuscado = rutInput?.dataset.cleanRut || "";

    citas.forEach((cita) => {
      const fila = document.createElement("tr");
      // Determinar si debemos resaltar esta fila (coincide con RUT buscado)
      const debeResaltar =
        rutBuscado && cita.paciente_rut === rutBuscado && cita.foliofonasa;
      fila.innerHTML = `
        <td>${cita.id}</td>
        <td>${cita.paciente_rut ? formatearRUT(cita.paciente_rut) : "N/A"}</td>
        <td>${new Date(cita.fecha).toLocaleDateString("es-CL")}</td>
        <td>${cita.hora}</td>
        <td class="${debeResaltar ? "fw-bold text-primary" : ""}">${
        cita.foliofonasa || "-"
      }</td>
        <td>${cita.prevision}</td>
        <td>${cita.motivo}</td>
        <td class="text-nowrap">
            <button class="btn btn-warning btn-sm editar-btn me-1" data-id="${
              cita.id
            }">
            <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm eliminar-btn" data-id="${
              cita.id
            }">
            <i class="fas fa-trash"></i>
            </button>
        </td>
        `;

      this.tablaCitas.appendChild(fila);
    });

    // Agregar eventos a los botones de editar/eliminar
    document.querySelectorAll(".editar-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.editarCita(btn.dataset.id));
    });

    document.querySelectorAll(".eliminar-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.eliminarCita(btn.dataset.id));
    });
  }

  // Método buscarCitasPorRutYFecha
  async buscarCitasPorRutYFecha(rut, fechaInicio, fechaFin) {
    try {
      let url;
      if (rut === "all") {
        url = `${this.URL_DOMAIN}/api/citas`;
      } else {
        url = `${this.URL_DOMAIN}/api/citas/rut/${rut}`;
      }

      const response = await axios.get(url, {
        params: {
          fechaInicio,
          fechaFin,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error al buscar citas:", error);
      throw error; // Propagar el error para manejo superior
    }
  }

  // Método resetearBusqueda
  resetearBusqueda() {
    const rutInput = document.getElementById("rutBusqueda");
    if (rutInput) {
      rutInput.value = "";
      delete rutInput.dataset.cleanRut;
    }
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";
    this.obtenerCitas();
  }

  async agendarCita(event) {
    event.preventDefault();

    try {
      const rutInput = this.rutPacienteInput.value.trim();
      const rutLimpio =
        this.rutPacienteInput.dataset.cleanRut || limpiarRut(rutInput);

      if (!rutLimpio || rutLimpio.length < 8) {
        this.mostrarAlerta(
          "El RUT debe tener al menos 8 caracteres (7 dígitos + guión + dígito verificador)",
          "warning"
        );
        this.rutPacienteInput.focus();
        return;
      }
      // Solo validar si el RUT NO viene del localStorage (es decir, si fue ingresado manualmente)
      if (!this.rutPacienteInput.dataset.cleanRut && !validarRUT(rutLimpio)) {
        const cuerpo = rutLimpio.slice(0, -1);
        const dvIngresado = rutLimpio.slice(-1).toUpperCase();
        const dvCalculado = calcularDigitoVerificador(cuerpo);

        this.mostrarAlerta(
          `RUT inválido. El dígito verificador debería ser ${dvCalculado} (ingresaste ${dvIngresado})`,
          "warning"
        );
        return;
      }

      const { data: paciente } = await axios
        .get(`${this.URL_DOMAIN}/api/pacientes/rut/${rutLimpio}`)
        .catch(() => ({ data: null }));

      if (!paciente) {
        this.mostrarAlerta("No existe un paciente con ese RUT", "warning");
        return;
      }

      const nuevaCita = {
        paciente_id: paciente.uid,
        fecha: document.getElementById("fechaCita").value,
        hora: document.getElementById("horaCita").value,
        motivo: document.getElementById("motivoCita").value,
        foliofonasa: document.getElementById("folioFonasa").value || null,
        prevision: document.getElementById("prevision").value,
      };

      if (
        !nuevaCita.fecha ||
        !nuevaCita.hora ||
        !nuevaCita.motivo ||
        !nuevaCita.prevision
      ) {
        this.mostrarAlerta("Complete todos los campos obligatorios", "warning");
        return;
      }

      const { data: cita } = await axios.post(
        `${this.URL_DOMAIN}/api/citas`,
        nuevaCita
      );

      this.mostrarAlerta(
        `Cita agendada para ${formatearRUT(paciente.rut)}`,
        "success"
      );
      this.formAgendarCita.reset();
      this.obtenerCitas();
    } catch (error) {
      console.error("Error al agendar cita:", error);
      this.mostrarAlerta(
        error.response?.data?.error || "Error al agendar cita",
        "danger"
      );
    }
  }

  async eliminarCita(id) {
    if (!confirm("¿Está seguro de eliminar esta cita?")) return;

    try {
      await axios.delete(`${this.URL_DOMAIN}/api/citas/${id}`);
      this.mostrarAlerta("Cita eliminada correctamente", "success");
      this.obtenerCitas();
    } catch (error) {
      console.error("Error al eliminar cita:", error);
      this.mostrarAlerta(
        error.response?.data?.error || "Error al eliminar cita",
        "danger"
      );
    }
  }

  async editarCita(id) {
    try {
      const { data: cita } = await axios.get(
        `${this.URL_DOMAIN}/api/citas/${id}`
      );
      console.log("Datos de la cita recibidos:", cita);

      // Función segura para asignar valores
      const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value || "";
      };

      // Asignación de valores
      setValue("idEditar", cita.id);
      setValue(
        "rutPacienteEditar",
        cita.paciente_rut ? formatearRUT(cita.paciente_rut) : ""
      );
      setValue("fechaCitaEditar", cita.fecha.split("T")[0]);
      setValue("horaCitaEditar", cita.hora);
      setValue("previsionEditar", cita.prevision);
      setValue("folioFonasaEditar", cita.foliofonasa);
      setValue("motivoCitaEditar", cita.motivo);

      // Actualizar estado de Folio Fonasa según previsión
      this.manejarCambioPrevision("editar");

      new bootstrap.Modal(document.getElementById("modalEditarCita")).show();
    } catch (error) {
      console.error("Error al cargar cita:", error);
      this.mostrarAlerta("Error al cargar datos de la cita", "danger");
    }
  }

  async guardarCambiosCita(event) {
    event.preventDefault();

    try {
      const id = document.getElementById("idEditar").value;
      const rutPaciente = document
        .getElementById("rutPacienteEditar")
        .value.trim();

      if (rutPaciente && !validarRUT(rutPaciente)) {
        this.mostrarAlerta("El RUT ingresado no es válido", "warning");
        return;
      }

      const datosActualizados = {
        fecha: document.getElementById("fechaCitaEditar").value,
        hora: document.getElementById("horaCitaEditar").value,
        motivo: document.getElementById("motivoCitaEditar").value,
        foliofonasa: document.getElementById("folioFonasaEditar").value || null,
        prevision: document.getElementById("previsionEditar").value,
      };

      if (rutPaciente) {
        const rutLimpio = limpiarRut(rutPaciente);
        const { data: paciente } = await axios.get(
          `${this.URL_DOMAIN}/api/pacientes/rut/${rutPaciente}`
        );
        datosActualizados.paciente_id = paciente.uid;
      }

      await axios.put(`${this.URL_DOMAIN}/api/citas/${id}`, datosActualizados);

      this.mostrarAlerta("Cita actualizada correctamente", "success");
      this.obtenerCitas();
      bootstrap.Modal.getInstance(
        document.getElementById("modalEditarCita")
      ).hide();
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      this.mostrarAlerta(
        error.response?.data?.error || "Error al actualizar cita",
        "danger"
      );
    }
  }

  mostrarAlerta(mensaje, tipo) {
    if (!this.alertContainer) {
      console.error("No se encontró el contenedor de alertas");
      return;
    }

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = "alert";
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    this.alertContainer.innerHTML = "";
    this.alertContainer.appendChild(alerta);

    setTimeout(() => {
      alerta.classList.add("show");
      setTimeout(() => {
        alerta.classList.remove("show");
        setTimeout(() => {
          if (alerta.parentNode === this.alertContainer) {
            this.alertContainer.removeChild(alerta);
          }
        }, 150);
      }, 5000);
    }, 10);
  }

  manejarCambioPrevision(context = "agendar") {
    const prefix = context === "editar" ? "Editar" : "";
    const previsionSelect = document.getElementById(`prevision${prefix}`);
    const folioFonasaInput = document.getElementById(`folioFonasa${prefix}`);

    if (!previsionSelect || !folioFonasaInput) {
      console.warn(`Elementos no encontrados para contexto: ${context}`);
      return;
    }

    const toggleFolioFonasa = () => {
      const isParticular = previsionSelect.value === "Particular";
      folioFonasaInput.disabled = isParticular;
      folioFonasaInput.required = !isParticular;
      if (isParticular) folioFonasaInput.value = "";
    };

    previsionSelect.addEventListener("change", toggleFolioFonasa);
    toggleFolioFonasa(); // Ejecutar al inicio
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new CitaManager();
});
