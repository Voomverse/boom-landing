export const siteOrigin = "https://www.voomverse.com";
export const pages = [
  {
    path: "/",
    variant: "ven",
    title: "Voomverse · VOOM | VEN, acceso anticipado a tus ídolos",
    description:
      "Descubre VOOM, de Voomverse. Apúntate gratis a VEN, dinos qué celebrity te inspira y recibe noticias antes de la apertura. Para mayores de 18 años.",
  },
  {
    path: "/secreto/",
    variant: "secreto",
    title: "SECRETO · Aprende de tus ídolos | VOOM · Voomverse",
    description:
      "Descubre SECRETO, una propuesta de VOOM para aprender de celebrities. Dinos quién te inspira y apúntate al acceso anticipado VEN de Voomverse.",
  },
  {
    path: "/antes-de-morir/",
    variant: "antes-de-morir",
    title: "ANTES DE MORIR · Golden Ticket | VOOM · Voomverse",
    description:
      "Conoce la propuesta Golden Ticket de VOOM: experiencias junto a celebrities. Registra tu interés en VEN, la campaña de acceso anticipado de Voomverse.",
  },
  {
    path: "/quanta/",
    variant: "quanta",
    title: "QUANTA · Experiencias con celebrities | VOOM · Voomverse",
    description:
      "Descubre QUANTA, la propuesta de VOOM para acercarte al universo de las celebrities. Apúntate gratis a VEN y expresa tu interés sin realizar pagos.",
  },
  {
    path: "/privacidad/",
    title: "Política de privacidad de VEN | VOOM · Voomverse",
    description:
      "Consulta cómo Voomverse trata tus datos en VEN, las finalidades del formulario, la analítica de visitas y tus derechos de privacidad.",
  },
];
export function structuredData(page) {
  const canonical = siteOrigin + page.path;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: "Voomverse",
        legalName: "Voomverse, S.L.U.",
        alternateName: "VOOM",
        url: siteOrigin + "/",
        logo: {
          "@type": "ImageObject",
          url: siteOrigin + "/assets/voom-logo.webp",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteOrigin}/#website`,
        name: "Voomverse",
        alternateName: "VOOM",
        url: siteOrigin + "/",
        inLanguage: "es",
        publisher: { "@id": `${siteOrigin}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        url: canonical,
        name: page.title,
        description: page.description,
        inLanguage: "es",
        isPartOf: { "@id": `${siteOrigin}/#website` },
        about: { "@id": `${siteOrigin}/#organization` },
      },
    ],
  };
}
export function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
export function metadata(page) {
  const url = siteOrigin + page.path;
  const title = escapeHtml(page.title),
    description = escapeHtml(page.description);
  return `<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Voomverse · VOOM">
<meta property="og:locale" content="es_ES">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${siteOrigin}/assets/social.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="VEN · Entra antes de que VOOM abra. Una propuesta de Voomverse.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${siteOrigin}/assets/social.jpg">
<meta name="twitter:image:alt" content="VEN · VOOM, de Voomverse">
<script type="application/ld+json">${JSON.stringify(structuredData(page)).replace(/</g, "\\u003c")}</script>`;
}
