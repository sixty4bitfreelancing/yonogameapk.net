export type DeploymentEnv = "production" | "preview" | "development";

/**
 * Resolved at build time for static pages. SITE_ENV wins; otherwise Vercel and Netlify
 * variables are recognised. A build with none of these set is treated as production, so
 * staging hosts without those platform variables must set SITE_ENV=preview.
 */
export function deploymentEnv(): DeploymentEnv {
  const explicit = process.env.SITE_ENV;
  if (explicit === "production" || explicit === "preview" || explicit === "development") return explicit;

  const vercel = process.env.VERCEL_ENV;
  if (vercel) return vercel === "production" ? "production" : vercel === "preview" ? "preview" : "development";

  const netlify = process.env.CONTEXT;
  if (netlify) return netlify === "production" ? "production" : netlify === "dev" ? "development" : "preview";

  return process.env.NODE_ENV === "development" ? "development" : "production";
}

export const isProductionDeployment = deploymentEnv() === "production";
