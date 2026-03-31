import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type BaseTemplateProps = {
  preview: string;
  heading: string;
  greeting: string;
  context: string;
  ctaLabel: string;
  ctaUrl: string;
  fallbackLabel: string;
  footer: string;
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
}: BaseTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
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
