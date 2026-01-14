/**
 * Welcome email template for new users.
 */

import { baseLayout, type WelcomeEmailData } from "./base";

const content = {
  en: {
    preview: "Welcome to Kiniro List! Your anime tracking journey starts now.",
    greeting: (name: string | null) => (name ? `Welcome, ${name}!` : "Welcome to Kiniro List!"),
    intro:
      "We're thrilled to have you join our community of anime enthusiasts. Kiniro List is your personal companion for tracking, discovering, and organizing your anime journey.",
    features: "Here's what you can do:",
    feature1: "Track your watching progress across all your favorite series",
    feature2: "Never miss an episode with our personalized calendar",
    feature3: "Discover new anime based on current seasons and trends",
    feature4: "Organize your library with custom lists and filters",
    cta: "Start Exploring",
    closing: "If you have any questions or feedback, we'd love to hear from you. Happy watching!",
    signature: "The Kiniro List Team",
  },
  es: {
    preview: "Bienvenido a Kiniro List. Tu viaje de seguimiento de anime comienza ahora.",
    greeting: (name: string | null) =>
      name ? `Bienvenido, ${name}!` : "Bienvenido a Kiniro List!",
    intro:
      "Estamos encantados de que te unas a nuestra comunidad de entusiastas del anime. Kiniro List es tu compañero personal para rastrear, descubrir y organizar tu viaje anime.",
    features: "Esto es lo que puedes hacer:",
    feature1: "Sigue tu progreso en todas tus series favoritas",
    feature2: "No te pierdas ningún episodio con nuestro calendario personalizado",
    feature3: "Descubre nuevo anime basado en temporadas actuales y tendencias",
    feature4: "Organiza tu biblioteca con listas personalizadas y filtros",
    cta: "Comenzar a Explorar",
    closing:
      "Si tienes alguna pregunta o comentario, nos encantaría escucharte. Disfruta viendo anime!",
    signature: "El Equipo de Kiniro List",
  },
};

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const locale = data.locale ?? "en";
  const t = content[locale];

  const body = `
    <h2>${t.greeting(data.displayName)}</h2>
    <p>${t.intro}</p>
    <p><strong>${t.features}</strong></p>
    <p>
      ${t.feature1}<br>
      ${t.feature2}<br>
      ${t.feature3}<br>
      ${t.feature4}
    </p>
    <a href="https://kinirolist.app" class="btn">${t.cta}</a>
    <p>${t.closing}</p>
    <p>— ${t.signature}</p>
  `;

  return baseLayout(body, t.preview, locale);
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  const t = content[data.locale ?? "en"];

  return `
${t.greeting(data.displayName)}

${t.intro}

${t.features}
• ${t.feature1}
• ${t.feature2}
• ${t.feature3}
• ${t.feature4}

${t.cta}: https://kinirolist.app

${t.closing}

— ${t.signature}
  `.trim();
}

export function welcomeEmailSubject(locale: "en" | "es" = "en"): string {
  return locale === "es" ? "Bienvenido a Kiniro List" : "Welcome to Kiniro List";
}
