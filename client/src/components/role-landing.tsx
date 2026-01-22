import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { CheckCircle } from "lucide-react";
import type { RoleLandingContent } from "@/content/role-landing";

type RoleLandingPageProps = {
  content: RoleLandingContent;
  mapSlot?: React.ReactNode;
};

export default function RoleLandingPage({
  content,
  mapSlot,
}: RoleLandingPageProps) {
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${content.seo.canonicalPath}`
      : undefined;

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={
        {
          "--paper": "#fdf7f0",
          "--ink": "#121314",
          "--accent": "#f97316",
          "--accent-dark": "#c2410c",
          "--oxide": "#3a2f2f",
          "--mint": "#dff7ef",
          "--sky": "#e7f0ff",
          background:
            "radial-gradient(circle at 20% 0%, #ffe5c2 0%, #fff8ee 45%, #e9f1ff 100%)",
          fontFamily:
            '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
      <SEOHead
        title={content.seo.title}
        description={content.seo.description}
        keywords={content.seo.keywords}
        canonicalUrl={canonicalUrl}
        noIndex={content.seo.noIndex}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">
              {content.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight text-[var(--ink)]">
              {content.headline}
            </h1>
            <p className="text-lg text-slate-700">{content.subhead}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="px-6 py-6 text-base bg-[var(--ink)] text-white hover:bg-black"
              >
                <Link href={content.primaryCta.href}>
                  {content.primaryCta.label}
                </Link>
              </Button>
              {content.secondaryCta && (
                <Button
                  asChild
                  variant="outline"
                  className="px-6 py-6 text-base border-slate-300"
                >
                  <Link href={content.secondaryCta.href}>
                    {content.secondaryCta.label}
                  </Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              {content.bullets.map((bullet) => (
                <span key={bullet} className="inline-flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                  {bullet}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-orange-200/70 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-200/70 blur-2xl" />
            <Card className="border border-slate-200 shadow-2xl bg-white/95">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {content.map.kicker}
                    </p>
                    <p className="text-lg font-semibold text-[var(--ink)]">
                      {content.map.title}
                    </p>
                  </div>
                  {content.map.badge && (
                    <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {content.map.badge}
                    </div>
                  )}
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 bg-[linear-gradient(140deg,_#f6efe1,_#fff4e6_50%,_#e6eeff)]">
                  {mapSlot ?? (
                    <>
                      <div className="absolute left-6 top-8 h-4 w-4 rounded-full bg-orange-500 shadow-[0_0_0_8px_rgba(249,115,22,0.18)]" />
                      <div className="absolute right-12 top-16 h-3 w-3 rounded-full bg-slate-700 shadow-[0_0_0_6px_rgba(15,23,42,0.12)]" />
                      <div className="absolute left-20 bottom-12 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
                      <div className="absolute right-16 bottom-6 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_0_6px_rgba(249,115,22,0.18)]" />
                      {content.map.hint && (
                        <div className="absolute left-6 bottom-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                          {content.map.hint}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {content.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-lg md:grid-cols-3">
          {content.valueProps.map((value) => (
            <div key={value.text} className="flex items-center gap-3">
              <value.icon className="h-5 w-5 text-orange-500" />
              {value.text}
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {content.steps.map((step) => (
            <Card key={step.title} className="border border-slate-200 bg-white">
              <CardContent className="p-6 space-y-3">
                <step.icon className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">{step.copy}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200 bg-white/95">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                {content.reasons.title}
              </h3>
              <div className="grid gap-3 text-sm text-slate-600">
                {content.reasons.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-900 bg-[var(--ink)] text-white shadow-xl">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                {content.starter.kicker}
              </p>
              <h3 className="text-2xl font-semibold text-white">
                {content.starter.title}
              </h3>
              <p className="text-sm text-slate-200">{content.starter.copy}</p>
              <ul className="text-sm text-slate-100 space-y-2">
                {content.starter.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl bg-[var(--ink)] px-6 py-10 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-semibold">{content.finalCta.title}</h2>
          <p className="mt-3 text-sm text-slate-300">
            {content.finalCta.copy}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              asChild
              className="px-6 py-6 text-base bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link href={content.finalCta.primary.href}>
                {content.finalCta.primary.label}
              </Link>
            </Button>
            {content.finalCta.secondary && (
              <Button
                asChild
                variant="outline"
                className="px-6 py-6 text-base text-white border-white/30 hover:text-white"
              >
                <Link href={content.finalCta.secondary.href}>
                  {content.finalCta.secondary.label}
                </Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
