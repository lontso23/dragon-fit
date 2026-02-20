import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad — DragonFit</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: Febrero 2026</p>

        <Section title="1. Información general">
          <p>
            DragonFit ("la App", "nosotros") respeta la privacidad de los usuarios y se compromete a proteger sus datos personales.
          </p>
          <p className="mt-2">
            Esta Política de Privacidad explica qué información recopilamos, cómo la usamos y qué derechos tienes como usuario.
          </p>
          <p className="mt-2">
            Si tienes preguntas, puedes contactarnos en: <strong>lontso.coach@gmail.com</strong>
          </p>
        </Section>

        <Section title="2. Información que recopilamos">
          <p>
            Dependiendo de cómo uses la App, podemos recopilar la siguiente información:
          </p>

          <SubTitle>2.1 Información de cuenta</SubTitle>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dirección de correo electrónico</li>
            <li>Nombre de usuario (si aplica)</li>
            <li>Datos necesarios para autenticación</li>
            <li>La creación de una cuenta es obligatoria para utilizar la App.</li>
          </ul>

          <SubTitle>2.2 Datos de entrenamiento</SubTitle>
          <ul className="list-disc pl-6 space-y-1">
            <li>Rutinas creadas</li>
            <li>Ejercicios registrados</li>
            <li>Pesos, repeticiones y notas</li>
            <li>Historial de entrenamientos</li>
          </ul>

          <p className="mt-2">
            Estos datos se utilizan exclusivamente para proporcionar la funcionalidad principal de la App.
          </p>
          <p className="mt-2">
            Los datos de usuario y de entrenamiento se almacenan de forma segura en servidores remotos gestionados por nosotros mediante bases de datos MongoDB alojadas en infraestructura de terceros.
          </p>

          <SubTitle>2.3 Datos técnicos</SubTitle>
          <p>Podemos recopilar información técnica básica como:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tipo de dispositivo</li>
            <li>Sistema operativo</li>
            <li>Registros de errores (logs)</li>
          </ul>
        </Section>

        <Section title="3. Cómo usamos la información">
          <p>Usamos la información recopilada para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proporcionar y mantener la App</li>
            <li>Guardar tu progreso de entrenamiento</li>
            <li>Mejorar la experiencia de usuario</li>
            <li>Detectar y prevenir errores técnicos</li>
            <li>Cumplir obligaciones legales</li>
          </ul>
          <p className="mt-2 font-semibold">No vendemos tus datos personales.</p>
        </Section>

        <Section title="4. Base legal (usuarios del EEE)">
          <p>
            Si resides en el Espacio Económico Europeo (EEE), tratamos tus datos conforme al RGPD bajo las siguientes bases legales:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ejecución del contrato (para proporcionar la App)</li>
            <li>Interés legítimo (mejoras técnicas y seguridad)</li>
            <li>Consentimiento (cuando sea requerido)</li>
          </ul>
        </Section>

        <Section title="5. Conservación de datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para proporcionarte el servicio.
          </p>
          <p className="mt-2">
            Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiendo a: <strong>lontso.coach@gmail.com</strong>
          </p>
        </Section>

        <Section title="6. Compartición de datos">
          <p>
            No compartimos tus datos personales con terceros, excepto en los siguientes casos:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveedores de infraestructura necesarios para operar la App (por ejemplo, hosting)</li>
            <li>Cuando lo exija la ley</li>
            <li>Para proteger nuestros derechos legales</li>
          </ul>
          <p className="mt-2">
            Todos los proveedores cumplen estándares razonables de seguridad.
          </p>
        </Section>

        <Section title="7. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tu información. Sin embargo, ningún sistema es 100% seguro.
          </p>
        </Section>

        <Section title="8. Tus derechos">
          <p>Dependiendo de tu ubicación, puedes tener derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acceder a tus datos</li>
            <li>Rectificar datos incorrectos</li>
            <li>Solicitar la eliminación</li>
            <li>Oponerte al tratamiento</li>
            <li>Solicitar portabilidad</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, contacta en: <strong>lontso.coach@gmail.com</strong>
          </p>
        </Section>

        <Section title="9. Privacidad de menores">
          <p>
            La App no está dirigida a menores de 13 años (o la edad mínima aplicable en tu país). No recopilamos conscientemente datos de menores.
          </p>
        </Section>

        <Section title="10. Cambios en esta política">
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Notificaremos cambios relevantes dentro de la App o por otros medios apropiados.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p><strong>Responsable del tratamiento:</strong> Mikel Nieto Irureta</p>
          <p><strong>Email de contacto:</strong> lontso.coach@gmail.com</p>
          <p><strong>País:</strong> España</p>
        </Section>
      </div>
    </div>
  );
};

// Reusable components
const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed">{children}</div>
  </section>
);

const SubTitle = ({ children }) => (
  <h3 className="font-semibold mt-4 mb-2">{children}</h3>
);

export default PrivacyPolicyPage;
