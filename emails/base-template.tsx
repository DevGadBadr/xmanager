import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import { ensureAppPath } from "@/lib/auth-path";
import { getEnv } from "@/lib/env";

type BaseTemplateProps = {
  preview: string;
  heading: string;
  greeting: string;
  context: string;
  ctaLabel: string;
  ctaUrl: string;
  fallbackLabel: string;
  footer: string;
  brandLogoUrl?: string;
  brandSlogan?: string;
};

export function BaseTemplate({
  preview,
  heading,
  greeting,
  context,
  ctaLabel,
  ctaUrl,
  fallbackLabel,
  footer,
  brandLogoUrl,
  brandSlogan,
}: BaseTemplateProps) {
  const env = getEnv();
  const resolvedBrandLogoUrl = brandLogoUrl ?? `${env.APP_URL}${ensureAppPath("/api/email-brand")}`;
  const resolvedBrandSlogan = brandSlogan ?? "Xlabs Technology Management";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {resolvedBrandLogoUrl || resolvedBrandSlogan ? (
            <Section style={brandSection}>
              {resolvedBrandLogoUrl ? (
                <Img
                  alt="Flow logo"
                  height="30"
                  src={resolvedBrandLogoUrl}
                  style={brandLogo}
                  width="94"
                />
              ) : null}
              {resolvedBrandSlogan ? <Text style={brandSloganStyle}>{resolvedBrandSlogan}</Text> : null}
            </Section>
          ) : null}
          <Heading style={headingStyle}>{heading}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>{context}</Text>
          <Section style={buttonRow}>
            <Button href={ctaUrl} style={button}>
              {ctaLabel}
            </Button>
          </Section>
          <Text style={fallback}>
            {fallbackLabel}: {ctaUrl}
          </Text>
          <Hr style={divider} />
          <Text style={footerStyle}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f7fb",
  fontFamily: "Inter, Arial, sans-serif",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const headingStyle = {
  color: "#111827",
  fontSize: "24px",
  marginBottom: "20px",
};

const brandSection = {
  backgroundColor: "#0f172a",
  borderRadius: "16px",
  marginBottom: "24px",
  padding: "18px 20px",
};

const brandLogo = {
  display: "block",
  height: "30px",
  margin: "0 0 10px",
  width: "94px",
};

const brandSloganStyle = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: "600",
  letterSpacing: "0.04em",
  lineHeight: "20px",
  margin: "0",
};

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
};

const buttonRow = {
  margin: "28px 0",
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 22px",
  textDecoration: "none",
};

const fallback = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  wordBreak: "break-all" as const,
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footerStyle = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
};
