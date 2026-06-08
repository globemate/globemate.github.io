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

export default function Terms({ onBack }) {
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
          <h1 className="legal-title">Términos y <em>Condiciones</em></h1>
          <p className="legal-updated">Última actualización: junio 2026</p>
        </div>

        <div className="legal-body">

          <div className="legal-section">
            <h2>1. Identificación del titular</h2>
            <p>
              En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la
              Información y de Comercio Electrónico (LSSI-CE), se informa que GlobeMate
              es operada por:
            </p>
            <ul>
              <li><strong>Titular:</strong> <span className="legal-placeholder">[NOMBRE COMPLETO Y NIF DE LA AUTÓNOMA - PENDIENTE]</span></li>
              <li><strong>Actividad:</strong> Plataforma digital de contacto entre viajeros</li>
              <li><strong>Domicilio:</strong> España</li>
              <li><strong>Correo electrónico:</strong> <a href="mailto:support@globemate.app">support@globemate.app</a></li>
              <li><strong>Sitio web:</strong> <a href="https://globemate.app">globemate.app</a></li>
            </ul>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>2. Objeto y aceptación</h2>
            <p>
              Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma
              GlobeMate (en adelante, «el Servicio»). Al registrarte o utilizar el Servicio,
              aceptas estos términos en su totalidad. Si no los aceptas, no debes utilizar
              GlobeMate.
            </p>
            <p>
              El Servicio está dirigido exclusivamente a personas mayores de 18 años.
              Registrarte implica declarar que cumples este requisito de edad.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>3. Descripción del servicio</h2>
            <p>
              GlobeMate es una plataforma que conecta a personas con intereses viajeros
              afines para facilitar la comunicación, el intercambio de experiencias y la
              planificación de viajes. GlobeMate <strong>no es una agencia de viajes</strong>{" "}
              ni garantiza la realización de ningún encuentro, viaje o actividad.
            </p>
            <p>
              El Servicio incluye funcionalidades gratuitas y planes de pago (Premium).
              Las características de cada plan se describen en la sección Planes del sitio.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>4. Registro y cuenta de usuario</h2>
            <ul>
              <li>Debes proporcionar información veraz, actualizada y completa en el registro.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Cada persona puede tener una única cuenta. Está prohibida la creación de cuentas falsas o en nombre de terceros.</li>
              <li>Notifica de inmediato a <a href="mailto:support@globemate.app">support@globemate.app</a> si sospechas que tu cuenta ha sido comprometida.</li>
            </ul>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>5. Normas de conducta</h2>
            <p>Al utilizar GlobeMate te comprometes a <strong>no</strong>:</p>
            <ul>
              <li>Publicar contenido falso, engañoso, ofensivo, racista, sexista, pornográfico o ilegal.</li>
              <li>Acosar, amenazar o intimidar a otros usuarios.</li>
              <li>Usar el Servicio para actividades comerciales no autorizadas, spam o phishing.</li>
              <li>Suplantar la identidad de otra persona o entidad.</li>
              <li>Intentar acceder de forma no autorizada a sistemas, cuentas o datos.</li>
              <li>Usar bots, scrapers u otros medios automatizados para acceder al Servicio.</li>
              <li>Compartir datos de contacto (teléfono, email, redes sociales) en perfiles o conversaciones con fines de captación fuera de la plataforma en el plan gratuito.</li>
            </ul>
            <p>
              Nos reservamos el derecho a suspender o eliminar cuentas que infrinjan estas
              normas sin previo aviso y sin derecho a reembolso.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>6. Planes de pago y política de reembolso</h2>
            <h3>Contratación</h3>
            <p>
              Los planes Premium se contratan mediante pago previo por el período elegido
              (mensual o anual). La contratación implica la aceptación expresa de estos
              Términos.
            </p>
            <h3>Derecho de desistimiento</h3>
            <p>
              Conforme al artículo 103.a) del Real Decreto Legislativo 1/2007 (TRLGDCU),
              una vez activado el acceso a las funciones Premium, <strong>renuncias
              expresamente al derecho de desistimiento de 14 días</strong> al tratarse de
              contenido digital de ejecución inmediata.
            </p>
            <h3>Renovación y cancelación</h3>
            <p>
              Los planes se renuevan automáticamente al final de cada período salvo que los
              canceles antes de la fecha de renovación desde los ajustes de tu cuenta.
              No se realizan reembolsos proporcionales por cancelación anticipada.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>7. Propiedad intelectual</h2>
            <p>
              Todos los contenidos de GlobeMate (diseño, código, textos, logotipos,
              imágenes propias) son propiedad de{" "}
              <span className="legal-placeholder">[NOMBRE COMPLETO Y NIF DE LA AUTÓNOMA - PENDIENTE]</span>{" "}
              o de sus licenciantes, y están protegidos por la legislación sobre propiedad
              intelectual e industrial. Queda prohibida su reproducción total o parcial sin
              autorización escrita.
            </p>
            <p>
              Al subir contenido a la plataforma (fotos de perfil, mensajes, etc.) concedes
              a GlobeMate una licencia no exclusiva, gratuita y mundial para mostrarlo
              dentro del Servicio con el único fin de prestarlo. Esta licencia termina cuando
              eliminas el contenido o tu cuenta.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>8. Limitación de responsabilidad</h2>
            <p>
              GlobeMate actúa como plataforma intermediaria y <strong>no es responsable</strong> de:
            </p>
            <ul>
              <li>El comportamiento de los usuarios dentro o fuera de la plataforma.</li>
              <li>La veracidad de la información que los usuarios publican en sus perfiles.</li>
              <li>Daños derivados de encuentros físicos entre usuarios.</li>
              <li>Interrupciones del servicio por causas de fuerza mayor o mantenimiento.</li>
              <li>Pérdidas de datos ajenas a nuestra negligencia.</li>
            </ul>
            <p>
              En ningún caso la responsabilidad de GlobeMate por daños directos superará
              el importe abonado por el usuario en los últimos 3 meses.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>9. Modificación y suspensión del servicio</h2>
            <p>
              Nos reservamos el derecho a modificar, suspender o interrumpir el Servicio
              (total o parcialmente) en cualquier momento. Cuando los cambios sean
              sustanciales, lo notificaremos con antelación razonable. Las modificaciones de
              los Términos entrarán en vigor 30 días después de su publicación.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>10. Legislación aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación española. Para la resolución de
              conflictos, las partes se someten a los Juzgados y Tribunales del domicilio
              del consumidor (si aplica la normativa de consumidores) o, en su defecto, a
              los de España, con renuncia expresa a cualquier otro fuero.
            </p>
            <p>
              Para resolver controversias en línea puedes utilizar también la plataforma
              de resolución de litigios de la UE:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                ec.europa.eu/consumers/odr
              </a>.
            </p>
          </div>

          <div className="legal-divider" />

          <div className="legal-section">
            <h2>Contacto</h2>
            <p>
              Para cualquier consulta sobre estos Términos:
              <br />
              <a href="mailto:support@globemate.app">support@globemate.app</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
