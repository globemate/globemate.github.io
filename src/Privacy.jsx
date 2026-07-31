import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --black:#0a0905; --gold:#c9a84c; --gold-light:#e8c97a;
    --cream:#f5f0e8; --muted:rgba(245,240,232,0.35);
    --serif:'Cormorant Garamond',Georgia,serif; --sans:'DM Sans',sans-serif;
  }
  body { background:var(--black); color:var(--cream); font-family:var(--sans); font-weight:300; }

  .legal-nav { position:fixed; top:0; left:0; right:0; z-index:200; height:58px;
    display:flex; align-items:center; padding:0 32px;
    background:rgba(10,9,5,0.98); border-bottom:1px solid rgba(201,168,76,0.1); }
  @media(max-width:600px){ .legal-nav{ padding:0 16px; } }
  .legal-back { background:none; border:none; color:var(--gold); font-family:var(--sans);
    font-size:0.72rem; letter-spacing:0.12em; text-transform:uppercase;
    cursor:pointer; padding:0; display:flex; align-items:center; gap:8px; transition:opacity 0.2s; }
  .legal-back:hover { opacity:0.7; }

  .legal-root { min-height:100vh; background:var(--black); padding-top:58px; }
  .legal-hero { padding:60px 40px 40px; border-bottom:1px solid rgba(201,168,76,0.1); }
  @media(max-width:600px){ .legal-hero{ padding:40px 20px 28px; } }
  .legal-eyebrow { font-size:0.67rem; letter-spacing:0.24em; text-transform:uppercase;
    color:var(--gold); margin-bottom:12px; }
  .legal-title { font-family:var(--serif); font-size:clamp(2rem,4vw,3.2rem); font-weight:300;
    color:var(--cream); line-height:1.1; margin-bottom:10px; }
  .legal-title em { font-style:italic; color:var(--gold-light); }
  .legal-updated { font-size:0.75rem; color:var(--muted); letter-spacing:0.08em; }

  .legal-body { max-width:780px; margin:0 auto; padding:48px 40px 80px; }
  @media(max-width:600px){ .legal-body{ padding:32px 20px 60px; } }

  .legal-section { margin-bottom:40px; }
  .legal-section h2 { font-family:var(--serif); font-size:1.3rem; font-weight:400;
    color:var(--gold-light); margin-bottom:14px; letter-spacing:0.04em; }
  .legal-section h3 { font-size:0.88rem; font-weight:500; color:var(--cream);
    margin:18px 0 8px; letter-spacing:0.05em; text-transform:uppercase; }
  .legal-section p { font-size:0.88rem; line-height:1.75; color:rgba(245,240,232,0.75);
    margin-bottom:12px; }
  .legal-section ul { font-size:0.88rem; line-height:1.75; color:rgba(245,240,232,0.75);
    padding-left:20px; margin-bottom:12px; }
  .legal-section ul li { margin-bottom:6px; }
  .legal-section a { color:var(--gold); text-decoration:none; }
  .legal-section a:hover { text-decoration:underline; }
  .legal-placeholder { color:var(--gold); font-weight:500; font-style:italic; }
  .legal-divider { height:1px; background:rgba(201,168,76,0.1); margin:32px 0; }
`;

export default function Privacy({ onBack }) {
  const { t } = useTranslation();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      <style>{css}</style>
      <div className="legal-root">

        <nav className="legal-nav">
          <button className="legal-back" onClick={onBack}>
            ← {t("nav.back", "Volver")}
          </button>
        </nav>

        <div className="legal-hero">
          <div className="legal-eyebrow">Documento legal</div>
          <h1 className="legal-title">Política de <em>Privacidad</em></h1>
          <p className="legal-updated">Última actualización: julio 2026</p>
        </div>

        <div className="legal-body">

          <div className="legal-section">
            <h2>1. Responsable del tratamiento</h2>
            <p>
              En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018
              (LOPD-GDD), te informamos de que los datos personales recogidos a través de
              GlobeMate son tratados por:
            </p>
            <ul>
              <li><strong>Titular:</strong> <span className="legal-placeholder">[NOMBRE COMPLETO Y NIF DE LA AUTÓNOMA - PENDIENTE]</span></li>
              <li><strong>Actividad:</strong> Plataforma de contacto entre viajeros</li>
              <li><strong>Domicilio:</strong> España</li>
              <li><strong>Correo de contacto:</strong> <a href="mailto:support@globemate.app">support@globemate.app</a></li>
            </ul>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>2. Datos que recogemos</h2>
            <h3>Datos que tú nos proporcionas</h3>
            <ul>
              <li>Nombre, foto de perfil y edad</li>
              <li>Dirección de correo electrónico o número de teléfono (registro)</li>
              <li>Destinos de viaje, intereses y preferencias declaradas</li>
              <li>Mensajes enviados a otros usuarios dentro de la plataforma</li>
              <li>Información de pago cuando contratas un plan de pago (gestionada por el procesador de pagos, no almacenada en nuestros servidores)</li>
            </ul>
            <h3>Datos que recogemos automáticamente</h3>
            <ul>
              <li>Dirección IP y datos de dispositivo/navegador</li>
              <li>Páginas visitadas dentro de la app y tiempo de sesión</li>
              <li>Ubicación aproximada (solo si la activas expresamente)</li>
              <li>Identificadores anónimos de analítica (Google Analytics, Firebase)</li>
            </ul>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>3. Finalidades y base jurídica</h2>
            <ul>
              <li><strong>Prestación del servicio</strong> — Crear tu cuenta, conectarte con otros viajeros y gestionar tus conversaciones. Base: ejecución del contrato (art. 6.1.b RGPD).</li>
              <li><strong>Mejora del servicio</strong> — Analizar el uso para detectar errores y optimizar la experiencia. Base: interés legítimo (art. 6.1.f RGPD).</li>
              <li><strong>Comunicaciones de servicio</strong> — Notificaciones transaccionales (nuevos mensajes, matches). Base: ejecución del contrato.</li>
              <li><strong>Comunicaciones de marketing</strong> — Novedades y promociones si aceptas recibirlas. Base: consentimiento (art. 6.1.a RGPD). Puedes retirar tu consentimiento en cualquier momento.</li>
              <li><strong>Obligaciones legales</strong> — Cumplimiento de requerimientos legales o judiciales. Base: obligación legal (art. 6.1.c RGPD).</li>
            </ul>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>4. Conservación de los datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Cuando la elimines,
              borraremos tu información personal en un plazo máximo de 30 días, salvo que
              exista obligación legal de conservarlos por un período mayor (por ejemplo,
              datos fiscales: 5 años conforme a la Ley General Tributaria).
            </p>
            <p>
              Los mensajes intercambiados con otros usuarios se borran cuando ambas partes
              eliminan la conversación o cierran sus cuentas.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>5. Cesión de datos a terceros</h2>
            <p>No vendemos tus datos. Compartimos información únicamente con:</p>
            <ul>
              <li><strong>Firebase / Google LLC</strong> — Autenticación, base de datos y analítica. Sujeto a cláusulas contractuales estándar UE.</li>
              <li><strong>Procesadores de pago</strong> — Para gestionar transacciones de planes Premium. Solo reciben los datos estrictamente necesarios.</li>
              <li><strong>Autoridades públicas</strong> — Cuando así lo exija la ley o una resolución judicial.</li>
            </ul>
            <p>
              Algunos de estos proveedores están ubicados fuera del Espacio Económico Europeo.
              En esos casos, la transferencia se ampara en decisiones de adecuación de la
              Comisión Europea o en cláusulas contractuales tipo.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>6. Tus derechos</h2>
            <p>Conforme al RGPD, tienes derecho a:</p>
            <ul>
              <li><strong>Acceso</strong> — Saber qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación</strong> — Corregir datos inexactos.</li>
              <li><strong>Supresión («derecho al olvido»)</strong> — Solicitar que eliminemos tus datos.</li>
              <li><strong>Portabilidad</strong> — Recibir tus datos en formato estructurado.</li>
              <li><strong>Limitación del tratamiento</strong> — Pedirnos que restrinjamos el uso de tus datos.</li>
              <li><strong>Oposición</strong> — Oponerte al tratamiento basado en interés legítimo.</li>
              <li><strong>Retirada del consentimiento</strong> — En cualquier momento, sin que afecte a tratamientos anteriores.</li>
            </ul>
            <p>
              Puedes ejercer cualquiera de estos derechos escribiendo a{" "}
              <a href="mailto:support@globemate.app">support@globemate.app</a>.
              Responderemos en el plazo máximo de un mes (prorrogable a tres en casos complejos).
            </p>
            <p>
              Si consideras que el tratamiento de tus datos infringe la normativa, puedes
              presentar una reclamación ante la{" "}
              <strong>Agencia Española de Protección de Datos (AEPD)</strong> en{" "}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos
              frente a accesos no autorizados, pérdida o divulgación: cifrado en tránsito
              (HTTPS/TLS), autenticación segura mediante Firebase Auth, y acceso restringido
              a datos de producción.
            </p>
            <p>
              Ningún sistema es infalible. Si detectamos una brecha de seguridad que afecte
              a tus derechos y libertades, te notificaremos en los plazos exigidos por el RGPD.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>8. Menores de edad</h2>
            <p>
              GlobeMate está dirigida exclusivamente a personas mayores de 18 años. No
              recogemos conscientemente datos de menores. Si descubres que un menor ha
              creado una cuenta, escríbenos a{" "}
              <a href="mailto:support@globemate.app">support@globemate.app</a> y
              procederemos a eliminarla.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>9. Cookies y analítica</h2>
            <h3>Cookies estrictamente necesarias</h3>
            <p>
              GlobeMate utiliza cookies técnicas imprescindibles para el funcionamiento del
              servicio (sesión de autenticación, preferencias de idioma). Estas cookies no
              requieren consentimiento porque son necesarias para prestar el servicio que has
              solicitado.
            </p>
            <h3>Cookies de analítica (Firebase Analytics / Google)</h3>
            <p>
              Con tu consentimiento expreso, utilizamos Firebase Analytics (servicio de
              Google LLC) para recopilar estadísticas de uso agregadas: qué pantallas se
              visitan con más frecuencia, cuántos usuarios completan el registro, rendimiento
              general de la app, etc. Este servicio instala los siguientes identificadores en
              tu dispositivo:
            </p>
            <ul>
              <li><strong>_ga</strong> — Identifica de forma pseudónima tu navegador. Duración: 2 años.</li>
              <li><strong>_ga_XXXXXX</strong> — Rastrea la sesión de uso de la app. Duración: 2 años.</li>
              <li><strong>firebase_app_instance_id</strong> — Almacenado en localStorage; identifica la instancia de la app en tu navegador de forma persistente.</li>
            </ul>
            <p>
              Ningún evento de analítica contiene nombre, dirección de correo, número de
              teléfono ni ningún otro dato directamente identificable. Los datos son tratados
              por Google LLC bajo las salvaguardas del acuerdo de transferencia internacional
              vigente entre la UE y EE. UU. Para más información consulta la{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Política de Privacidad de Google
              </a>.
            </p>
            <h3>Gestión del consentimiento</h3>
            <p>
              Al acceder a GlobeMate por primera vez se te muestra un aviso donde puedes
              aceptar o rechazar las cookies de analítica. Las cookies de analítica
              <strong> solo se instalan si aceptas</strong>. Puedes retirar tu consentimiento
              en cualquier momento borrando las cookies y el almacenamiento local del sitio
              en la configuración de tu navegador; al volver a visitar GlobeMate se te
              mostrará de nuevo la opción de elección.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>10. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad. Cuando los cambios sean
              significativos, te lo notificaremos por correo electrónico o mediante un
              aviso destacado en la app. La fecha de «última actualización» en el
              encabezado refleja siempre la versión vigente.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política o el tratamiento de tus datos:
              <br />
              <a href="mailto:support@globemate.app">support@globemate.app</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
