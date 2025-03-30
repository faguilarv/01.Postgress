import { formatearRUT, limpiarRut } from "../../../shared/utils.js";

class PacienteManager {
  constructor() {
    this.URL_DOMAIN = "http://localhost:3000";
    this.tbodyPacientes = document.querySelector("#todosLosPacientes");
    this.init();
  }

  init() {
    this.obtenerPacientes();

    // Exponer métodos necesarios globalmente
    window.eliminarPaciente = (uid) => this.eliminarPaciente(uid);
    window.editarPaciente = (uid) => this.editarPaciente(uid);
    window.agendarPaciente = (uid) => this.agendarPaciente(uid);
    window.buscarPorRUT = () => this.buscarPorRUT();
    window.crearPaciente = () => this.crearPaciente();
    window.actualizarPaciente = () => this.actualizarPaciente();
    window.mostrarTodosLosPacientes = () => this.obtenerPacientes();
  }

  async obtenerPacientes() {
    try {
      const { data: pacientes } = await axios.get(
        `${this.URL_DOMAIN}/api/pacientes`
      );
      this.tbodyPacientes.innerHTML = "";

      if (pacientes.length === 0) {
        this.tbodyPacientes.innerHTML = `
          <tr>
            <td colspan="12" class="text-center text-muted py-4">
              <i class="fas fa-user-times fa-2x mb-2"></i>
              <p>No hay pacientes registrados</p>
            </td>
          </tr>
        `;
        return;
      }

      pacientes.forEach((paciente) => {
        const fila = document.createElement("tr");
        fila.innerHTML = this.generarFilaPaciente(paciente);
        this.tbodyPacientes.appendChild(fila);
      });
    } catch (error) {
      console.error("Error al obtener los pacientes:", error);
      this.mostrarAlerta("Ocurrió un error al obtener los pacientes", "danger");
    }
  }

  generarFilaPaciente(paciente) {
    return `
      <td>${paciente.uid}</td>
      <td>${formatearRUT(paciente.rut)}</td>
      <td>${paciente.nombre}</td>
      <td>${paciente.apellido}</td>
      <td>${paciente.edad}</td>
      <td>${paciente.sexo}</td>
      <td>${paciente.telefono || "-"}</td>
      <td>${paciente.correo || "-"}</td>
      <td>${paciente.direccion || "-"}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="window.eliminarPaciente('${
          paciente.uid
        }'
        )">
          <i class="fas fa-trash"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="window.editarPaciente('${
          paciente.uid
        }'
        )">
          <i class="fas fa-edit"></i>
        </button>
      </td>
      <td>
       <button class="btn btn-success btn-sm" onclick="window.agendarPaciente('${
         paciente.uid
       }')">
        <i class="fas fa-calendar-plus"></i>
      </button>
      </td>
    `;
  }

  async buscarPorRUT() {
    const rutInput = document.getElementById("rutInput");
    const rut = rutInput.value.trim();

    if (!rut) {
      this.mostrarAlerta("Por favor, ingrese un RUT válido.", "warning");
      rutInput.focus();
      return;
    }

    try {
      this.mostrarEstadoCarga();

      let pacienteEncontrado = null;
      try {
        const response = await axios.get(
          `${this.URL_DOMAIN}/api/pacientes/rut/${rut}`
        );
        pacienteEncontrado = response.data;
      } catch (error) {
        if (!error.response || error.response.status !== 404) {
          throw error;
        }
      }

      const { data: ultimosPacientes } = await axios.get(
        `${this.URL_DOMAIN}/api/pacientes`
      );
      this.tbodyPacientes.innerHTML = "";

      if (pacienteEncontrado) {
        const filaPaciente = document.createElement("tr");
        filaPaciente.classList.add("table-primary", "resaltado");
        filaPaciente.innerHTML = this.generarFilaPaciente(pacienteEncontrado);
        this.tbodyPacientes.appendChild(filaPaciente);

        const modal = bootstrap.Modal.getInstance(
          document.getElementById("buscarPacienteRut")
        );
        modal?.hide();
      } else {
        const filaMensaje = document.createElement("tr");
        filaMensaje.innerHTML = `
          <td colspan="12" class="text-center text-danger py-3">
            <i class="fas fa-exclamation-circle me-2"></i>
            No se encontró ningún paciente con RUT: ${rut}
          </td>
        `;
        this.tbodyPacientes.appendChild(filaMensaje);
      }

      if (ultimosPacientes?.length > 0) {
        this.mostrarUltimosPacientes(ultimosPacientes);
      }
    } catch (error) {
      console.error("Error en buscarPorRUT:", error);
      this.mostrarAlerta(
        error.response?.data?.error || "Error al buscar paciente",
        "danger"
      );
      this.obtenerPacientes();
    }
  }

  mostrarEstadoCarga() {
    this.tbodyPacientes.innerHTML = `
      <tr>
        <td colspan="12" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Buscando paciente...</span>
          </div>
          <p class="mt-2">Buscando paciente...</p>
        </td>
      </tr>
    `;
  }

  mostrarUltimosPacientes(pacientes) {
    const filaSeparador = document.createElement("tr");
    filaSeparador.innerHTML = `
      <td colspan="12" class="text-center bg-light py-2">
        <strong><i class="fas fa-list me-2"></i>Últimos pacientes registrados</strong>
      </td>
    `;
    this.tbodyPacientes.appendChild(filaSeparador);

    const pacientesMostrar = pacientes.slice(0, 10);
    pacientesMostrar.forEach((paciente) => {
      const fila = document.createElement("tr");
      fila.innerHTML = this.generarFilaPaciente(paciente);
      this.tbodyPacientes.appendChild(fila);
    });
  }

  async eliminarPaciente(uid) {
    if (!confirm("¿Está seguro de eliminar este paciente?")) return;

    try {
      await axios.delete(`${this.URL_DOMAIN}/api/pacientes/${uid}`);
      this.mostrarAlerta("Paciente eliminado correctamente", "success");
      this.obtenerPacientes();
    } catch (error) {
      console.error("Error al eliminar el paciente:", error);
      this.mostrarAlerta("Hubo un error al eliminar el paciente", "danger");
    }
  }

  async editarPaciente(uid) {
    try {
      const { data: paciente } = await axios.get(
        `${this.URL_DOMAIN}/api/pacientes/${uid}`
      );

      document.getElementById("uidEditar").value = paciente.uid;
      document.getElementById("rutEditar").value = paciente.rut;
      document.getElementById("nombreEditar").value = paciente.nombre;
      document.getElementById("apellidoEditar").value = paciente.apellido;
      document.getElementById("edadEditar").value = paciente.edad;
      document.getElementById("sexoEditar").value = paciente.sexo;
      document.getElementById("telefonoEditar").value = paciente.telefono;
      document.getElementById("correoEditar").value = paciente.correo;
      document.getElementById("direccionEditar").value = paciente.direccion;

      new bootstrap.Modal(
        document.getElementById("modalEditarPaciente")
      ).show();
    } catch (error) {
      console.error("Error al obtener los datos del paciente:", error);
      this.mostrarAlerta(
        "Hubo un error al cargar los datos del paciente",
        "danger"
      );
    }
  }

  async actualizarPaciente() {
    const uid = document.getElementById("uidEditar").value;

    const datosActualizados = {
      rut: document.getElementById("rutEditar").value,
      nombre: document.getElementById("nombreEditar").value,
      apellido: document.getElementById("apellidoEditar").value,
      edad: parseInt(document.getElementById("edadEditar").value),
      sexo: document.getElementById("sexoEditar").value,
      telefono: document.getElementById("telefonoEditar").value,
      correo: document.getElementById("correoEditar").value,
      direccion: document.getElementById("direccionEditar").value,
    };

    try {
      await axios.put(
        `${this.URL_DOMAIN}/api/pacientes/${uid}`,
        datosActualizados
      );

      const modalEditar = bootstrap.Modal.getInstance(
        document.getElementById("modalEditarPaciente")
      );
      modalEditar?.hide();

      this.mostrarAlerta("Paciente actualizado correctamente", "success");
      this.obtenerPacientes();
    } catch (error) {
      console.error("Error al actualizar el paciente:", error);
      this.mostrarAlerta(
        error.response?.data?.error ||
          "Hubo un error al actualizar el paciente",
        "danger"
      );
    }
  }

  async crearPaciente() {
    try {
      const nuevoPaciente = {
        rut: document.getElementById("rut").value,
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        edad: parseInt(document.getElementById("edad").value),
        sexo: document.getElementById("sexo").value,
        telefono: document.getElementById("telefono").value,
        correo: document.getElementById("correo").value,
        direccion: document.getElementById("direccion").value,
      };

      if (Object.values(nuevoPaciente).some((val) => !val && val !== 0)) {
        this.mostrarAlerta(
          "Por favor, complete todos los campos obligatorios.",
          "warning"
        );
        return;
      }

      const response = await axios.post(
        `${this.URL_DOMAIN}/api/pacientes`,
        nuevoPaciente
      );

      this.mostrarAlerta("Paciente creado correctamente", "success");

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalNuevoPaciente")
      );
      modal?.hide();

      this.obtenerPacientes();
    } catch (error) {
      console.error("Error al crear el paciente:", error);
      this.mostrarAlerta(
        error.response?.data?.error || "Ocurrió un error al crear el paciente.",
        "danger"
      );
    }
  }

  async agendarPaciente(uid) {
    try {
      const paciente = await this.obtenerPacientePorUID(uid);

      if (!paciente?.rut) {
        throw new Error("El paciente no tiene un RUT válido");
      }

      const rutLimpio = limpiarRut(paciente.rut);

      // Validación adicional del RUT limpio
      if (!/^[0-9]+[0-9kK]{1}$/.test(rutLimpio)) {
        throw new Error(
          `El RUT ${rutLimpio} no tiene un formato válido después de limpiar`
        );
      }

      localStorage.setItem("rutPacienteSeleccionado", rutLimpio);

      window.location.href = "agendacita.html";
    } catch (error) {
      this.mostrarAlerta(error.message, "danger");
    }
  }
  async obtenerPacientePorUID(uid) {
    try {
      const { data: paciente } = await axios.get(
        `${this.URL_DOMAIN}/api/pacientes/${uid}`
      );
      return paciente;
    } catch (error) {
      console.error("Error al obtener los datos del paciente:", error);
      throw new Error("Hubo un error al cargar los datos del paciente.");
    }
  }

  mostrarAlerta(mensaje, tipo) {
    // Implementación similar a la de CitaManager
    const alertContainer =
      document.getElementById("alertContainer") || document.body;

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = "alert";
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.prepend(alerta);

    setTimeout(() => {
      alerta.classList.add("show");
      setTimeout(() => {
        alerta.classList.remove("show");
        setTimeout(() => {
          alerta.remove();
        }, 150);
      }, 5000);
    }, 10);
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new PacienteManager();
});
